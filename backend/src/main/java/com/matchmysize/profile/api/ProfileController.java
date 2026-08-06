package com.matchmysize.profile.api;

import java.util.Map;

import com.matchmysize.identity.application.IdentityService;
import com.matchmysize.profile.application.ProfileService;
import com.matchmysize.shared.api.ApiResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile/me")
public class ProfileController {
    private final IdentityService identities;
    private final ProfileService profiles;

    public ProfileController(IdentityService identities, ProfileService profiles) {
        this.identities = identities;
        this.profiles = profiles;
    }

    @GetMapping
    ApiResponse<Map<String, Object>> get(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(profiles.getProfile(identities.currentUser(jwt)));
    }

    @PutMapping
    ApiResponse<Map<String, Object>> put(
        @AuthenticationPrincipal Jwt jwt,
        @RequestBody Map<String, Object> payload
    ) {
        return ApiResponse.success(profiles.saveInitialProfile(identities.currentUser(jwt), payload));
    }

    @PatchMapping
    ApiResponse<Map<String, Object>> patch(
        @AuthenticationPrincipal Jwt jwt,
        @RequestBody Map<String, Object> payload
    ) {
        return ApiResponse.success(profiles.patchProfile(identities.currentUser(jwt), payload));
    }

    @PostMapping("/measurement-profiles")
    ApiResponse<Map<String, Object>> saveMeasurementProfile(
        @AuthenticationPrincipal Jwt jwt,
        @RequestBody Map<String, Object> payload
    ) {
        return ApiResponse.success(profiles.saveMeasurementProfile(identities.currentUser(jwt), payload));
    }

    @PutMapping("/measurement-profiles/{profileKey}/active")
    ApiResponse<Map<String, Object>> activateMeasurementProfile(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable String profileKey,
        @RequestBody Map<String, Object> payload
    ) {
        return ApiResponse.success(profiles.setActiveMeasurementProfile(
            identities.currentUser(jwt), profileKey, payload
        ));
    }

    @PostMapping("/family-members")
    ApiResponse<Map<String, String>> createFamilyMember(
        @AuthenticationPrincipal Jwt jwt,
        @RequestBody Map<String, Object> payload
    ) {
        return ApiResponse.success(Map.of(
            "id",
            profiles.createFamilyMember(identities.currentUser(jwt), payload)
        ));
    }

    @PostMapping("/family-members/{memberKey}/measurement-profiles")
    ApiResponse<Map<String, Object>> saveFamilyMeasurementProfile(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable String memberKey,
        @RequestBody Map<String, Object> payload
    ) {
        return ApiResponse.success(profiles.saveFamilyMeasurementProfile(
            identities.currentUser(jwt), memberKey, payload
        ));
    }

    @PutMapping("/family-members/{memberKey}/measurement-profiles/{profileKey}/active")
    ApiResponse<Map<String, Object>> activateFamilyMeasurementProfile(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable String memberKey,
        @PathVariable String profileKey,
        @RequestBody Map<String, Object> payload
    ) {
        return ApiResponse.success(profiles.setFamilyActiveMeasurementProfile(
            identities.currentUser(jwt), memberKey, profileKey, payload
        ));
    }
}
