package com.matchmysize.otp.api;

import java.util.Map;
import java.util.UUID;

import com.matchmysize.otp.application.OtpService;
import com.matchmysize.shared.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/otp")
public class OtpController {
    record RequestOtpRequest(@NotBlank String phoneNumber, @NotBlank String purpose) {}
    record VerifyOtpRequest(
        @NotNull UUID sessionId,
        @NotBlank String code,
        @NotBlank String purpose,
        @NotBlank String phoneNumber
    ) {}

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/request")
    ApiResponse<OtpService.OtpSessionResponse> request(@Valid @RequestBody RequestOtpRequest request) {
        return ApiResponse.success(otpService.request(request.phoneNumber(), request.purpose()));
    }

    @PostMapping("/verify")
    ApiResponse<Map<String, Object>> verify(@Valid @RequestBody VerifyOtpRequest request) {
        return ApiResponse.success(otpService.verify(
            request.sessionId(),
            request.code(),
            request.purpose(),
            request.phoneNumber()
        ));
    }
}
