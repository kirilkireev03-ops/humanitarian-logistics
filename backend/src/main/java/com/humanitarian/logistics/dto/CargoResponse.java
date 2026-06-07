package com.humanitarian.logistics.dto;

public record CargoResponse(
        Long id,
        String name,
        String description,
        String unit,
        String category
) {}
