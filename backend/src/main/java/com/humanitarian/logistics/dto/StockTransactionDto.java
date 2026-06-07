package com.humanitarian.logistics.dto;

import com.humanitarian.logistics.model.TransactionType;
import java.time.Instant;

public record StockTransactionDto(
        Long id,
        TransactionType type,
        Long fromWarehouseId,
        String fromWarehouseName,
        Long toWarehouseId,
        String toWarehouseName,
        Long cargoId,
        String cargoName,
        Integer quantity,
        Instant occurredAt,
        String notes,
        Long relatedRequestId
) {}
