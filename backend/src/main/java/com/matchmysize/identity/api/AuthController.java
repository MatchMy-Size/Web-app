package com.matchmysize.identity.api;

import java.util.Map;
import java.util.UUID;

import com.matchmysize.identity.application.AuthService;
import com.matchmysize.shared.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    record RegisterRequest(
        @NotBlank String phoneNumber,
        @Size(min = 6, max = 128) String password,
        @NotNull UUID otpSessionId
    ) {}

    record LoginRequest(
        @NotBlank String phoneNumber,
        @NotBlank String password
    ) {}

    record RefreshRequest(@NotBlank String refreshToken) {}

    record UpdatePasswordRequest(
        @NotBlank String phoneNumber,
        @Size(min = 6, max = 128) String password,
        @NotNull UUID otpSessionId
    ) {}

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    ApiResponse<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request.phoneNumber(), request.password(), request.otpSessionId()));
    }

    @PostMapping("/login")
    ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request.phoneNumber(), request.password()));
    }

    @PostMapping("/refresh")
    ApiResponse<Map<String, Object>> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.success(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    ApiResponse<Map<String, Object>> logout(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(authService.logout(jwt));
    }

    @GetMapping("/me")
    ApiResponse<Map<String, Object>> currentUser(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(authService.currentUser(jwt));
    }

    @PutMapping("/password")
    ApiResponse<Map<String, Object>> updatePassword(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody UpdatePasswordRequest request
    ) {
        return ApiResponse.success(authService.updatePassword(jwt, request.phoneNumber(), request.password(), request.otpSessionId()));
    }
}
