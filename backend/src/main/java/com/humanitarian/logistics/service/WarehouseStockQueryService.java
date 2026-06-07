package com.humanitarian.logistics.service;

import com.humanitarian.logistics.dto.WarehouseStockDto;
import com.humanitarian.logistics.model.WarehouseStock;
import com.humanitarian.logistics.repository.WarehouseRepository;
import com.humanitarian.logistics.repository.WarehouseStockRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WarehouseStockQueryService {

    private static final Logger log = LoggerFactory.getLogger(WarehouseStockQueryService.class);

    private static final String LIST_ALL_SQL =
            """
            SELECT ws.id,
                   ws.warehouse_id,
                   w.name AS warehouse_name,
                   ws.cargo_id,
                   c.name AS cargo_name,
                   ws.quantity_on_hand
            FROM warehouse_stock ws
            INNER JOIN warehouses w ON w.id = ws.warehouse_id
            INNER JOIN cargo c ON c.id = ws.cargo_id
            ORDER BY ws.id
            """;

    private static final String LIST_BY_WAREHOUSE_SQL =
            """
            SELECT ws.id,
                   ws.warehouse_id,
                   w.name AS warehouse_name,
                   ws.cargo_id,
                   c.name AS cargo_name,
                   ws.quantity_on_hand
            FROM warehouse_stock ws
            INNER JOIN warehouses w ON w.id = ws.warehouse_id
            INNER JOIN cargo c ON c.id = ws.cargo_id
            WHERE ws.warehouse_id = ?
            ORDER BY ws.id
            """;

    private final JdbcTemplate jdbc;
    private final WarehouseStockRepository warehouseStockRepository;
    private final WarehouseRepository warehouseRepository;

    public WarehouseStockQueryService(
            JdbcTemplate jdbc,
            WarehouseStockRepository warehouseStockRepository,
            WarehouseRepository warehouseRepository) {
        this.jdbc = jdbc;
        this.warehouseStockRepository = warehouseStockRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @Transactional(readOnly = true)
    public List<WarehouseStockDto> findAll() {
        try {
            return jdbc.query(LIST_ALL_SQL, (rs, rowNum) -> mapRow(rs));
        } catch (Exception ex) {
            log.warn("Stock list via JDBC failed, using JPA: {}", ex.toString());
            return findAllViaJpa();
        }
    }

    @Transactional(readOnly = true)
    public List<WarehouseStockDto> findByWarehouse(Long warehouseId) {
        try {
            return jdbc.query(LIST_BY_WAREHOUSE_SQL, (rs, rowNum) -> mapRow(rs), warehouseId);
        } catch (Exception ex) {
            log.warn("Stock by warehouse via JDBC failed, using JPA: {}", ex.toString());
            return findByWarehouseViaJpa(warehouseId);
        }
    }

    private List<WarehouseStockDto> findAllViaJpa() {
        return warehouseStockRepository.findAll().stream().map(this::toDto).toList();
    }

    private List<WarehouseStockDto> findByWarehouseViaJpa(Long warehouseId) {
        var w = warehouseRepository.findById(warehouseId).orElseThrow();
        return warehouseStockRepository.findByWarehouse(w).stream().map(this::toDto).toList();
    }

    private static WarehouseStockDto mapRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        int qty = rs.getObject("quantity_on_hand") != null ? rs.getInt("quantity_on_hand") : 0;
        return new WarehouseStockDto(
                rs.getLong("id"),
                rs.getLong("warehouse_id"),
                rs.getString("warehouse_name"),
                rs.getLong("cargo_id"),
                rs.getString("cargo_name"),
                qty);
    }

    private WarehouseStockDto toDto(WarehouseStock ws) {
        return new WarehouseStockDto(
                ws.getId(),
                ws.getWarehouse().getId(),
                ws.getWarehouse().getName(),
                ws.getCargo().getId(),
                ws.getCargo().getName(),
                ws.getQuantityOnHand());
    }
}
