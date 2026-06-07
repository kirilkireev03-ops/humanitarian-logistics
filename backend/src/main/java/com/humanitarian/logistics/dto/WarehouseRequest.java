package com.humanitarian.logistics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WarehouseRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 255) String address,
        @Size(max = 120) String region,
        Integer capacityUnits
) {}
