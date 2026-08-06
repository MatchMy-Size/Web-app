package com.matchmysize.otp.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

import com.matchmysize.identity.application.PhoneCredentialService;
import com.matchmysize.shared.api.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OtpService {
    public record OtpSessionResponse(
        UUID sessionId,
        String purpose,
        String phoneNumber,
        long expiresAt
    ) {}

    private record StoredSession(
        UUID id,
        String purpose,
        String phoneNumber,
        String codeHash,
        String status,
        int attemptCount,
        Instant expiresAt,
        Instant verifiedAt,
        Instant consumedAt
    ) {}

    private final JdbcClient jdbc;
    private final TextLkClient textLk;
    private final PhoneCredentialService phoneCredentials;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long ttlMs;
    private final String template;

    public OtpService(
        JdbcClient jdbc,
        TextLkClient textLk,
        PhoneCredentialService phoneCredentials,
        @Value("${app.text-lk.otp-ttl-ms}") long ttlMs,
        @Value("${app.text-lk.otp-template}") String template
    ) {
        this.jdbc = jdbc;
        this.textLk = textLk;
        this.phoneCredentials = phoneCredentials;
        this.ttlMs = ttlMs > 0 ? ttlMs : 300_000;
        this.template = template;
    }

    @Transactional
    public OtpSessionResponse request(String phoneNumber, String purpose) {
        var normalizedPhone = phoneCredentials.normalize(phoneNumber);
        var normalizedPurpose = normalizePurpose(purpose);
        var recentCount = jdbc.sql("""
                select count(*) from otp_sessions
                 where phone_number = :phone
                   and created_at > now() - interval '60 seconds'
                """)
            .param("phone", normalizedPhone)
            .query(Long.class)
            .single();
        if (recentCount >= 3) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "otp_rate_limited", "Please wait before requesting another code.");
        }

        var code = "%06d".formatted(secureRandom.nextInt(900_000) + 100_000);
        var sessionId = UUID.randomUUID();
        var expiresAt = Instant.now().plusMillis(ttlMs);
        var minutes = Math.max(1, Math.round(ttlMs / 60_000.0));
        var message = template
            .replace("{code}", code)
            .replace("{minutes}", String.valueOf(minutes));
        var messageUid = textLk.sendOtp(normalizedPhone, message);

        jdbc.sql("""
                insert into otp_sessions (
                    id, purpose, phone_number, code_hash, message_uid, expires_at
                ) values (
                    :id, :purpose, :phone, :codeHash, :messageUid, :expiresAt
                )
                """)
            .param("id", sessionId)
            .param("purpose", normalizedPurpose)
            .param("phone", normalizedPhone)
            .param("codeHash", hash(sessionId, code))
            .param("messageUid", messageUid)
            .param("expiresAt", Timestamp.from(expiresAt))
            .update();

        return new OtpSessionResponse(sessionId, normalizedPurpose, normalizedPhone, expiresAt.toEpochMilli());
    }

    @Transactional
    public Map<String, Object> verify(
        UUID sessionId,
        String code,
        String purpose,
        String phoneNumber
    ) {
        if (code == null || !code.trim().matches("^\\d{4,8}$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_otp", "Enter the verification code.");
        }

        var session = lockSession(sessionId);
        var normalizedPhone = phoneCredentials.normalize(phoneNumber);
        var normalizedPurpose = normalizePurpose(purpose);

        if (session.consumedAt() != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "otp_used", "This code has already been used. Request a new one.");
        }
        if (Instant.now().isAfter(session.expiresAt())) {
            updateStatus(session.id(), "expired");
            throw new ApiException(HttpStatus.BAD_REQUEST, "otp_expired", "The verification code has expired. Request a new one.");
        }
        if (!session.purpose().equals(normalizedPurpose) || !session.phoneNumber().equals(normalizedPhone)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "otp_mismatch", "OTP session details do not match.");
        }
        if (session.attemptCount() >= 5) {
            updateStatus(session.id(), "locked");
            throw new ApiException(HttpStatus.BAD_REQUEST, "otp_locked", "Too many incorrect attempts. Request a new code.");
        }

        var expected = session.codeHash().getBytes(StandardCharsets.UTF_8);
        var actual = hash(session.id(), code.trim()).getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, actual)) {
            jdbc.sql("""
                    update otp_sessions
                       set attempt_count = attempt_count + 1, updated_at = now()
                     where id = :id
                    """)
                .param("id", session.id())
                .update();
            throw new ApiException(HttpStatus.BAD_REQUEST, "incorrect_otp", "Incorrect verification code.");
        }

        jdbc.sql("""
                update otp_sessions
                   set status = 'verified', verified_at = now(), updated_at = now()
                 where id = :id
                """)
            .param("id", session.id())
            .update();

        return Map.of(
            "sessionId", session.id(),
            "purpose", session.purpose(),
            "phoneNumber", session.phoneNumber(),
            "verified", true
        );
    }

    @Transactional
    public void consumeVerified(UUID sessionId, String phoneNumber, String purpose) {
        var session = lockSession(sessionId);
        var normalizedPhone = phoneCredentials.normalize(phoneNumber);
        var normalizedPurpose = normalizePurpose(purpose);

        if (session.verifiedAt() == null || !"verified".equals(session.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "otp_not_verified", "Verify the OTP before continuing.");
        }
        if (session.consumedAt() != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "otp_used", "This verification session has already been used.");
        }
        if (!session.phoneNumber().equals(normalizedPhone) || !session.purpose().equals(normalizedPurpose)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "otp_mismatch", "OTP session details do not match.");
        }
        if (Instant.now().isAfter(session.expiresAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "otp_expired", "The verification session has expired.");
        }

        jdbc.sql("""
                update otp_sessions
                   set status = 'consumed', consumed_at = now(), updated_at = now()
                 where id = :id
                """)
            .param("id", session.id())
            .update();
    }

    private StoredSession lockSession(UUID sessionId) {
        return jdbc.sql("""
                select id, purpose, phone_number, code_hash, status, attempt_count,
                       expires_at, verified_at, consumed_at
                  from otp_sessions
                 where id = :id
                 for update
                """)
            .param("id", sessionId)
            .query((rs, rowNum) -> new StoredSession(
                rs.getObject("id", UUID.class),
                rs.getString("purpose"),
                rs.getString("phone_number"),
                rs.getString("code_hash"),
                rs.getString("status"),
                rs.getInt("attempt_count"),
                rs.getTimestamp("expires_at").toInstant(),
                rs.getTimestamp("verified_at") == null ? null : rs.getTimestamp("verified_at").toInstant(),
                rs.getTimestamp("consumed_at") == null ? null : rs.getTimestamp("consumed_at").toInstant()
            ))
            .optional()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "otp_not_found", "OTP session not found. Request a new code."));
    }

    private void updateStatus(UUID id, String status) {
        jdbc.sql("update otp_sessions set status = :status, updated_at = now() where id = :id")
            .param("status", status)
            .param("id", id)
            .update();
    }

    private String normalizePurpose(String purpose) {
        if (!"signup".equals(purpose) && !"changePassword".equals(purpose)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_otp_purpose", "Unsupported OTP purpose.");
        }
        return purpose;
    }

    static String hash(UUID sessionId, String code) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                digest.digest((sessionId + ":" + code).getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }
}
