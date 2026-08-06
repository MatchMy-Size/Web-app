package com.matchmysize.otp.application;

import java.util.Map;

import com.matchmysize.shared.api.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class TextLkClient {
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
        new ParameterizedTypeReference<>() {};

    private final RestClient restClient;
    private final String apiToken;
    private final String senderId;
    private final String baseUrl;

    public TextLkClient(
        RestClient.Builder restClientBuilder,
        @Value("${app.text-lk.api-token}") String apiToken,
        @Value("${app.text-lk.sender-id}") String senderId,
        @Value("${app.text-lk.base-url}") String baseUrl
    ) {
        this.restClient = restClientBuilder.build();
        this.apiToken = apiToken == null ? "" : apiToken.trim();
        this.senderId = senderId == null ? "" : senderId.trim();
        this.baseUrl = baseUrl == null ? "" : baseUrl.replaceAll("/$", "");
    }

    public String sendOtp(String phoneNumber, String message) {
        if (apiToken.isBlank() || senderId.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "sms_not_configured", "Text.lk configuration is missing.");
        }

        try {
            var response = restClient.post()
                .uri(baseUrl + "/sms/send")
                .headers(headers -> {
                    headers.setBearerAuth(apiToken);
                    headers.set("Accept", "application/json");
                })
                .body(Map.of(
                    "recipient", phoneNumber.replaceFirst("^\\+", ""),
                    "sender_id", senderId,
                    "type", "plain",
                    "message", message
                ))
                .retrieve()
                .body(MAP_TYPE);

            if (response != null && response.get("data") instanceof Map<?, ?> data && data.get("uid") != null) {
                return String.valueOf(data.get("uid"));
            }
            return null;
        } catch (RestClientResponseException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "sms_error", "Unable to send OTP via Text.lk.");
        }
    }
}
