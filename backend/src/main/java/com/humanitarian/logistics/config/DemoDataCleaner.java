package com.humanitarian.logistics.config;

import com.humanitarian.logistics.repository.AidRequestRepository;
import com.humanitarian.logistics.repository.AuditLogRepository;
import com.humanitarian.logistics.repository.CargoRepository;
import com.humanitarian.logistics.repository.StockTransactionRepository;
import com.humanitarian.logistics.repository.UserRepository;
import com.humanitarian.logistics.repository.WarehouseRepository;
import com.humanitarian.logistics.repository.WarehouseStockRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DemoDataCleaner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataCleaner.class);

    private final AuditLogRepository auditLogRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final WarehouseStockRepository warehouseStockRepository;
    private final AidRequestRepository aidRequestRepository;
    private final CargoRepository cargoRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;

    public DemoDataCleaner(
            AuditLogRepository auditLogRepository,
            StockTransactionRepository stockTransactionRepository,
            WarehouseStockRepository warehouseStockRepository,
            AidRequestRepository aidRequestRepository,
            CargoRepository cargoRepository,
            WarehouseRepository warehouseRepository,
            UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.warehouseStockRepository = warehouseStockRepository;
        this.aidRequestRepository = aidRequestRepository;
        this.cargoRepository = cargoRepository;
        this.warehouseRepository = warehouseRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void clearAll() {
        log.warn("Clearing incomplete demo data from database...");
        auditLogRepository.deleteAllInBatch();
        stockTransactionRepository.deleteAllInBatch();
        warehouseStockRepository.deleteAllInBatch();
        aidRequestRepository.deleteAllInBatch();
        cargoRepository.deleteAllInBatch();
        warehouseRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        log.warn("Demo tables cleared.");
    }
}
