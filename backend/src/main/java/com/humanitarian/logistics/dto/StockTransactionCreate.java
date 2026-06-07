package com.humanitarian.logistics.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.humanitarian.logistics.model.TransactionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public record StockTransactionCreate(
        @NotNull TransactionType type,
        Long fromWarehouseId,
        Long toWarehouseId,
        @NotNull Long cargoId,
        @NotNull @Min(1) Integer quantity,
        String notes,
        Long relatedRequestId,
        @JsonInclude(JsonInclude.Include.NON_NULL) Instant occurredAt
) {
    public StockTransactionCreate(
            TransactionType type,
            Long fromWarehouseId,
            Long toWarehouseId,
            Long cargoId,
            Integer quantity,
            String notes,
            Long relatedRequestId) {
        this(type, fromWarehouseId, toWarehouseId, cargoId, quantity, notes, relatedRequestId, null);
    }
}
