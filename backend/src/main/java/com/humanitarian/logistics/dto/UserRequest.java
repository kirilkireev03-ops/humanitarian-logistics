package com.humanitarian.logistics.dto;

import com.humanitarian.logistics.model.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserRequest(
        @NotBlank @Size(max = 80) String username,
        @Size(max = 120) String password,
        @Size(max = 120) String fullName,
        @Size(max = 120) String email,
        @NotNull UserRole role
) {}
