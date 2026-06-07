package com.humanitarian.logistics.dto;

import com.humanitarian.logistics.model.RequestStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AidRequestCreateUpdate(
        @NotNull Long warehouseId,
        @NotNull Long cargoId,
        @NotNull @Min(1) Integer quantityRequested,
        RequestStatus status,
        String notes
) {}
