package com.matchmysize.recommendation.infrastructure;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class FitFeedbackRepository {
    public record CatalogRecommendation(
        String catalogId,
        String brandName,
        String productTitle,
        String category,
        String recommendedSize
    ) {}

    public record FitFeedbackRecord(
        UUID id,
        long appUserId,
        String catalogId,
        String measurementProfileKey,
        String experience,
        String outcome,
        String recommendedSize,
        BigDecimal recommendationScore,
        String confidence,
        String algorithmVersion,
        String brandName,
        String productTitle,
        String category,
        String note
    ) {}

    public record SavedFeedback(UUID id, Instant createdAt, Instant updatedAt) {}

    private final JdbcClient jdbc;

    public FitFeedbackRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<CatalogRecommendation> findActiveCatalog(String catalogId) {
        return jdbc.sql("""
                select catalog_id,
                       coalesce(
                           nullif(trim(brand_name), ''),
                           nullif(trim(business_name), ''),
                           'Unknown brand'
                       ) as resolved_brand_name,
                       coalesce(
                           nullif(trim(raw_data ->> 'title'), ''),
                           nullif(trim(raw_data ->> 'productName'), ''),
                           nullif(trim(raw_data ->> 'name'), ''),
                           nullif(trim(subcategory), ''),
                           nullif(trim(clothing_type), ''),
                           'Recommended item'
                       ) as resolved_product_title,
                       coalesce(
                           nullif(trim(subcategory), ''),
                           nullif(trim(clothing_type), ''),
                           nullif(trim(category), ''),
                           'Uncategorized'
                       ) as resolved_category,
                       coalesce(
                           nullif(trim(size_label), ''),
                           nullif(trim(raw_data ->> 'sizeLabels'), ''),
                           nullif(trim(raw_data ->> 'sizeLabel'), ''),
                           nullif(trim(raw_data ->> 'size'), ''),
                           'N/A'
                       ) as resolved_size
                  from brand_size_measurements
                 where catalog_id = :catalogId
                   and active = true
                """)
            .param("catalogId", catalogId)
            .query((rs, rowNum) -> new CatalogRecommendation(
                rs.getString("catalog_id"),
                rs.getString("resolved_brand_name"),
                rs.getString("resolved_product_title"),
                rs.getString("resolved_category"),
                rs.getString("resolved_size")
            ))
            .optional();
    }

    public SavedFeedback save(FitFeedbackRecord feedback) {
        return jdbc.sql("""
                insert into fit_feedback (
                    id, app_user_id, catalog_id, measurement_profile_key,
                    experience, outcome, recommended_size, recommendation_score,
                    confidence, algorithm_version, brand_name, product_title,
                    category, note
                ) values (
                    :id, :appUserId, :catalogId, :measurementProfileKey,
                    :experience, :outcome, :recommendedSize, :recommendationScore,
                    :confidence, :algorithmVersion, :brandName, :productTitle,
                    :category, :note
                )
                on conflict (app_user_id, catalog_id, measurement_profile_key)
                do update set
                    experience = excluded.experience,
                    outcome = excluded.outcome,
                    recommended_size = excluded.recommended_size,
                    recommendation_score = excluded.recommendation_score,
                    confidence = excluded.confidence,
                    algorithm_version = excluded.algorithm_version,
                    brand_name = excluded.brand_name,
                    product_title = excluded.product_title,
                    category = excluded.category,
                    note = excluded.note,
                    updated_at = now()
                returning id, created_at, updated_at
                """)
            .param("id", feedback.id())
            .param("appUserId", feedback.appUserId())
            .param("catalogId", feedback.catalogId())
            .param("measurementProfileKey", feedback.measurementProfileKey())
            .param("experience", feedback.experience())
            .param("outcome", feedback.outcome())
            .param("recommendedSize", feedback.recommendedSize())
            .param("recommendationScore", feedback.recommendationScore())
            .param("confidence", feedback.confidence())
            .param("algorithmVersion", feedback.algorithmVersion())
            .param("brandName", feedback.brandName())
            .param("productTitle", feedback.productTitle())
            .param("category", feedback.category())
            .param("note", feedback.note())
            .query((rs, rowNum) -> new SavedFeedback(
                rs.getObject("id", UUID.class),
                timestamp(rs.getTimestamp("created_at")),
                timestamp(rs.getTimestamp("updated_at"))
            ))
            .single();
    }

    private static Instant timestamp(Timestamp value) {
        return value == null ? null : value.toInstant();
    }
}
