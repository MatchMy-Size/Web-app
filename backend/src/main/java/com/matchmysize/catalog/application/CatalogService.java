package com.matchmysize.catalog.application;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.matchmysize.shared.config.JsonMaps;
import com.matchmysize.shared.measurement.MeasurementUnits;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogService {
    public record CatalogBootstrap(
        List<Map<String, Object>> brandRows,
        Map<String, Map<String, Object>> sellers
    ) {}

    public record CatalogSummary(
        long brandCount,
        long catalogRowCount,
        long sellerCount,
        List<String> brandNames
    ) {}

    public record PublicBrand(String key, String name, String logoUrl) {}

    private record SellerProfile(String sourceAccountId, Map<String, Object> profileData) {}

    private final JdbcClient jdbc;
    private final JsonMaps jsonMaps;

    public CatalogService(JdbcClient jdbc, JsonMaps jsonMaps) {
        this.jdbc = jdbc;
        this.jsonMaps = jsonMaps;
    }

    @Transactional(readOnly = true)
    public CatalogBootstrap bootstrap() {
        var brandRows = jdbc.sql("""
                select catalog_id, raw_data::text as raw_json
                  from brand_size_measurements
                 order by brand_name nulls last, size_key nulls last, catalog_id
                """)
            .query((rs, rowNum) -> {
                var row = jsonMaps.read(rs.getString("raw_json"));
                row.put("id", rs.getString("catalog_id"));
                MeasurementUnits.normalizeCatalogRecord(row);
                return row;
            })
            .list();

        var sellers = new LinkedHashMap<String, Map<String, Object>>();
        jdbc.sql("""
                select distinct seller.source_account_id,
                       seller.profile_data::text as profile_json
                  from brand_size_measurements catalog
                  join app_users seller on seller.id = catalog.seller_app_user_id
                 where seller.role = 'seller'
                 order by seller.source_account_id
                """)
            .query((rs, rowNum) -> new SellerProfile(
                rs.getString("source_account_id"),
                jsonMaps.read(rs.getString("profile_json"))
            ))
            .list()
            .forEach(seller -> sellers.put(
                seller.sourceAccountId(),
                publicSeller(seller.sourceAccountId(), seller.profileData())
            ));

        return new CatalogBootstrap(brandRows, sellers);
    }

    @Transactional(readOnly = true)
    public CatalogSummary summary() {
        var brandCount = jdbc.sql("""
                select count(distinct coalesce(nullif(trim(business_name), ''), nullif(trim(brand_name), '')))
                  from brand_size_measurements
                 where active = true
                """)
            .query(Long.class)
            .single();
        var catalogRowCount = jdbc.sql("select count(*) from brand_size_measurements where active = true")
            .query(Long.class)
            .single();
        var sellerCount = jdbc.sql("""
                select count(*) from app_users
                 where role = 'seller' and status = 'active'
                """)
            .query(Long.class)
            .single();
        var brandNames = jdbc.sql("""
                select distinct coalesce(nullif(trim(business_name), ''), nullif(trim(brand_name), '')) as brand_name
                  from brand_size_measurements
                 where active = true
                   and coalesce(nullif(trim(business_name), ''), nullif(trim(brand_name), '')) is not null
                 order by brand_name
                """)
            .query(String.class)
            .list();

        return new CatalogSummary(brandCount, catalogRowCount, sellerCount, brandNames);
    }

    @Transactional(readOnly = true)
    public List<PublicBrand> publicBrands() {
        return jdbc.sql("""
                select id, profile_data::text as profile_json
                  from app_users
                 where role = 'seller'
                   and status = 'active'
                 order by lower(coalesce(
                     nullif(trim(profile_data ->> 'businessName'), ''),
                     nullif(trim(profile_data ->> 'brandName'), ''),
                     nullif(trim(profile_data ->> 'displayName'), ''),
                     'seller'
                 )), id
                """)
            .query((rs, rowNum) -> {
                var id = rs.getLong("id");
                var profile = jsonMaps.read(rs.getString("profile_json"));
                var name = firstText(
                    profile,
                    "businessName", "brandName", "storeName", "shopName",
                    "companyName", "sellerName", "displayName"
                );
                if (name == null) name = "Seller brand";
                var logoUrl = firstText(
                    profile,
                    "photoURL", "photoUrl", "logoUrl", "logoURL", "imageUrl",
                    "imageURL", "profilePhoto", "profileImage"
                );
                return new PublicBrand("seller-" + id, name, logoUrl);
            })
            .list();
    }

    private Map<String, Object> publicSeller(String id, Map<String, Object> profile) {
        var displayName = firstText(profile, "displayName");
        if (displayName == null) {
            displayName = String.join(" ",
                firstText(profile, "firstName") == null ? "" : firstText(profile, "firstName"),
                firstText(profile, "lastName") == null ? "" : firstText(profile, "lastName")
            ).trim();
        }
        if (displayName.isBlank()) displayName = firstText(profile, "email");
        if (displayName == null || displayName.isBlank()) displayName = "Seller";

        var businessName = firstText(
            profile,
            "businessName", "storeName", "shopName", "companyName",
            "sellerName", "brandName", "displayName"
        );
        if (businessName == null) businessName = displayName;

        var result = new LinkedHashMap<String, Object>();
        result.put("uid", id);
        result.put("businessName", businessName);
        result.put("displayName", displayName);
        result.put("logoKey", firstText(profile, "logoKey"));
        result.put("photoURL", firstText(
            profile,
            "photoURL", "photoUrl", "imageUrl", "imageURL", "profilePhoto",
            "profileImage", "bannerImage", "bannerURL", "bannerUrl", "logoUrl", "logoURL"
        ));
        return result;
    }

    private String firstText(Map<String, Object> map, String... keys) {
        for (var key : keys) {
            var value = map.get(key);
            if (value instanceof String text && !text.isBlank()) return text.trim();
        }
        return null;
    }
}
