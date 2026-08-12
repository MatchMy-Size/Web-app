package com.matchmysize.identity.application;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Locale;
import java.util.UUID;

import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import com.matchmysize.identity.infrastructure.AppUserRepository;
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
    private final AppUserRepository users;

    public AuthService(
        OtpService otpService,
        PhoneCredentialService phoneCredentials,
        SupabaseAdminClient supabase,
        IdentityService identities,
        AppUserRepository users
    ) {
        this.otpService = otpService;
        this.phoneCredentials = phoneCredentials;
        this.supabase = supabase;
        this.identities = identities;
        this.users = users;
    }

    @Transactional
    public Map<String, Object> register(String phoneNumber, String password, UUID otpSessionId) {
        validatePassword(password);
        var normalizedPhone = phoneCredentials.normalize(phoneNumber);
        otpService.consumeVerified(otpSessionId, normalizedPhone, "signup");
        var email = phoneCredentials.syntheticEmail(normalizedPhone);
        var createdUser = supabase.createConfirmedUser(email, password, normalizedPhone);
        var appUser = identities.linkAuthUser(createdUser.id(), email, normalizedPhone);
        return sessionResponse(supabase.signIn(email, password), appUser);
    }

    @Transactional
    public Map<String, Object> registerSeller(
        String phoneNumber,
        String email,
        String password,
        UUID otpSessionId,
        String businessName,
        String contactName,
        String address,
        String photoUrl
    ) {
        validatePassword(password);
        var normalizedPhone = phoneCredentials.normalize(phoneNumber);
        var normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        otpService.consumeVerified(otpSessionId, normalizedPhone, "signup");

        var createdUser = supabase.createConfirmedUser(normalizedEmail, password, normalizedPhone);
        var linked = identities.linkAuthUser(createdUser.id(), normalizedEmail, normalizedPhone);
        var profile = new LinkedHashMap<String, Object>();
        profile.put("businessName", businessName.trim());
        profile.put("brandName", businessName.trim());
        profile.put("contactName", contactName.trim());
        profile.put("displayName", contactName.trim());
        profile.put("email", normalizedEmail);
        profile.put("phoneNumber", normalizedPhone);
        profile.put("address", optionalText(address));
        profile.put("photoURL", optionalText(photoUrl));
        profile.put("role", "seller");
        profile.put("createdAt", java.time.Instant.now().toString());
        profile.put("updatedAt", java.time.Instant.now().toString());
        var seller = users.promoteToSeller(
            linked.id(), createdUser.id(), normalizedEmail, normalizedPhone, profile
        );
        return sessionResponse(supabase.signIn(normalizedEmail, password), seller);
    }

    @Transactional
    public Map<String, Object> login(String phoneNumber, String password) {
        var normalizedPhone = phoneCredentials.normalize(phoneNumber);
        var session = supabase.signIn(phoneCredentials.syntheticEmail(normalizedPhone), password);
        var appUser = identities.linkAuthUser(session.user().id(), session.user().email(), normalizedPhone);
        return sessionResponse(session, appUser);
    }

    @Transactional
    public Map<String, Object> sellerLogin(String identifier, String password) {
        var trimmed = identifier == null ? "" : identifier.trim();
        var seller = trimmed.contains("@")
            ? users.findByAuthEmail(trimmed)
            : users.findByPhoneNumber(phoneCredentials.normalize(trimmed));
        var account = seller
            .filter(user -> "seller".equalsIgnoreCase(user.role()))
            .filter(user -> "active".equalsIgnoreCase(user.status()))
            .orElseThrow(() -> new ApiException(
                HttpStatus.UNAUTHORIZED,
                "invalid_credentials",
                "Incorrect seller email, phone number, or password."
            ));
        if (account.authEmail() == null || account.authEmail().isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials", "This seller account cannot sign in yet.");
        }

        var session = supabase.signIn(account.authEmail(), password);
        var linked = identities.linkAuthUser(
            session.user().id(),
            session.user().email(),
            account.phoneNumber()
        );
        if (!"seller".equalsIgnoreCase(linked.role())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "seller_access_required", "Seller access is required.");
        }
        return sessionResponse(session, linked);
    }

    @Transactional
    public Map<String, Object> refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "missing_refresh_token", "A refresh token is required.");
        }
        var session = supabase.refresh(refreshToken.trim());
        var appUser = identities.linkAuthUser(
            session.user().id(), session.user().email(), session.user().phoneNumber()
        );
        return sessionResponse(session, appUser);
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

    @Transactional
    public OtpService.OtpSessionResponse requestPasswordReset(String phoneNumber) {
        var normalizedPhone = phoneCredentials.normalize(phoneNumber);
        registeredUser(normalizedPhone);
        return otpService.request(normalizedPhone, "passwordReset");
    }

    @Transactional
    public Map<String, Object> resetPassword(
        String phoneNumber,
        String password,
        UUID otpSessionId
    ) {
        validatePassword(password);
        var normalizedPhone = phoneCredentials.normalize(phoneNumber);
        var appUser = registeredUser(normalizedPhone);
        otpService.consumeVerified(otpSessionId, normalizedPhone, "passwordReset");
        supabase.updatePassword(appUser.authUserId(), password, normalizedPhone);
        return Map.of("updated", true);
    }

    private AppUser registeredUser(String normalizedPhone) {
        return users.findByPhoneNumber(normalizedPhone)
            .or(() -> users.findByAuthEmail(phoneCredentials.syntheticEmail(normalizedPhone)))
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "account_not_found",
                "No MatchMySize account was found for this phone number."
            ));
    }

    private Map<String, Object> sessionResponse(SupabaseSession session, AppUser appUser) {
        var response = new LinkedHashMap<String, Object>();
        response.put("accessToken", session.accessToken());
        response.put("refreshToken", session.refreshToken());
        response.put("expiresIn", session.expiresIn());
        response.put("user", sessionUserResponse(session.user(), appUser));
        return response;
    }

    private Map<String, Object> sessionUserResponse(SupabaseUser user, AppUser appUser) {
        var response = new LinkedHashMap<String, Object>();
        response.put("id", user.id().toString());
        response.put("email", user.email());
        response.put("phoneNumber", user.phoneNumber() == null ? appUser.phoneNumber() : user.phoneNumber());
        response.put("displayName", firstText(appUser.profileData(), "displayName", "contactName", "firstName"));
        response.put("role", appUser.role());
        response.put("status", appUser.status());
        return response;
    }

    private Map<String, Object> appUserResponse(AppUser user) {
        var response = new LinkedHashMap<String, Object>();
        response.put("id", user.authUserId().toString());
        response.put("email", user.authEmail());
        response.put("phoneNumber", user.phoneNumber());
        response.put("displayName", firstText(user.profileData(), "displayName", "firstName"));
        response.put("role", user.role());
        response.put("status", user.status());
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

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
