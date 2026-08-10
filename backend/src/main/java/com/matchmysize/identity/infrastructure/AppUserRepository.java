package com.matchmysize.identity.infrastructure;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.matchmysize.shared.config.JsonMaps;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AppUserRepository {
    public record AppUser(
        long id,
        UUID authUserId,
        String sourceAccountId,
        String authEmail,
        String phoneNumber,
        String role,
        String status,
        Map<String, Object> profileData
    ) {}

    private final JdbcClient jdbc;
    private final JsonMaps jsonMaps;

    public AppUserRepository(JdbcClient jdbc, JsonMaps jsonMaps) {
        this.jdbc = jdbc;
        this.jsonMaps = jsonMaps;
    }

    public Optional<AppUser> findByAuthUserId(UUID authUserId) {
        return find("auth_user_id = :value", authUserId);
    }

    public Optional<AppUser> findBySourceAccountId(String sourceAccountId) {
        return find("source_account_id = :value", sourceAccountId);
    }

    public Optional<AppUser> findByPhoneNumber(String phoneNumber) {
        return find("phone_number = :value", phoneNumber);
    }

    public Optional<AppUser> findByAuthEmail(String authEmail) {
        return find("lower(auth_email) = lower(:value)", authEmail);
    }

    public AppUser upsertAuthentication(UUID authUserId, String authEmail, String phoneNumber) {
        return jdbc.sql("""
                insert into app_users (auth_user_id, auth_email, phone_number)
                values (:authUserId, :authEmail, :phoneNumber)
                on conflict (auth_user_id) do update
                   set auth_email = coalesce(excluded.auth_email, app_users.auth_email),
                       phone_number = coalesce(excluded.phone_number, app_users.phone_number),
                       updated_at = now()
                returning id, auth_user_id, source_account_id, auth_email, phone_number,
                          role, status, profile_data::text as profile_json
                """)
            .param("authUserId", authUserId)
            .param("authEmail", authEmail)
            .param("phoneNumber", phoneNumber)
            .query(this::mapRow)
            .single();
    }

    public void updateProfileData(long appUserId, Map<String, Object> profileData) {
        jdbc.sql("""
                update app_users
                   set profile_data = cast(:profileData as jsonb),
                       phone_number = coalesce(cast(:phoneNumber as varchar), phone_number),
                       email = coalesce(cast(:email as text), email),
                       updated_at = now()
                 where id = :id
                """)
            .param("profileData", jsonMaps.write(profileData))
            .param("phoneNumber", text(profileData.get("phoneNumber"), profileData.get("phone")))
            .param("email", text(profileData.get("email")))
            .param("id", appUserId)
            .update();
    }

    public Optional<AppUser> findById(long id) {
        return find("id = :value", id);
    }

    private Optional<AppUser> find(String predicate, Object value) {
        return jdbc.sql("""
                select id, auth_user_id, source_account_id, auth_email, phone_number,
                       role, status, profile_data::text as profile_json
                  from app_users
                 where %s
                """.formatted(predicate))
            .param("value", value)
            .query(this::mapRow)
            .optional();
    }

    private AppUser mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new AppUser(
            rs.getLong("id"),
            rs.getObject("auth_user_id", UUID.class),
            rs.getString("source_account_id"),
            rs.getString("auth_email"),
            rs.getString("phone_number"),
            rs.getString("role"),
            rs.getString("status"),
            jsonMaps.read(rs.getString("profile_json"))
        );
    }

    private String text(Object... candidates) {
        for (var candidate : candidates) {
            if (candidate instanceof String value && !value.isBlank()) return value.trim();
        }
        return null;
    }
}
