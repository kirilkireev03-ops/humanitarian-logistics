package com.humanitarian.logistics.dto;

import com.humanitarian.logistics.model.RequestStatus;
import java.time.Instant;

public record AidRequestDto(
        Long id,
        Long warehouseId,
        String warehouseName,
        Long cargoId,
        String cargoName,
        Integer quantityRequested,
        RequestStatus status,
        String notes,
        Instant createdAt
) {}
