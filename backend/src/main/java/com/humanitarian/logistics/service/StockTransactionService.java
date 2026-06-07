package com.humanitarian.logistics.service;

import com.humanitarian.logistics.dto.StockTransactionCreate;
import com.humanitarian.logistics.dto.StockTransactionDto;
import com.humanitarian.logistics.model.Cargo;
import com.humanitarian.logistics.model.StockTransaction;
import com.humanitarian.logistics.model.Warehouse;
import com.humanitarian.logistics.repository.CargoRepository;
import com.humanitarian.logistics.repository.StockTransactionRepository;
import com.humanitarian.logistics.repository.WarehouseRepository;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockTransactionService {

    private final StockTransactionRepository transactionRepository;
    private final WarehouseRepository warehouseRepository;
    private final CargoRepository cargoRepository;
    private final InventoryService inventoryService;
    private final TransactionMapper mapper;
    private final AuditLogService auditLogService;

    public StockTransactionService(
            StockTransactionRepository transactionRepository,
            WarehouseRepository warehouseRepository,
            CargoRepository cargoRepository,
            InventoryService inventoryService,
            TransactionMapper mapper,
            AuditLogService auditLogService) {
        this.transactionRepository = transactionRepository;
        this.warehouseRepository = warehouseRepository;
        this.cargoRepository = cargoRepository;
        this.inventoryService = inventoryService;
        this.mapper = mapper;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<StockTransactionDto> findAll() {
        return transactionRepository.findAll().stream().map(mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public StockTransactionDto findById(Long id) {
        if (id == null) throw new IllegalArgumentException("id is required");
        return transactionRepository.findById(id).map(mapper::toDto).orElseThrow();
    }

    @Transactional
    public StockTransactionDto create(StockTransactionCreate dto) {
        if (dto == null) throw new IllegalArgumentException("request body is required");
        if (dto.quantity() == null || dto.quantity() <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        var type = Objects.requireNonNull(dto.type(), "type is required");
        Long cargoId = Objects.requireNonNull(dto.cargoId(), "cargoId is required");
        Cargo cargo = cargoRepository.findById(cargoId).orElseThrow();
        StockTransaction tx = new StockTransaction();
        tx.setCargo(cargo);
        tx.setQuantity(dto.quantity());
        tx.setOccurredAt(dto.occurredAt() != null ? dto.occurredAt() : Instant.now());
        tx.setNotes(dto.notes());
        tx.setRelatedRequestId(dto.relatedRequestId());
        tx.setType(type);

        switch (type) {
            case INBOUND -> {
                Long toWarehouseId = Objects.requireNonNull(dto.toWarehouseId(), "INBOUND requires toWarehouseId");
                if (dto.fromWarehouseId() != null) {
                    throw new IllegalArgumentException("INBOUND does not allow fromWarehouseId");
                }
                Warehouse to = warehouseRepository.findById(toWarehouseId).orElseThrow();
                tx.setToWarehouse(to);
                tx.setFromWarehouse(null);
                inventoryService.addToWarehouse(to.getId(), cargoId, dto.quantity());
            }
            case OUTBOUND -> {
                Long fromWarehouseId = Objects.requireNonNull(dto.fromWarehouseId(), "OUTBOUND requires fromWarehouseId");
                if (dto.toWarehouseId() != null) {
                    throw new IllegalArgumentException("OUTBOUND does not allow toWarehouseId");
                }
                Warehouse from = warehouseRepository.findById(fromWarehouseId).orElseThrow();
                tx.setFromWarehouse(from);
                tx.setToWarehouse(null);
                inventoryService.removeFromWarehouse(from.getId(), cargoId, dto.quantity());
            }
            case TRANSFER -> {
                Long fromWarehouseId = Objects.requireNonNull(dto.fromWarehouseId(), "TRANSFER requires fromWarehouseId");
                Long toWarehouseId = Objects.requireNonNull(dto.toWarehouseId(), "TRANSFER requires toWarehouseId");
                if (fromWarehouseId.equals(toWarehouseId)) {
                    throw new IllegalArgumentException("from and to warehouses must differ");
                }
                Warehouse from = warehouseRepository.findById(fromWarehouseId).orElseThrow();
                Warehouse to = warehouseRepository.findById(toWarehouseId).orElseThrow();
                tx.setFromWarehouse(from);
                tx.setToWarehouse(to);
                inventoryService.removeFromWarehouse(from.getId(), cargoId, dto.quantity());
                inventoryService.addToWarehouse(to.getId(), cargoId, dto.quantity());
            }
        }

        StockTransaction saved = transactionRepository.save(tx);
        auditLogService.log(
                "TRANSACTION_CREATE",
                "StockTransaction",
                saved.getId(),
                "type=" + saved.getType()
                        + ", cargoId=" + cargoId
                        + ", qty=" + saved.getQuantity()
                        + ", fromWarehouseId=" + (saved.getFromWarehouse() != null ? saved.getFromWarehouse().getId() : null)
                        + ", toWarehouseId=" + (saved.getToWarehouse() != null ? saved.getToWarehouse().getId() : null)
                        + ", relatedRequestId=" + saved.getRelatedRequestId());
        return mapper.toDto(saved);
    }

    @Transactional
    public StockTransactionDto update(Long id, String notes) {
        if (id == null) throw new IllegalArgumentException("id is required");
        StockTransaction tx = transactionRepository.findById(id).orElseThrow();
        tx.setNotes(notes);
        return mapper.toDto(transactionRepository.save(tx));
    }

    @Transactional
    public void delete(Long id) {
        if (id == null) throw new IllegalArgumentException("id is required");
        StockTransaction tx = transactionRepository.findById(id).orElseThrow();
        if (tx.getRelatedRequestId() != null) {
            throw new IllegalStateException("Cannot delete transaction linked to a request");
        }
        Cargo cargo = tx.getCargo();
        int qty = tx.getQuantity();

        switch (tx.getType()) {
            case INBOUND -> {
                if (tx.getToWarehouse() != null) {
                    inventoryService.removeFromWarehouse(tx.getToWarehouse().getId(), cargo.getId(), qty);
                }
            }
            case OUTBOUND -> {
                if (tx.getFromWarehouse() != null) {
                    inventoryService.addToWarehouse(tx.getFromWarehouse().getId(), cargo.getId(), qty);
                }
            }
            case TRANSFER -> {
                if (tx.getFromWarehouse() != null && tx.getToWarehouse() != null) {
                    inventoryService.addToWarehouse(tx.getFromWarehouse().getId(), cargo.getId(), qty);
                    inventoryService.removeFromWarehouse(tx.getToWarehouse().getId(), cargo.getId(), qty);
                }
            }
        }
        transactionRepository.delete(tx);
    }
}
