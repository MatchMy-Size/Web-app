package com.matchmysize.identity.application;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import com.matchmysize.identity.infrastructure.SupabaseAdminClient;
import com.matchmysize.identity.infrastructure.SupabaseAdminClient.SupabaseSession;
import com.matchmysize.identity.infrastructure.SupabaseAdminClient.SupabaseUser;
import com.matchmysize.otp.application.OtpService;
import com.matchmysize.shared.api.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final OtpService otpService;
    private final PhoneCredentialService phoneCredentials;
    private final SupabaseAdminClient supabase;
    private final IdentityService identities;

    public AuthService(
        OtpService otpService,
        PhoneCredentialService phoneCredentials,
        SupabaseAdminClient supabase,
        IdentityService identities
    ) {
        this.otpService = otpService;
        this.phoneCredentials = phoneCredentials;
        this.supabase = supabase;
        this.identities = identities;
    }

    @Transactional
    public Map<String, Object> register(String phoneNumber, String password, UUID otpSessionId) {
        validatePassword(password);
        var normalizedPhone = phoneCredentials.normalize(phoneNumber);
        otpService.consumeVerified(otpSessionId, normalizedPhone, "signup");
        var email = phoneCredentials.syntheticEmail(normalizedPhone);
        var createdUser = supabase.createConfirmedUser(email, password, normalizedPhone);
        identities.linkAuthUser(createdUser.id(), email, normalizedPhone);
        return sessionResponse(supabase.signIn(email, password));
    }

    @Transactional
    public Map<String, Object> login(String phoneNumber, String password) {
        var normalizedPhone = phoneCredentials.normalize(phoneNumber);
        var session = supabase.signIn(phoneCredentials.syntheticEmail(normalizedPhone), password);
        identities.linkAuthUser(session.user().id(), session.user().email(), normalizedPhone);
        return sessionResponse(session);
    }

    @Transactional
    public Map<String, Object> refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "missing_refresh_token", "A refresh token is required.");
        }
        var session = supabase.refresh(refreshToken.trim());
        identities.linkAuthUser(session.user().id(), session.user().email(), session.user().phoneNumber());
        return sessionResponse(session);
    }

    public Map<String, Object> logout(Jwt jwt) {
        supabase.logout(jwt.getTokenValue());
        return Map.of("signedOut", true);
    }

    @Transactional
    public Map<String, Object> currentUser(Jwt jwt) {
        return appUserResponse(identities.currentUser(jwt));
    }

    @Transactional
    public Map<String, Object> updatePassword(
        Jwt jwt,
        String phoneNumber,
        String password,
        UUID otpSessionId
    ) {
        validatePassword(password);
        var normalizedPhone = phoneCredentials.normalize(phoneNumber);
        var appUser = identities.currentUser(jwt);
        if (appUser.phoneNumber() != null && !appUser.phoneNumber().equals(normalizedPhone)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "phone_mismatch", "The verified phone number does not belong to this account.");
        }
        otpService.consumeVerified(otpSessionId, normalizedPhone, "changePassword");
        supabase.updatePassword(UUID.fromString(jwt.getSubject()), password, normalizedPhone);
        return Map.of("updated", true);
    }

    private Map<String, Object> sessionResponse(SupabaseSession session) {
        var response = new LinkedHashMap<String, Object>();
        response.put("accessToken", session.accessToken());
        response.put("refreshToken", session.refreshToken());
        response.put("expiresIn", session.expiresIn());
        response.put("user", supabaseUserResponse(session.user()));
        return response;
    }

    private Map<String, Object> supabaseUserResponse(SupabaseUser user) {
        var response = new LinkedHashMap<String, Object>();
        response.put("id", user.id().toString());
        response.put("email", user.email());
        response.put("phoneNumber", user.phoneNumber());
        response.put("displayName", user.displayName());
        return response;
    }

    private Map<String, Object> appUserResponse(AppUser user) {
        var response = new LinkedHashMap<String, Object>();
        response.put("id", user.authUserId().toString());
        response.put("email", user.authEmail());
        response.put("phoneNumber", user.phoneNumber());
        response.put("displayName", firstText(user.profileData(), "displayName", "firstName"));
        return response;
    }

    private String firstText(Map<String, Object> values, String... keys) {
        for (var key : keys) {
            if (values.get(key) instanceof String text && !text.isBlank()) return text.trim();
        }
        return null;
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 6) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "weak_password", "Password must be at least 6 characters.");
        }
    }
}
