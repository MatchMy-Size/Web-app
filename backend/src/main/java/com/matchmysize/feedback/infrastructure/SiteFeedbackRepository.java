package com.matchmysize.feedback.infrastructure;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class SiteFeedbackRepository {
    public record SiteFeedbackRecord(
        UUID id,
        long appUserId,
        String displayName,
        int rating,
        String message
    ) {}

    public record SavedSiteFeedback(
        UUID id,
        String displayName,
        int rating,
        String message,
        Instant createdAt,
        Instant updatedAt
    ) {}

    private final JdbcClient jdbc;

    public SiteFeedbackRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public SavedSiteFeedback save(SiteFeedbackRecord feedback) {
        return jdbc.sql("""
                insert into site_feedback (
                    id, app_user_id, display_name, rating, message, publication_status
                ) values (
                    :id, :appUserId, :displayName, :rating, :message, 'PUBLISHED'
                )
                on conflict (app_user_id)
                do update set
                    display_name = excluded.display_name,
                    rating = excluded.rating,
                    message = excluded.message,
                    publication_status = 'PUBLISHED',
                    updated_at = now()
                returning id, display_name, rating, message, created_at, updated_at
                """)
            .param("id", feedback.id())
            .param("appUserId", feedback.appUserId())
            .param("displayName", feedback.displayName())
            .param("rating", feedback.rating())
            .param("message", feedback.message())
            .query((rs, rowNum) -> map(rs))
            .single();
    }

    public List<SavedSiteFeedback> findPublished() {
        return jdbc.sql("""
                select feedback.id, feedback.display_name, feedback.rating, feedback.message,
                       feedback.created_at, feedback.updated_at
                  from site_feedback feedback
                  join app_users customer on customer.id = feedback.app_user_id
                 where feedback.publication_status = 'PUBLISHED'
                   and customer.role = 'customer'
                   and customer.status = 'active'
                 order by feedback.updated_at desc
                 limit 12
                """)
            .query((rs, rowNum) -> map(rs))
            .list();
    }

    private SavedSiteFeedback map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new SavedSiteFeedback(
            rs.getObject("id", UUID.class),
            rs.getString("display_name"),
            rs.getInt("rating"),
            rs.getString("message"),
            timestamp(rs.getTimestamp("created_at")),
            timestamp(rs.getTimestamp("updated_at"))
        );
    }

    private static Instant timestamp(Timestamp value) {
        return value == null ? null : value.toInstant();
    }
}
