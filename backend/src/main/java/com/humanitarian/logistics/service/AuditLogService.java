package com.humanitarian.logistics.service;

import com.humanitarian.logistics.model.AuditLog;
import com.humanitarian.logistics.dto.AuditLogDto;
import com.humanitarian.logistics.repository.AuditLogRepository;
import com.humanitarian.logistics.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ActorContextService actorContextService;
    private final UserRepository userRepository;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            ActorContextService actorContextService,
            UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.actorContextService = actorContextService;
        this.userRepository = userRepository;
    }

    /** Запис під час seed / системних операцій без JWT у SecurityContext. */
    @Transactional
    public void logSystem(String action, String entityType, Long entityId, String details) {
        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException("action is required");
        }
        if (entityType == null || entityType.isBlank()) {
            throw new IllegalArgumentException("entityType is required");
        }
        AuditLog e = new AuditLog();
        e.setAt(Instant.now());
        e.setActorUsername("system");
        e.setActorRole("SEED");
        e.setAction(action.trim());
        e.setEntityType(entityType.trim());
        e.setEntityId(entityId);
        e.setDetails(details);
        auditLogRepository.save(e);
    }

    @Transactional
    public void log(String action, String entityType, Long entityId, String details) {
        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException("action is required");
        }
        if (entityType == null || entityType.isBlank()) {
            throw new IllegalArgumentException("entityType is required");
        }

        var actor = actorContextService.currentActor();
        AuditLog e = new AuditLog();
        e.setAt(Instant.now());
        e.setActorUsername(actor.username());
        e.setActorRole(actor.role());
        e.setAction(action.trim());
        e.setEntityType(entityType.trim());
        e.setEntityId(entityId);
        e.setDetails(details);

        userRepository.findByUsername(actor.username()).ifPresent(e::setActorUser);
        auditLogRepository.save(e);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> recent() {
        return auditLogRepository.findTop100ByOrderByAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    private AuditLogDto toDto(AuditLog e) {
        return new AuditLogDto(
                e.getId(),
                e.getAt(),
                e.getActorUsername(),
                e.getActorRole(),
                e.getAction(),
                e.getEntityType(),
                e.getEntityId(),
                e.getDetails());
    }
}

