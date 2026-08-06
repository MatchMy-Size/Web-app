package com.matchmysize.identity.application;

import java.util.Map;
import java.util.UUID;

import com.matchmysize.identity.infrastructure.AppUserRepository;
import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import com.matchmysize.shared.api.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IdentityService {
    private final AppUserRepository users;

    public IdentityService(AppUserRepository users) {
        this.users = users;
    }

    @Transactional
    public AppUser currentUser(Jwt jwt) {
        final UUID authUserId;
        try {
            authUserId = UUID.fromString(jwt.getSubject());
        } catch (RuntimeException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_subject", "Invalid authentication subject.");
        }

        var existing = users.findByAuthUserId(authUserId);
        if (existing.isPresent()) return existing.get();

        var phoneNumber = jwt.getClaimAsString("phone");
        if (phoneNumber == null) {
            phoneNumber = metadataText(jwt.getClaim("user_metadata"), "phone_number");
        }
        return users.upsertAuthentication(authUserId, jwt.getClaimAsString("email"), phoneNumber);
    }

    @Transactional
    public AppUser linkAuthUser(UUID authUserId, String authEmail, String phoneNumber) {
        return users.upsertAuthentication(authUserId, authEmail, phoneNumber);
    }

    private String metadataText(Object rawMetadata, String key) {
        if (!(rawMetadata instanceof Map<?, ?> metadata)) return null;
        var value = metadata.get(key);
        return value instanceof String text && !text.isBlank() ? text.trim() : null;
    }
}
