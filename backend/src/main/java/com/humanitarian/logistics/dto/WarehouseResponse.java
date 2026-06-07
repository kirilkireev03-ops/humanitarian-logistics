package com.humanitarian.logistics.dto;

public record WarehouseResponse(
        Long id,
        String name,
        String address,
        String region,
        Integer capacityUnits
) {}
