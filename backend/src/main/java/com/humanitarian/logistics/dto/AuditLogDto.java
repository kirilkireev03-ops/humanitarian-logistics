package com.humanitarian.logistics.dto;

import java.time.Instant;

public record AuditLogDto(
        Long id,
        Instant at,
        String actorUsername,
        String actorRole,
        String action,
        String entityType,
        Long entityId,
        String details
) {}

