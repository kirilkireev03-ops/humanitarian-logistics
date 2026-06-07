package com.humanitarian.logistics.service;

import com.humanitarian.logistics.dto.StockTransactionDto;
import com.humanitarian.logistics.model.StockTransaction;
import org.springframework.stereotype.Component;

@Component
public class TransactionMapper {

    StockTransactionDto toDto(StockTransaction t) {
        return new StockTransactionDto(
                t.getId(),
                t.getType(),
                t.getFromWarehouse() != null ? t.getFromWarehouse().getId() : null,
                t.getFromWarehouse() != null ? t.getFromWarehouse().getName() : null,
                t.getToWarehouse() != null ? t.getToWarehouse().getId() : null,
                t.getToWarehouse() != null ? t.getToWarehouse().getName() : null,
                t.getCargo().getId(),
                t.getCargo().getName(),
                t.getQuantity(),
                t.getOccurredAt(),
                t.getNotes(),
                t.getRelatedRequestId());
    }
}
