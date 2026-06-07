package com.humanitarian.logistics.auth;

import com.humanitarian.logistics.auth.AuthDtos.LoginRequest;
import com.humanitarian.logistics.auth.AuthDtos.LoginResponse;
import com.humanitarian.logistics.model.User;
import com.humanitarian.logistics.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties props;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties props) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.props = props;
    }

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    @SecurityRequirements
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        User u = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(request.password(), u.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        // IMPORTANT: JWT claim must be a plain string role name (e.g. "ADMIN"),
        // otherwise Spring Security may not match hasRole/hasAnyRole checks.
        String roleName = u.getRole().name();
        String token = jwtService.issueAccessToken(u.getUsername(), roleName);
        return new LoginResponse(token, "Bearer", props.accessTtlSeconds(), u.getRole());
    }
}

