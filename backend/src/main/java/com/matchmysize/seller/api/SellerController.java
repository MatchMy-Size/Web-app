package com.matchmysize.seller.api;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.matchmysize.identity.application.IdentityService;
import com.matchmysize.seller.application.SellerService;
import com.matchmysize.seller.application.SellerService.SaveChartCommand;
import com.matchmysize.seller.application.SellerService.SizeInput;
import com.matchmysize.shared.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller")
public class SellerController {
    record SellerProfileRequest(
        @NotBlank @Size(max = 160) String businessName,
        @NotBlank @Size(max = 160) String contactName,
        @Size(max = 320) String email,
        @Size(max = 32) String phoneNumber,
        @Size(max = 500) String address,
        @Size(max = 1000) String photoUrl
    ) {}

    record SizeRowRequest(
        @Size(max = 256) String catalogId,
        @NotBlank @Size(max = 80) String sizeLabel,
        BigDecimal sizeKey,
        Map<String, Object> measurements
    ) {}

    record SaveChartRequest(
        @NotBlank String department,
        @NotBlank String mainCategory,
        @Size(max = 160) String subcategory,
        @NotBlank String unit,
        @NotBlank String measurementBasis,
        @NotEmpty List<@Valid SizeRowRequest> sizes
    ) {}

    private final IdentityService identities;
    private final SellerService sellers;

    public SellerController(IdentityService identities, SellerService sellers) {
        this.identities = identities;
        this.sellers = sellers;
    }

    @GetMapping("/dashboard")
    ApiResponse<SellerService.DashboardResponse> dashboard(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(sellers.dashboard(identities.currentUser(jwt)));
    }

    @PatchMapping("/profile")
    ApiResponse<SellerService.SellerProfile> updateProfile(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody SellerProfileRequest request
    ) {
        return ApiResponse.success(sellers.updateProfile(
            identities.currentUser(jwt),
            Map.of(
                "businessName", request.businessName(),
                "contactName", request.contactName(),
                "email", request.email() == null ? "" : request.email(),
                "phoneNumber", request.phoneNumber() == null ? "" : request.phoneNumber(),
                "address", request.address() == null ? "" : request.address(),
                "photoUrl", request.photoUrl() == null ? "" : request.photoUrl()
            )
        ));
    }

    @GetMapping("/categories")
    ApiResponse<List<SellerService.SizeChartResponse>> categories(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(sellers.categories(identities.currentUser(jwt)));
    }

    @PostMapping("/categories")
    ApiResponse<SellerService.SizeChartResponse> createCategory(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody SaveChartRequest request
    ) {
        return ApiResponse.success(sellers.createCategory(
            identities.currentUser(jwt),
            command(request)
        ));
    }

    @PutMapping("/categories/{chartId}")
    ApiResponse<SellerService.SizeChartResponse> updateCategory(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID chartId,
        @Valid @RequestBody SaveChartRequest request
    ) {
        return ApiResponse.success(sellers.updateCategory(
            identities.currentUser(jwt),
            chartId,
            command(request)
        ));
    }

    @DeleteMapping("/categories/{chartId}")
    ApiResponse<Map<String, Boolean>> archiveCategory(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID chartId
    ) {
        sellers.archiveCategory(identities.currentUser(jwt), chartId);
        return ApiResponse.success(Map.of("archived", true));
    }

    private SaveChartCommand command(SaveChartRequest request) {
        return new SaveChartCommand(
            request.department(),
            request.mainCategory(),
            request.subcategory(),
            request.unit(),
            request.measurementBasis(),
            request.sizes().stream().map(size -> new SizeInput(
                size.catalogId(),
                size.sizeLabel(),
                size.sizeKey(),
                size.measurements()
            )).toList()
        );
    }
}
