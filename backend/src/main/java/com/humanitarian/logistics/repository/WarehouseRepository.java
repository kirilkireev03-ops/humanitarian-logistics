package com.humanitarian.logistics.repository;

import com.humanitarian.logistics.model.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
}
