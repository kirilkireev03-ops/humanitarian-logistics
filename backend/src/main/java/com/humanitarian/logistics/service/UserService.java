package com.humanitarian.logistics.service;

import com.humanitarian.logistics.dto.UserRequest;
import com.humanitarian.logistics.dto.UserResponse;
import com.humanitarian.logistics.model.User;
import com.humanitarian.logistics.repository.UserRepository;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return userRepository.findById(id).map(this::toResponse).orElseThrow();
    }

    @Transactional
    public UserResponse create(UserRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalStateException("Username already exists");
        }
        User u = new User();
        u.setUsername(request.username());
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Password is required for new user");
        }
        u.setPasswordHash(passwordEncoder.encode(request.password()));
        u.setFullName(request.fullName());
        u.setEmail(request.email());
        u.setRole(request.role());
        return toResponse(userRepository.save(u));
    }

    @Transactional
    public UserResponse update(Long id, UserRequest request) {
        User u = userRepository.findById(id).orElseThrow();
        if (!u.getUsername().equals(request.username()) && userRepository.existsByUsername(request.username())) {
            throw new IllegalStateException("Username already exists");
        }
        u.setUsername(request.username());
        if (request.password() != null && !request.password().isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        u.setFullName(request.fullName());
        u.setEmail(request.email());
        u.setRole(request.role());
        return toResponse(userRepository.save(u));
    }

    @Transactional
    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(), u.getRole());
    }
}
