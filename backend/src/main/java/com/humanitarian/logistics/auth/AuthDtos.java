package com.humanitarian.logistics.auth;

import com.humanitarian.logistics.model.UserRole;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

    public record LoginResponse(String accessToken, String tokenType, long expiresInSeconds, UserRole role) {}
}

