package com.humanitarian.logistics.dto;

import com.humanitarian.logistics.model.UserRole;

public record UserResponse(
        Long id,
        String username,
        String fullName,
        String email,
        UserRole role
) {}
