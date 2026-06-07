package com.humanitarian.logistics.service;

import com.humanitarian.logistics.dto.AidRequestCreateUpdate;
import com.humanitarian.logistics.dto.AidRequestDto;
import com.humanitarian.logistics.dto.StockTransactionCreate;
import com.humanitarian.logistics.model.AidRequest;
import com.humanitarian.logistics.model.Cargo;
import com.humanitarian.logistics.model.RequestStatus;
import com.humanitarian.logistics.model.TransactionType;
import com.humanitarian.logistics.model.Warehouse;
import com.humanitarian.logistics.repository.AidRequestRepository;
import com.humanitarian.logistics.repository.CargoRepository;
import com.humanitarian.logistics.repository.WarehouseRepository;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AidRequestService {

    private final AidRequestRepository aidRequestRepository;
    private final WarehouseRepository warehouseRepository;
    private final CargoRepository cargoRepository;
    private final StockTransactionService stockTransactionService;
    private final AuditLogService auditLogService;

    public AidRequestService(
            AidRequestRepository aidRequestRepository,
            WarehouseRepository warehouseRepository,
            CargoRepository cargoRepository,
            StockTransactionService stockTransactionService,
            AuditLogService auditLogService) {
        this.aidRequestRepository = aidRequestRepository;
        this.warehouseRepository = warehouseRepository;
        this.cargoRepository = cargoRepository;
        this.stockTransactionService = stockTransactionService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<AidRequestDto> findAll() {
        return aidRequestRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public AidRequestDto findById(Long id) {
        if (id == null) throw new IllegalArgumentException("id is required");
        return aidRequestRepository.findById(id).map(this::toDto).orElseThrow();
    }

    @Transactional
    public AidRequestDto create(AidRequestCreateUpdate dto) {
        if (dto == null) throw new IllegalArgumentException("request body is required");
        Long warehouseId = Objects.requireNonNull(dto.warehouseId(), "warehouseId is required");
        Long cargoId = Objects.requireNonNull(dto.cargoId(), "cargoId is required");
        if (dto.quantityRequested() == null || dto.quantityRequested() <= 0) {
            throw new IllegalArgumentException("quantityRequested must be positive");
        }
        Warehouse w = warehouseRepository.findById(warehouseId).orElseThrow();
        Cargo c = cargoRepository.findById(cargoId).orElseThrow();
        AidRequest r = new AidRequest();
        r.setWarehouse(w);
        r.setCargo(c);
        r.setQuantityRequested(dto.quantityRequested());
        r.setStatus(dto.status() != null ? dto.status() : RequestStatus.PENDING);
        r.setNotes(dto.notes());
        r.setCreatedAt(Instant.now());
        AidRequest saved = aidRequestRepository.save(r);
        auditLogService.log(
                "AID_REQUEST_CREATE",
                "AidRequest",
                saved.getId(),
                "status=" + saved.getStatus()
                        + ", warehouseId=" + warehouseId
                        + ", cargoId=" + cargoId
                        + ", qty=" + saved.getQuantityRequested());
        return toDto(saved);
    }

    @Transactional
    public AidRequestDto update(Long id, AidRequestCreateUpdate dto) {
        if (id == null) throw new IllegalArgumentException("id is required");
        if (dto == null) throw new IllegalArgumentException("request body is required");
        Long warehouseId = Objects.requireNonNull(dto.warehouseId(), "warehouseId is required");
        Long cargoId = Objects.requireNonNull(dto.cargoId(), "cargoId is required");
        if (dto.quantityRequested() == null || dto.quantityRequested() <= 0) {
            throw new IllegalArgumentException("quantityRequested must be positive");
        }
        AidRequest r = aidRequestRepository.findById(id).orElseThrow();
        if (r.getStatus() == RequestStatus.FULFILLED) {
            throw new IllegalStateException("Cannot modify fulfilled request");
        }
        if (r.getStatus() == RequestStatus.REJECTED && dto.status() != RequestStatus.REJECTED) {
            throw new IllegalStateException("Rejected request cannot be reopened");
        }
        Warehouse w = warehouseRepository.findById(warehouseId).orElseThrow();
        Cargo c = cargoRepository.findById(cargoId).orElseThrow();
        r.setWarehouse(w);
        r.setCargo(c);
        r.setQuantityRequested(dto.quantityRequested());
        if (dto.status() != null) {
            r.setStatus(dto.status());
        }
        r.setNotes(dto.notes());
        AidRequest saved = aidRequestRepository.save(r);
        auditLogService.log(
                "AID_REQUEST_UPDATE",
                "AidRequest",
                saved.getId(),
                "status=" + saved.getStatus()
                        + ", warehouseId=" + warehouseId
                        + ", cargoId=" + cargoId
                        + ", qty=" + saved.getQuantityRequested());
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (id == null) throw new IllegalArgumentException("id is required");
        aidRequestRepository.deleteById(id);
    }

    @Transactional
    public AidRequestDto approve(Long id) {
        if (id == null) throw new IllegalArgumentException("id is required");
        AidRequest r = aidRequestRepository.findById(id).orElseThrow();
        if (r.getStatus() == RequestStatus.FULFILLED) {
            throw new IllegalStateException("Cannot approve fulfilled request");
        }
        if (r.getStatus() == RequestStatus.REJECTED) {
            throw new IllegalStateException("Rejected request cannot be approved");
        }
        r.setStatus(RequestStatus.APPROVED);
        AidRequest saved = aidRequestRepository.save(r);
        auditLogService.log("AID_REQUEST_APPROVE", "AidRequest", saved.getId(), "status=APPROVED");
        return toDto(saved);
    }

    @Transactional
    public AidRequestDto reject(Long id, String reason) {
        if (id == null) throw new IllegalArgumentException("id is required");
        AidRequest r = aidRequestRepository.findById(id).orElseThrow();
        if (r.getStatus() == RequestStatus.FULFILLED) {
            throw new IllegalStateException("Cannot reject fulfilled request");
        }
        r.setStatus(RequestStatus.REJECTED);
        if (reason != null && !reason.isBlank()) {
            String suffix = "Rejected: " + reason.trim();
            r.setNotes(r.getNotes() == null || r.getNotes().isBlank() ? suffix : (r.getNotes() + "\n" + suffix));
        }
        AidRequest saved = aidRequestRepository.save(r);
        auditLogService.log(
                "AID_REQUEST_REJECT",
                "AidRequest",
                saved.getId(),
                "status=REJECTED" + (reason != null && !reason.isBlank() ? (", reason=" + reason.trim()) : ""));
        return toDto(saved);
    }

    /**
     * Виконання заявки: відпуск вантажу зі складу (OUTBOUND) та зміна статусу на FULFILLED.
     */
    @Transactional
    public AidRequestDto fulfill(Long id) {
        if (id == null) throw new IllegalArgumentException("id is required");
        AidRequest r = aidRequestRepository.findById(id).orElseThrow();
        if (r.getStatus() == RequestStatus.FULFILLED) {
            throw new IllegalStateException("Request already fulfilled");
        }
        if (r.getStatus() == RequestStatus.REJECTED) {
            throw new IllegalStateException("Cannot fulfill rejected request");
        }
        if (r.getStatus() != RequestStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED requests can be fulfilled");
        }
        var outbound = new StockTransactionCreate(
                TransactionType.OUTBOUND,
                r.getWarehouse().getId(),
                null,
                r.getCargo().getId(),
                r.getQuantityRequested(),
                "Fulfillment of aid request #" + r.getId(),
                r.getId());
        stockTransactionService.create(outbound);
        r.setStatus(RequestStatus.FULFILLED);
        AidRequest saved = aidRequestRepository.save(r);
        auditLogService.log(
                "AID_REQUEST_FULFILL",
                "AidRequest",
                saved.getId(),
                "status=FULFILLED, outboundQty=" + saved.getQuantityRequested());
        return toDto(saved);
    }

    private AidRequestDto toDto(AidRequest r) {
        return new AidRequestDto(
                r.getId(),
                r.getWarehouse().getId(),
                r.getWarehouse().getName(),
                r.getCargo().getId(),
                r.getCargo().getName(),
                r.getQuantityRequested(),
                r.getStatus(),
                r.getNotes(),
                r.getCreatedAt());
    }
}
