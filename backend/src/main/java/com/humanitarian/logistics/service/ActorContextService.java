package com.humanitarian.logistics.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class ActorContextService {

    public record Actor(String username, String role) {}

    public Actor currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null || auth.getName().isBlank()) {
            return new Actor("system", null);
        }
        String role =
                auth.getAuthorities() == null
                        ? null
                        : auth.getAuthorities().stream()
                                .map(a -> a.getAuthority())
                                .filter(s -> s != null && !s.isBlank())
                                .findFirst()
                                .orElse(null);
        return new Actor(auth.getName(), role);
    }
}

