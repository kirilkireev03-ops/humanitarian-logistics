package com.humanitarian.logistics.dto;

public record WarehouseStockDto(
        Long id,
        Long warehouseId,
        String warehouseName,
        Long cargoId,
        String cargoName,
        Integer quantityOnHand
) {}
