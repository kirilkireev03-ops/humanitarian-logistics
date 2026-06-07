package com.humanitarian.logistics.repository;

import com.humanitarian.logistics.model.Cargo;
import com.humanitarian.logistics.model.StockTransaction;
import com.humanitarian.logistics.model.TransactionType;
import com.humanitarian.logistics.model.Warehouse;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    List<StockTransaction> findByCargoOrderByOccurredAtAsc(Cargo cargo);

    @Query("""
            SELECT t FROM StockTransaction t
            WHERE t.cargo.id = :cargoId
              AND t.type = :type
              AND t.occurredAt >= :from
              AND t.occurredAt < :to
            ORDER BY t.occurredAt ASC
            """)
    List<StockTransaction> findDemandInRange(
            @Param("cargoId") Long cargoId,
            @Param("type") TransactionType type,
            @Param("from") Instant from,
            @Param("to") Instant to);

    List<StockTransaction> findByToWarehouseAndOccurredAtBetweenOrderByOccurredAtAsc(
            Warehouse warehouse, Instant from, Instant to);

    List<StockTransaction> findByFromWarehouseAndOccurredAtBetweenOrderByOccurredAtAsc(
            Warehouse warehouse, Instant from, Instant to);
}
