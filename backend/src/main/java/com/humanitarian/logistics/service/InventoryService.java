package com.humanitarian.logistics.service;

import com.humanitarian.logistics.model.Cargo;
import com.humanitarian.logistics.model.Warehouse;
import com.humanitarian.logistics.model.WarehouseStock;
import com.humanitarian.logistics.repository.CargoRepository;
import com.humanitarian.logistics.repository.WarehouseRepository;
import com.humanitarian.logistics.repository.WarehouseStockRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    private final WarehouseStockRepository warehouseStockRepository;
    private final WarehouseRepository warehouseRepository;
    private final CargoRepository cargoRepository;

    public InventoryService(
            WarehouseStockRepository warehouseStockRepository,
            WarehouseRepository warehouseRepository,
            CargoRepository cargoRepository) {
        this.warehouseStockRepository = warehouseStockRepository;
        this.warehouseRepository = warehouseRepository;
        this.cargoRepository = cargoRepository;
    }

    @Transactional(readOnly = true)
    public int getQuantityOnHand(Long warehouseId, Long cargoId) {
        if (warehouseId == null || cargoId == null) {
            throw new IllegalArgumentException("warehouseId and cargoId are required");
        }
        Warehouse w = warehouseRepository.findById(warehouseId).orElseThrow();
        Cargo c = cargoRepository.findById(cargoId).orElseThrow();
        return warehouseStockRepository
                .findByWarehouseAndCargo(w, c)
                .map(WarehouseStock::getQuantityOnHand)
                .orElse(0);
    }

    @Transactional
    public void addToWarehouse(Long warehouseId, Long cargoId, int quantity) {
        if (warehouseId == null || cargoId == null) {
            throw new IllegalArgumentException("warehouseId and cargoId are required");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        Warehouse warehouse = warehouseRepository.findById(warehouseId).orElseThrow();
        Cargo cargo = cargoRepository.findById(cargoId).orElseThrow();
        WarehouseStock line = warehouseStockRepository
                .findWithWriteLockByWarehouseAndCargo(warehouse, cargo)
                .orElseGet(() -> initStockLine(warehouse, cargo));
        line.setQuantityOnHand(line.getQuantityOnHand() + quantity);
        saveOrReloadOnConcurrentInsert(line, warehouse, cargo, quantity);
    }

    @Transactional
    public void removeFromWarehouse(Long warehouseId, Long cargoId, int quantity) {
        if (warehouseId == null || cargoId == null) {
            throw new IllegalArgumentException("warehouseId and cargoId are required");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        Warehouse warehouse = warehouseRepository.findById(warehouseId).orElseThrow();
        Cargo cargo = cargoRepository.findById(cargoId).orElseThrow();
        WarehouseStock line = warehouseStockRepository
                .findWithWriteLockByWarehouseAndCargo(warehouse, cargo)
                .orElseThrow(() -> new IllegalStateException("No stock line for this warehouse and cargo"));
        int next = line.getQuantityOnHand() - quantity;
        if (next < 0) {
            throw new IllegalStateException("Insufficient stock: need " + quantity + ", have " + line.getQuantityOnHand());
        }
        line.setQuantityOnHand(next);
        warehouseStockRepository.save(line);
    }

    private WarehouseStock initStockLine(Warehouse warehouse, Cargo cargo) {
        WarehouseStock ws = new WarehouseStock();
        ws.setWarehouse(warehouse);
        ws.setCargo(cargo);
        ws.setQuantityOnHand(0);
        return ws;
    }

    @SuppressWarnings("null")
    private void saveOrReloadOnConcurrentInsert(WarehouseStock line, Warehouse warehouse, Cargo cargo, int delta) {
        try {
            warehouseStockRepository.save(line);
        } catch (DataIntegrityViolationException ex) {
            WarehouseStock existing = warehouseStockRepository
                    .findWithWriteLockByWarehouseAndCargo(warehouse, cargo)
                    .orElseThrow(() -> ex);
            existing.setQuantityOnHand(existing.getQuantityOnHand() + delta);
            warehouseStockRepository.save(existing);
        }
    }
}
