package com.matchmysize.identity.api;

import java.util.Map;
import java.util.UUID;

import com.matchmysize.identity.application.AuthService;
import com.matchmysize.otp.application.OtpService;
import com.matchmysize.shared.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Email;
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

    record SellerLoginRequest(
        @NotBlank String identifier,
        @NotBlank String password
    ) {}

    record SellerRegisterRequest(
        @NotBlank String phoneNumber,
        @NotBlank @Email String email,
        @Size(min = 6, max = 128) String password,
        @NotNull UUID otpSessionId,
        @NotBlank @Size(max = 160) String businessName,
        @NotBlank @Size(max = 160) String contactName,
        @Size(max = 500) String address,
        @Size(max = 1000) String photoUrl
    ) {}

    record RefreshRequest(@NotBlank String refreshToken) {}

    record UpdatePasswordRequest(
        @NotBlank String phoneNumber,
        @Size(min = 6, max = 128) String password,
        @NotNull UUID otpSessionId
    ) {}

    record PasswordResetOtpRequest(@NotBlank String phoneNumber) {}

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

    @PostMapping("/seller/login")
    ApiResponse<Map<String, Object>> sellerLogin(@Valid @RequestBody SellerLoginRequest request) {
        return ApiResponse.success(authService.sellerLogin(request.identifier(), request.password()));
    }

    @PostMapping("/seller/register")
    ApiResponse<Map<String, Object>> sellerRegister(@Valid @RequestBody SellerRegisterRequest request) {
        return ApiResponse.success(authService.registerSeller(
            request.phoneNumber(),
            request.email(),
            request.password(),
            request.otpSessionId(),
            request.businessName(),
            request.contactName(),
            request.address(),
            request.photoUrl()
        ));
    }

    @PostMapping("/refresh")
    ApiResponse<Map<String, Object>> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.success(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/password/reset/request")
    ApiResponse<OtpService.OtpSessionResponse> requestPasswordResetOtp(
        @Valid @RequestBody PasswordResetOtpRequest request
    ) {
        return ApiResponse.success(authService.requestPasswordReset(request.phoneNumber()));
    }

    @PostMapping("/password/reset")
    ApiResponse<Map<String, Object>> resetPassword(@Valid @RequestBody UpdatePasswordRequest request) {
        return ApiResponse.success(authService.resetPassword(
            request.phoneNumber(), request.password(), request.otpSessionId()
        ));
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
