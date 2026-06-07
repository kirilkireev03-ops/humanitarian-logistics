package com.humanitarian.logistics.service;

import com.humanitarian.logistics.dto.DashboardStats;
import com.humanitarian.logistics.model.RequestStatus;
import com.humanitarian.logistics.repository.AidRequestRepository;
import com.humanitarian.logistics.repository.CargoRepository;
import com.humanitarian.logistics.repository.StockTransactionRepository;
import com.humanitarian.logistics.repository.WarehouseRepository;
import com.humanitarian.logistics.repository.WarehouseStockRepository;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * KPI: prefer fast JDBC counts; on any failure fall back to JPA (same data, survives schema/JDBC edge cases).
 */
@Service
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    private final JdbcTemplate jdbc;
    private final WarehouseRepository warehouseRepository;
    private final CargoRepository cargoRepository;
    private final AidRequestRepository aidRequestRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final WarehouseStockRepository warehouseStockRepository;

    public DashboardService(
            JdbcTemplate jdbc,
            WarehouseRepository warehouseRepository,
            CargoRepository cargoRepository,
            AidRequestRepository aidRequestRepository,
            StockTransactionRepository stockTransactionRepository,
            WarehouseStockRepository warehouseStockRepository) {
        this.jdbc = jdbc;
        this.warehouseRepository = warehouseRepository;
        this.cargoRepository = cargoRepository;
        this.aidRequestRepository = aidRequestRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.warehouseStockRepository = warehouseStockRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStats stats() {
        try {
            return statsViaJdbc();
        } catch (Exception ex) {
            log.warn("Dashboard KPI via JDBC failed, using JPA fallback: {}", ex.toString());
            return statsViaJpa();
        }
    }

    private DashboardStats statsViaJdbc() {
        Instant since = Instant.now().minus(30, ChronoUnit.DAYS);
        Timestamp sinceTs = Timestamp.from(since);

        long warehouses = requireLong(jdbc.queryForObject("SELECT COUNT(*) FROM warehouses", Long.class));
        long cargoTypes = requireLong(jdbc.queryForObject("SELECT COUNT(*) FROM cargo", Long.class));
        long pending = requireLong(jdbc.queryForObject(
                "SELECT COUNT(*) FROM aid_requests WHERE status IN (?, ?)",
                Long.class,
                RequestStatus.PENDING.name(),
                RequestStatus.APPROVED.name()));
        long recentTx = requireLong(jdbc.queryForObject(
                "SELECT COUNT(*) FROM transactions WHERE occurred_at IS NOT NULL AND occurred_at > ?",
                Long.class,
                sinceTs));
        Long stockSum = jdbc.queryForObject(
                "SELECT COALESCE(SUM(quantity_on_hand), 0) FROM warehouse_stock",
                Long.class);
        long stockUnits = stockSum != null ? stockSum : 0L;

        return new DashboardStats(warehouses, cargoTypes, pending, recentTx, stockUnits);
    }

    private DashboardStats statsViaJpa() {
        Instant since = Instant.now().minus(30, ChronoUnit.DAYS);
        long pending = aidRequestRepository.findAll().stream()
                .filter(r -> r.getStatus() == RequestStatus.PENDING || r.getStatus() == RequestStatus.APPROVED)
                .count();
        long recentTx = stockTransactionRepository.findAll().stream()
                .filter(t -> t.getOccurredAt() != null && t.getOccurredAt().isAfter(since))
                .count();
        long stockUnits = warehouseStockRepository.findAll().stream()
                .mapToLong(ws -> ws.getQuantityOnHand() == null ? 0L : ws.getQuantityOnHand().longValue())
                .sum();

        return new DashboardStats(
                warehouseRepository.count(),
                cargoRepository.count(),
                pending,
                recentTx,
                stockUnits);
    }

    private static long requireLong(Long v) {
        return v != null ? v : 0L;
    }
}
