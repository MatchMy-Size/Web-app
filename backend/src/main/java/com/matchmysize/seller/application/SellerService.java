package com.matchmysize.seller.application;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.matchmysize.identity.infrastructure.AppUserRepository;
import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import com.matchmysize.seller.infrastructure.SellerRepository;
import com.matchmysize.seller.infrastructure.SellerRepository.PersistedSize;
import com.matchmysize.shared.api.ApiException;
import com.matchmysize.shared.config.JsonMaps;
import com.matchmysize.shared.measurement.MeasurementUnits;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SellerService {
    public record SellerProfile(
        String businessName,
        String contactName,
        String email,
        String phoneNumber,
        String address,
        String photoUrl,
        String websiteUrl,
        String instagramUrl,
        String facebookUrl,
        String tiktokUrl,
        String role,
        String status
    ) {}

    public record DashboardResponse(SellerProfile profile, long categoryCount, long sizeCount) {}
    public record SizeInput(String catalogId, String sizeLabel, BigDecimal sizeKey, Map<String, Object> measurements) {}
    public record SaveChartCommand(
        String department,
        String mainCategory,
        String subcategory,
        String unit,
        String measurementBasis,
        List<SizeInput> sizes
    ) {}
    public record SizeResponse(
        String catalogId,
        String sizeLabel,
        BigDecimal sizeKey,
        BigDecimal averagePoint,
        Map<String, Object> measurements
    ) {}
    public record SizeChartResponse(
        UUID id,
        String brandName,
        String department,
        String mainCategory,
        String subcategory,
        String unit,
        String measurementBasis,
        List<String> measurementKeys,
        List<String> primaryMeasurementKeys,
        List<SizeResponse> sizes
    ) {}

    private record MeasurementSpec(List<String> keys, List<String> primaryKeys) {}

    private static final Set<String> DEPARTMENTS = Set.of("MEN", "WOMEN", "CHILDREN", "UNISEX");
    private static final Set<String> CATEGORIES = Set.of("shirt", "tshirt", "trouser", "short", "blouse", "dress");
    private static final Map<String, MeasurementSpec> SPECS = Map.ofEntries(
        Map.entry("MEN:shirt", spec(List.of("neck", "chest", "sleeve", "shoulder"), "neck")),
        Map.entry("MEN:tshirt", spec(List.of("chest", "length", "shoulder"), "chest")),
        Map.entry("MEN:trouser", spec(List.of("waist", "inseam", "outseam"), "waist")),
        Map.entry("MEN:short", spec(List.of("waist", "inseam"), "waist")),
        Map.entry("WOMEN:blouse", spec(List.of("bust", "length", "shoulder", "waist"), "bust")),
        Map.entry("WOMEN:tshirt", spec(List.of("bust", "length", "shoulder", "waist"), "bust")),
        Map.entry("WOMEN:trouser", spec(List.of("waist", "hip", "thigh", "inseam", "outseam"), "waist")),
        Map.entry("WOMEN:short", spec(List.of("waist", "hip", "thigh", "inseam"), "waist")),
        Map.entry("WOMEN:dress", spec(List.of("bust", "shoulder", "waist", "length"), "bust")),
        Map.entry("CHILDREN:shirt", spec(List.of("chest", "length", "sleeve", "shoulder"), "chest")),
        Map.entry("CHILDREN:tshirt", spec(List.of("chest", "length", "shoulder"), "chest")),
        Map.entry("CHILDREN:trouser", spec(List.of("waist", "hip", "inseam", "outseam"), "waist")),
        Map.entry("CHILDREN:short", spec(List.of("waist", "hip", "inseam"), "waist")),
        Map.entry("CHILDREN:dress", spec(List.of("chest", "waist", "length"), "chest")),
        Map.entry("UNISEX:shirt", spec(List.of("neck", "chest", "sleeve", "shoulder"), "chest")),
        Map.entry("UNISEX:tshirt", spec(List.of("chest", "length", "shoulder"), "chest"))
    );

    private final SellerRepository sellers;
    private final AppUserRepository users;
    private final JsonMaps jsonMaps;

    public SellerService(SellerRepository sellers, AppUserRepository users, JsonMaps jsonMaps) {
        this.sellers = sellers;
        this.users = users;
        this.jsonMaps = jsonMaps;
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard(AppUser appUser) {
        requireSeller(appUser);
        var stats = sellers.dashboardStats(appUser.id());
        return new DashboardResponse(profile(appUser), stats.categoryCount(), stats.sizeCount());
    }

    @Transactional
    public SellerProfile updateProfile(AppUser appUser, Map<String, Object> payload) {
        requireSeller(appUser);
        var current = jsonMaps.copy(appUser.profileData());
        current.put("businessName", requiredText(payload.get("businessName"), "Business name is required."));
        current.put("brandName", current.get("businessName"));
        current.put("contactName", requiredText(payload.get("contactName"), "Contact name is required."));
        current.put("displayName", current.get("contactName"));
        putOptional(current, "email", payload.get("email"));
        putOptional(current, "phoneNumber", payload.get("phoneNumber"));
        putOptional(current, "address", payload.get("address"));
        putOptional(current, "photoURL", payload.get("photoUrl"));
        putOptional(current, "websiteUrl", normalizePublicUrl(payload.get("websiteUrl"), "Website"));
        putOptional(current, "instagramUrl", normalizePublicUrl(payload.get("instagramUrl"), "Instagram"));
        putOptional(current, "facebookUrl", normalizePublicUrl(payload.get("facebookUrl"), "Facebook"));
        putOptional(current, "tiktokUrl", normalizePublicUrl(payload.get("tiktokUrl"), "TikTok"));
        current.put("role", "seller");
        current.put("updatedAt", Instant.now().toString());
        var updated = users.updateSellerProfile(appUser.id(), current);
        sellers.updateCatalogBranding(
            appUser.id(),
            requiredText(current.get("businessName"), "Business name is required."),
            text(current.get("photoURL"))
        );
        return profile(updated);
    }

    @Transactional(readOnly = true)
    public List<SizeChartResponse> categories(AppUser appUser) {
        requireSeller(appUser);
        var grouped = new LinkedHashMap<UUID, List<SellerRepository.CatalogRow>>();
        sellers.findActiveCatalog(appUser.id()).forEach(row ->
            grouped.computeIfAbsent(row.chartId(), ignored -> new ArrayList<>()).add(row)
        );
        return grouped.values().stream().map(this::chartResponse).toList();
    }

    @Transactional
    public SizeChartResponse createCategory(AppUser appUser, SaveChartCommand command) {
        requireSeller(appUser);
        var chartId = UUID.randomUUID();
        saveChart(appUser, chartId, command, false);
        return findChart(categories(users.findById(appUser.id()).orElseThrow()), chartId);
    }

    @Transactional
    public SizeChartResponse updateCategory(AppUser appUser, UUID chartId, SaveChartCommand command) {
        requireSeller(appUser);
        if (!sellers.ownsChart(appUser.id(), chartId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "size_chart_not_found", "Size chart not found.");
        }
        saveChart(appUser, chartId, command, true);
        return findChart(categories(users.findById(appUser.id()).orElseThrow()), chartId);
    }

    @Transactional
    public void archiveCategory(AppUser appUser, UUID chartId) {
        requireSeller(appUser);
        if (sellers.archiveChart(appUser.id(), chartId) == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "size_chart_not_found", "Size chart not found.");
        }
    }

    private void saveChart(AppUser appUser, UUID chartId, SaveChartCommand command, boolean updating) {
        var department = normalizeDepartment(command.department());
        var mainCategory = normalizeCategory(command.mainCategory());
        var spec = SPECS.get(department + ":" + mainCategory);
        if (spec == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "unsupported_category", "That category is not supported for the selected department.");
        }
        if (command.sizes() == null || command.sizes().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "sizes_required", "Add at least one size row.");
        }
        var inputUnit = MeasurementUnits.usesInches(command.unit()) ? "in" : "cm";
        var basis = "GARMENT".equalsIgnoreCase(command.measurementBasis()) ? "GARMENT" : "BODY";
        var brandName = requiredText(appUser.profileData().get("businessName"), "Complete your seller profile before adding a size chart.");
        var sourceAccountId = appUser.sourceAccountId() == null
            ? appUser.authUserId().toString()
            : appUser.sourceAccountId();
        var logoUrl = text(appUser.profileData().get("photoURL"));
        var retainedIds = new ArrayList<String>();
        var existingIds = updating
            ? new LinkedHashSet<>(sellers.findCatalogIds(appUser.id(), chartId))
            : Set.<String>of();

        for (int index = 0; index < command.sizes().size(); index++) {
            var size = command.sizes().get(index);
            var sizeLabel = requiredText(size.sizeLabel(), "Every row needs a size label.");
            var measurements = normalizeMeasurements(size.measurements(), inputUnit, spec);
            var hasPrimary = spec.primaryKeys().stream().anyMatch(measurements::containsKey);
            if (!hasPrimary) {
                throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "primary_measurement_required",
                    "Size " + sizeLabel + " needs at least one primary measurement: " + String.join(", ", spec.primaryKeys()) + "."
                );
            }
            var requestedId = text(size.catalogId());
            var catalogId = requestedId != null && existingIds.contains(requestedId)
                ? requestedId
                : "seller_" + UUID.randomUUID().toString().replace("-", "");
            var average = MeasurementUnits.average(measurements);
            var raw = new LinkedHashMap<String, Object>();
            raw.put("brandName", brandName);
            raw.put("businessName", brandName);
            raw.put("clothingType", mainCategory);
            raw.put("gender", displayDepartment(department));
            raw.put("category", displayDepartment(department));
            raw.put("subCategory", optionalText(command.subcategory()));
            raw.put("sizeLabel", sizeLabel);
            raw.put("sizeLabels", sizeLabel);
            raw.put("sizeKey", size.sizeKey() == null ? BigDecimal.valueOf(index + 1L) : size.sizeKey());
            raw.put("unit", MeasurementUnits.CANONICAL_UNIT);
            raw.put("averagePoint", average);
            raw.put("measurements", measurements);
            raw.put("measurementKeys", spec.keys());
            raw.put("primaryMeasurementKeys", spec.primaryKeys());
            raw.put("measurementBasis", basis);
            raw.put("sellerUid", sourceAccountId);
            raw.put("sellerRef", "users/" + sourceAccountId);
            raw.put("logoUrl", logoUrl);
            raw.put("isActive", true);

            var persisted = new PersistedSize(
                chartId,
                catalogId,
                brandName,
                brandName,
                displayDepartment(department),
                mainCategory,
                optionalText(command.subcategory()),
                sizeLabel,
                size.sizeKey() == null ? BigDecimal.valueOf(index + 1L) : size.sizeKey(),
                average,
                raw
            );
            if (requestedId != null && existingIds.contains(requestedId)) {
                if (sellers.updateSize(appUser.id(), persisted) == 0) {
                    throw new ApiException(HttpStatus.NOT_FOUND, "catalog_row_not_found", "A size row could not be updated.");
                }
            } else {
                sellers.insertSize(appUser.id(), persisted);
            }
            retainedIds.add(catalogId);
        }
        if (updating) sellers.deactivateMissingRows(appUser.id(), chartId, retainedIds);
    }

    private Map<String, Object> normalizeMeasurements(
        Map<String, Object> input,
        String unit,
        MeasurementSpec spec
    ) {
        if (input == null) return Map.of();
        var allowed = new LinkedHashMap<String, Object>();
        spec.keys().forEach(key -> {
            if (input.containsKey(key)) allowed.put(key, input.get(key));
        });
        return MeasurementUnits.toCentimetres(allowed, unit);
    }

    private SizeChartResponse chartResponse(List<SellerRepository.CatalogRow> rows) {
        var first = rows.get(0);
        var firstRaw = first.rawData();
        var measurementKeys = stringList(firstRaw.get("measurementKeys"));
        if (measurementKeys.isEmpty()) {
            measurementKeys = new ArrayList<>(jsonMaps.asMap(firstRaw.get("measurements")).keySet());
        }
        var primaryKeys = stringList(firstRaw.get("primaryMeasurementKeys"));
        if (primaryKeys.isEmpty() && !measurementKeys.isEmpty()) primaryKeys = List.of(measurementKeys.get(0));
        var basis = text(firstRaw.get("measurementBasis"));
        return new SizeChartResponse(
            first.chartId(),
            firstText(first.businessName(), first.brandName(), "Brand"),
            normalizeDepartment(firstText(first.department(), first.category(), "UNISEX")),
            normalizeCategory(firstText(first.mainCategory(), first.subcategory(), "shirt")),
            first.subcategory(),
            MeasurementUnits.CANONICAL_UNIT,
            basis == null ? "BODY" : basis.toUpperCase(Locale.ROOT),
            measurementKeys,
            primaryKeys,
            rows.stream().map(row -> new SizeResponse(
                row.catalogId(),
                firstText(row.sizeLabel(), text(row.rawData().get("sizeLabel")), "N/A"),
                row.sizeKey(),
                row.averagePoint(),
                jsonMaps.asMap(row.rawData().get("measurements"))
            )).toList()
        );
    }

    private SizeChartResponse findChart(List<SizeChartResponse> charts, UUID chartId) {
        return charts.stream().filter(chart -> chart.id().equals(chartId)).findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "size_chart_not_found", "Size chart not found."));
    }

    private SellerProfile profile(AppUser appUser) {
        var data = appUser.profileData();
        return new SellerProfile(
            firstText(text(data.get("businessName")), text(data.get("brandName")), "Seller brand"),
            firstText(text(data.get("contactName")), text(data.get("displayName")), "Seller"),
            firstText(text(data.get("email")), appUser.authEmail(), ""),
            firstText(text(data.get("phoneNumber")), appUser.phoneNumber(), ""),
            firstText(text(data.get("address")), ""),
            firstText(text(data.get("photoURL")), text(data.get("logoUrl")), ""),
            firstText(text(data.get("websiteUrl")), text(data.get("website")), ""),
            firstText(text(data.get("instagramUrl")), text(data.get("instagram")), ""),
            firstText(text(data.get("facebookUrl")), text(data.get("facebook")), ""),
            firstText(text(data.get("tiktokUrl")), text(data.get("tiktok")), ""),
            appUser.role(),
            appUser.status()
        );
    }

    private void requireSeller(AppUser appUser) {
        if (!"seller".equalsIgnoreCase(appUser.role())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "seller_access_required", "Seller access is required.");
        }
        if (!"active".equalsIgnoreCase(appUser.status())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "account_inactive", "Your seller account is not active.");
        }
    }

    private String normalizeDepartment(String value) {
        var token = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (token.startsWith("MALE")) token = "MEN";
        if (token.startsWith("FEMALE")) token = "WOMEN";
        if (token.startsWith("CHILD") || token.startsWith("KID")) token = "CHILDREN";
        if (!DEPARTMENTS.contains(token)) token = "UNISEX";
        return token;
    }

    private String normalizeCategory(String value) {
        var token = value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
        if (token.equals("teeshirt")) token = "tshirt";
        if (token.equals("trousers") || token.equals("pants")) token = "trouser";
        if (token.equals("shorts")) token = "short";
        if (!CATEGORIES.contains(token)) token = "shirt";
        return token;
    }

    private String displayDepartment(String department) {
        return switch (department) {
            case "MEN" -> "Men";
            case "WOMEN" -> "Women";
            case "CHILDREN" -> "Children";
            default -> "Unisex";
        };
    }

    private List<String> stringList(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        return list.stream().filter(String.class::isInstance).map(String.class::cast).toList();
    }

    private String requiredText(Object value, String message) {
        var text = text(value);
        if (text == null) throw new ApiException(HttpStatus.BAD_REQUEST, "required_field", message);
        return text;
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void putOptional(Map<String, Object> target, String key, Object value) {
        var text = text(value);
        if (text == null) target.remove(key); else target.put(key, text);
    }

    private String normalizePublicUrl(Object value, String label) {
        var candidate = text(value);
        if (candidate == null) return null;
        if (candidate.matches("(?i)^[a-z][a-z0-9+.-]*:.*") && !candidate.matches("(?i)^https?://.*")) {
            throw invalidPublicLink(label);
        }
        if (!candidate.matches("(?i)^https?://.*")) candidate = "https://" + candidate;
        try {
            var uri = new URI(candidate);
            var scheme = uri.getScheme();
            if (("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) && uri.getHost() != null) {
                return uri.toString();
            }
        } catch (URISyntaxException ignored) {
            // Converted to a field-specific validation error below.
        }
        throw invalidPublicLink(label);
    }

    private ApiException invalidPublicLink(String label) {
        return new ApiException(HttpStatus.BAD_REQUEST, "invalid_public_link", label + " must be a valid website link.");
    }

    private String firstText(String... values) {
        for (var value : values) if (value != null && !value.isBlank()) return value.trim();
        return null;
    }

    private String text(Object value) {
        return value instanceof String text && !text.isBlank() ? text.trim() : null;
    }

    private static MeasurementSpec spec(List<String> keys, String... primaryKeys) {
        return new MeasurementSpec(keys, List.of(primaryKeys));
    }
}
