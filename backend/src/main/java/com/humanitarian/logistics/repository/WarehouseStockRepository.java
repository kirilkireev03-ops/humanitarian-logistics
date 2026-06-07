package com.humanitarian.logistics.repository;

import com.humanitarian.logistics.model.Cargo;
import com.humanitarian.logistics.model.Warehouse;
import com.humanitarian.logistics.model.WarehouseStock;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;

public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, Long> {

    Optional<WarehouseStock> findByWarehouseAndCargo(Warehouse warehouse, Cargo cargo);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<WarehouseStock> findWithWriteLockByWarehouseAndCargo(Warehouse warehouse, Cargo cargo);

    List<WarehouseStock> findByWarehouse(Warehouse warehouse);

    List<WarehouseStock> findByCargo(Cargo cargo);
}
