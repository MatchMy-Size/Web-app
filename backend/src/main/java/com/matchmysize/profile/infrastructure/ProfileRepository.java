package com.matchmysize.profile.infrastructure;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.matchmysize.shared.config.JsonMaps;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ProfileRepository {
    public record FamilyMember(String memberKey, Map<String, Object> data) {}

    private final JdbcClient jdbc;
    private final JsonMaps jsonMaps;

    public ProfileRepository(JdbcClient jdbc, JsonMaps jsonMaps) {
        this.jdbc = jdbc;
        this.jsonMaps = jsonMaps;
    }

    public Optional<Map<String, Object>> findMeasurements(long appUserId) {
        return jdbc.sql("""
                select measurement_data::text
                  from customer_measurements
                 where app_user_id = :appUserId
                """)
            .param("appUserId", appUserId)
            .query(String.class)
            .optional()
            .map(jsonMaps::read);
    }

    public void saveMeasurements(long appUserId, Map<String, Object> measurements) {
        jdbc.sql("""
                insert into customer_measurements (app_user_id, measurement_data)
                values (:appUserId, cast(:measurementData as jsonb))
                on conflict (app_user_id) do update
                    set measurement_data = excluded.measurement_data,
                        updated_at = now()
                """)
            .param("appUserId", appUserId)
            .param("measurementData", jsonMaps.write(measurements))
            .update();
    }

    public List<FamilyMember> findFamilyMembers(long appUserId) {
        return jdbc.sql("""
                select member_key, member_data::text as member_json
                  from family_members
                 where app_user_id = :appUserId
                 order by lower(coalesce(member_data ->> 'firstName', member_key))
                """)
            .param("appUserId", appUserId)
            .query((rs, rowNum) -> new FamilyMember(
                rs.getString("member_key"),
                jsonMaps.read(rs.getString("member_json"))
            ))
            .list();
    }

    public Optional<FamilyMember> findFamilyMember(long appUserId, String memberKey) {
        return jdbc.sql("""
                select member_key, member_data::text as member_json
                  from family_members
                 where app_user_id = :appUserId and member_key = :memberKey
                """)
            .param("appUserId", appUserId)
            .param("memberKey", memberKey)
            .query((rs, rowNum) -> new FamilyMember(
                rs.getString("member_key"),
                jsonMaps.read(rs.getString("member_json"))
            ))
            .optional();
    }

    public void saveFamilyMember(long appUserId, String memberKey, Map<String, Object> memberData) {
        jdbc.sql("""
                insert into family_members (app_user_id, member_key, member_data)
                values (:appUserId, :memberKey, cast(:memberData as jsonb))
                on conflict (app_user_id, member_key) do update
                    set member_data = excluded.member_data,
                        updated_at = now()
                """)
            .param("appUserId", appUserId)
            .param("memberKey", memberKey)
            .param("memberData", jsonMaps.write(memberData))
            .update();
    }
}
