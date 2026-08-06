package com.matchmysize.identity.infrastructure;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import com.matchmysize.shared.api.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class SupabaseAdminClient {
    public record SupabaseUser(
        UUID id,
        String email,
        String phoneNumber,
        String displayName
    ) {}

    public record SupabaseSession(
        String accessToken,
        String refreshToken,
        long expiresIn,
        SupabaseUser user
    ) {}

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
        new ParameterizedTypeReference<>() {};

    private final RestClient restClient;
    private final String supabaseUrl;
    private final String publishableKey;
    private final String secretKey;

    public SupabaseAdminClient(
        RestClient.Builder restClientBuilder,
        @Value("${app.supabase.url}") String supabaseUrl,
        @Value("${app.supabase.publishable-key}") String publishableKey,
        @Value("${app.supabase.secret-key}") String secretKey
    ) {
        this.restClient = restClientBuilder.build();
        this.supabaseUrl = supabaseUrl == null ? "" : supabaseUrl.replaceAll("/$", "");
        this.publishableKey = publishableKey == null ? "" : publishableKey;
        this.secretKey = secretKey == null ? "" : secretKey;
    }

    public SupabaseUser createConfirmedUser(String email, String password, String phoneNumber) {
        requireAdminConfiguration();
        try {
            var response = restClient.post()
                .uri(supabaseUrl + "/auth/v1/admin/users")
                .headers(this::setAdminHeaders)
                .body(Map.of(
                    "email", email,
                    "password", password,
                    "email_confirm", true,
                    "user_metadata", Map.of("phone_number", phoneNumber)
                ))
                .retrieve()
                .body(MAP_TYPE);
            return toUser(response);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 422 || exception.getStatusCode().value() == 400) {
                throw new ApiException(HttpStatus.CONFLICT, "account_exists", "An account already exists for this phone number.");
            }
            throw upstreamFailure(exception);
        }
    }

    public SupabaseSession signIn(String email, String password) {
        requirePublicConfiguration();
        try {
            var response = restClient.post()
                .uri(supabaseUrl + "/auth/v1/token?grant_type=password")
                .headers(this::setPublicHeaders)
                .body(Map.of("email", email, "password", password))
                .retrieve()
                .body(MAP_TYPE);
            return toSession(response);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().is4xxClientError()) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials", "Incorrect phone number or password.");
            }
            throw upstreamFailure(exception);
        }
    }

    public SupabaseSession refresh(String refreshToken) {
        requirePublicConfiguration();
        try {
            var response = restClient.post()
                .uri(supabaseUrl + "/auth/v1/token?grant_type=refresh_token")
                .headers(this::setPublicHeaders)
                .body(Map.of("refresh_token", refreshToken))
                .retrieve()
                .body(MAP_TYPE);
            return toSession(response);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().is4xxClientError()) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_session", "The session has expired. Sign in again.");
            }
            throw upstreamFailure(exception);
        }
    }

    public void logout(String accessToken) {
        requirePublicConfiguration();
        try {
            restClient.post()
                .uri(supabaseUrl + "/auth/v1/logout")
                .headers(headers -> {
                    headers.set("apikey", publishableKey);
                    headers.setBearerAuth(accessToken);
                    headers.setContentType(MediaType.APPLICATION_JSON);
                })
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            if (!exception.getStatusCode().is4xxClientError()) throw upstreamFailure(exception);
        }
    }

    public SupabaseUser updatePassword(UUID authUserId, String password, String phoneNumber) {
        requireAdminConfiguration();
        try {
            var response = restClient.put()
                .uri(supabaseUrl + "/auth/v1/admin/users/" + authUserId)
                .headers(this::setAdminHeaders)
                .body(Map.of(
                    "password", password,
                    "user_metadata", Map.of("phone_number", phoneNumber)
                ))
                .retrieve()
                .body(MAP_TYPE);
            return toUser(response);
        } catch (RestClientResponseException exception) {
            throw upstreamFailure(exception);
        }
    }

    private SupabaseSession toSession(Map<String, Object> response) {
        if (response == null || response.get("access_token") == null || response.get("refresh_token") == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "supabase_invalid_response", "Supabase returned an invalid session response.");
        }
        var expires = response.get("expires_in") instanceof Number value ? value.longValue() : 3600L;
        return new SupabaseSession(
            String.valueOf(response.get("access_token")),
            String.valueOf(response.get("refresh_token")),
            expires,
            toUser(asMap(response.get("user")))
        );
    }

    private SupabaseUser toUser(Map<String, Object> response) {
        if (response == null || response.get("id") == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "supabase_invalid_response", "Supabase returned an invalid user response.");
        }
        var metadata = asMap(response.get("user_metadata"));
        return new SupabaseUser(
            UUID.fromString(String.valueOf(response.get("id"))),
            text(response.get("email")),
            firstText(response.get("phone"), metadata.get("phone_number")),
            firstText(metadata.get("display_name"), metadata.get("full_name"), metadata.get("name"))
        );
    }

    private Map<String, Object> asMap(Object value) {
        if (!(value instanceof Map<?, ?> source)) return Map.of();
        var result = new LinkedHashMap<String, Object>();
        source.forEach((key, item) -> result.put(String.valueOf(key), item));
        return result;
    }

    private String firstText(Object... values) {
        for (var value : values) {
            var text = text(value);
            if (text != null) return text;
        }
        return null;
    }

    private String text(Object value) {
        return value instanceof String text && !text.isBlank() ? text.trim() : null;
    }

    private void setPublicHeaders(HttpHeaders headers) {
        headers.set("apikey", publishableKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
    }

    private void setAdminHeaders(HttpHeaders headers) {
        headers.setBearerAuth(secretKey);
        headers.set("apikey", secretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
    }

    private void requirePublicConfiguration() {
        if (supabaseUrl.isBlank() || publishableKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "supabase_not_configured", "Supabase authentication is not configured.");
        }
    }

    private void requireAdminConfiguration() {
        if (supabaseUrl.isBlank() || secretKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "supabase_not_configured", "Supabase account administration is not configured.");
        }
    }

    private ApiException upstreamFailure(RestClientResponseException exception) {
        return new ApiException(HttpStatus.BAD_GATEWAY, "supabase_error", "Supabase Auth rejected the account operation.");
    }
}
