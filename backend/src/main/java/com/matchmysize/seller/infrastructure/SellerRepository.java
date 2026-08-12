package com.matchmysize.seller.infrastructure;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.matchmysize.shared.config.JsonMaps;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class SellerRepository {
    public record DashboardStats(long categoryCount, long sizeCount) {}

    public record CatalogRow(
        UUID chartId,
        String catalogId,
        String brandName,
        String businessName,
        String department,
        String category,
        String mainCategory,
        String subcategory,
        String sizeLabel,
        BigDecimal sizeKey,
        String unit,
        BigDecimal averagePoint,
        Map<String, Object> rawData
    ) {}

    public record PersistedSize(
        UUID chartId,
        String catalogId,
        String brandName,
        String businessName,
        String department,
        String mainCategory,
        String subcategory,
        String sizeLabel,
        BigDecimal sizeKey,
        BigDecimal averagePoint,
        Map<String, Object> rawData
    ) {}

    private final JdbcClient jdbc;
    private final JsonMaps jsonMaps;

    public SellerRepository(JdbcClient jdbc, JsonMaps jsonMaps) {
        this.jdbc = jdbc;
        this.jsonMaps = jsonMaps;
    }

    public DashboardStats dashboardStats(long sellerAppUserId) {
        return jdbc.sql("""
                select count(distinct size_chart_id) filter (where active = true) as category_count,
                       count(*) filter (where active = true) as size_count
                  from brand_size_measurements
                 where seller_app_user_id = :sellerAppUserId
                """)
            .param("sellerAppUserId", sellerAppUserId)
            .query((rs, rowNum) -> new DashboardStats(
                rs.getLong("category_count"),
                rs.getLong("size_count")
            ))
            .single();
    }

    public List<CatalogRow> findActiveCatalog(long sellerAppUserId) {
        return jdbc.sql("""
                select size_chart_id, catalog_id, brand_name, business_name,
                       gender, category, clothing_type, subcategory, size_label,
                       size_key, unit, average_point, raw_data::text as raw_json
                  from brand_size_measurements
                 where seller_app_user_id = :sellerAppUserId
                   and active = true
                 order by lower(coalesce(gender, category, '')),
                          lower(coalesce(clothing_type, subcategory, '')),
                          size_key nulls last,
                          lower(coalesce(size_label, ''))
                """)
            .param("sellerAppUserId", sellerAppUserId)
            .query((rs, rowNum) -> new CatalogRow(
                rs.getObject("size_chart_id", UUID.class),
                rs.getString("catalog_id"),
                rs.getString("brand_name"),
                rs.getString("business_name"),
                rs.getString("gender"),
                rs.getString("category"),
                rs.getString("clothing_type"),
                rs.getString("subcategory"),
                rs.getString("size_label"),
                rs.getBigDecimal("size_key"),
                rs.getString("unit"),
                rs.getBigDecimal("average_point"),
                jsonMaps.read(rs.getString("raw_json"))
            ))
            .list();
    }

    public void updateCatalogBranding(long sellerAppUserId, String brandName, String photoUrl) {
        jdbc.sql("""
                update brand_size_measurements
                   set brand_name = :brandName,
                       business_name = :brandName,
                       raw_data = jsonb_set(
                           jsonb_set(raw_data, '{brandName}', to_jsonb(cast(:brandName as text)), true),
                           '{logoUrl}', coalesce(to_jsonb(cast(:photoUrl as text)), 'null'::jsonb), true
                       ),
                       updated_at = now()
                 where seller_app_user_id = :sellerAppUserId
                """)
            .param("brandName", brandName)
            .param("photoUrl", photoUrl)
            .param("sellerAppUserId", sellerAppUserId)
            .update();
    }

    public boolean ownsChart(long sellerAppUserId, UUID chartId) {
        return jdbc.sql("""
                select exists(
                    select 1
                      from brand_size_measurements
                     where seller_app_user_id = :sellerAppUserId
                       and size_chart_id = :chartId
                )
                """)
            .param("sellerAppUserId", sellerAppUserId)
            .param("chartId", chartId)
            .query(Boolean.class)
            .single();
    }

    public List<String> findCatalogIds(long sellerAppUserId, UUID chartId) {
        return jdbc.sql("""
                select catalog_id
                  from brand_size_measurements
                 where seller_app_user_id = :sellerAppUserId
                   and size_chart_id = :chartId
                """)
            .param("sellerAppUserId", sellerAppUserId)
            .param("chartId", chartId)
            .query(String.class)
            .list();
    }

    public void insertSize(long sellerAppUserId, PersistedSize size) {
        jdbc.sql("""
                insert into brand_size_measurements (
                    catalog_id, brand_name, business_name, clothing_type,
                    gender, category, subcategory, size_label, size_key,
                    unit, average_point, active, raw_data,
                    seller_app_user_id, size_chart_id
                ) values (
                    :catalogId, :brandName, :businessName, :mainCategory,
                    :department, :department, :subcategory, :sizeLabel, :sizeKey,
                    'cm', :averagePoint, true, cast(:rawData as jsonb),
                    :sellerAppUserId, :chartId
                )
                """)
            .param("catalogId", size.catalogId())
            .param("brandName", size.brandName())
            .param("businessName", size.businessName())
            .param("mainCategory", size.mainCategory())
            .param("department", size.department())
            .param("subcategory", size.subcategory())
            .param("sizeLabel", size.sizeLabel())
            .param("sizeKey", size.sizeKey())
            .param("averagePoint", size.averagePoint())
            .param("rawData", jsonMaps.write(size.rawData()))
            .param("sellerAppUserId", sellerAppUserId)
            .param("chartId", size.chartId())
            .update();
    }

    public int updateSize(long sellerAppUserId, PersistedSize size) {
        return jdbc.sql("""
                update brand_size_measurements
                   set brand_name = :brandName,
                       business_name = :businessName,
                       clothing_type = :mainCategory,
                       gender = :department,
                       category = :department,
                       subcategory = :subcategory,
                       size_label = :sizeLabel,
                       size_key = :sizeKey,
                       unit = 'cm',
                       average_point = :averagePoint,
                       active = true,
                       raw_data = cast(:rawData as jsonb),
                       updated_at = now()
                 where catalog_id = :catalogId
                   and seller_app_user_id = :sellerAppUserId
                   and size_chart_id = :chartId
                """)
            .param("brandName", size.brandName())
            .param("businessName", size.businessName())
            .param("mainCategory", size.mainCategory())
            .param("department", size.department())
            .param("subcategory", size.subcategory())
            .param("sizeLabel", size.sizeLabel())
            .param("sizeKey", size.sizeKey())
            .param("averagePoint", size.averagePoint())
            .param("rawData", jsonMaps.write(size.rawData()))
            .param("catalogId", size.catalogId())
            .param("sellerAppUserId", sellerAppUserId)
            .param("chartId", size.chartId())
            .update();
    }

    public void deactivateMissingRows(long sellerAppUserId, UUID chartId, List<String> retainedCatalogIds) {
        if (retainedCatalogIds.isEmpty()) {
            archiveChart(sellerAppUserId, chartId);
            return;
        }
        jdbc.sql("""
                update brand_size_measurements
                   set active = false,
                       raw_data = jsonb_set(raw_data, '{isActive}', 'false'::jsonb, true),
                       updated_at = now()
                 where seller_app_user_id = :sellerAppUserId
                   and size_chart_id = :chartId
                   and catalog_id not in (:retainedCatalogIds)
                """)
            .param("sellerAppUserId", sellerAppUserId)
            .param("chartId", chartId)
            .param("retainedCatalogIds", retainedCatalogIds)
            .update();
    }

    public int archiveChart(long sellerAppUserId, UUID chartId) {
        return jdbc.sql("""
                update brand_size_measurements
                   set active = false,
                       raw_data = jsonb_set(raw_data, '{isActive}', 'false'::jsonb, true),
                       updated_at = now()
                 where seller_app_user_id = :sellerAppUserId
                   and size_chart_id = :chartId
                """)
            .param("sellerAppUserId", sellerAppUserId)
            .param("chartId", chartId)
            .update();
    }
}
