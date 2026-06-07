package com.humanitarian.logistics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CargoRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 500) String description,
        @NotBlank @Size(max = 32) String unit,
        @Size(max = 80) String category
) {}
