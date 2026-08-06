package com.matchmysize.profile.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.matchmysize.identity.infrastructure.AppUserRepository;
import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import com.matchmysize.profile.infrastructure.ProfileRepository;
import com.matchmysize.shared.api.ApiException;
import com.matchmysize.shared.config.JsonMaps;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
    private final AppUserRepository users;
    private final ProfileRepository profiles;
    private final JsonMaps jsonMaps;

    public ProfileService(
        AppUserRepository users,
        ProfileRepository profiles,
        JsonMaps jsonMaps
    ) {
        this.users = users;
        this.profiles = profiles;
        this.jsonMaps = jsonMaps;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getProfile(AppUser appUser) {
        var profile = jsonMaps.copy(appUser.profileData());
        var measurement = profiles.findMeasurements(appUser.id()).orElseGet(LinkedHashMap::new);
        var result = mergeProfileAndMeasurements(profile, measurement);
        result.put("role", appUser.role());
        result.put("status", appUser.status());

        var familyMembers = new LinkedHashMap<String, Object>();
        for (var member : profiles.findFamilyMembers(appUser.id())) {
            var data = jsonMaps.copy(member.data());
            data.put("id", member.memberKey());
            familyMembers.put(member.memberKey(), data);
        }
        result.put("familyMembers", familyMembers);
        if (!result.containsKey("phoneNumber") && appUser.phoneNumber() != null) {
            result.put("phoneNumber", appUser.phoneNumber());
        }
        return result;
    }

    @Transactional
    public Map<String, Object> saveInitialProfile(AppUser appUser, Map<String, Object> payload) {
        var profile = jsonMaps.copy(appUser.profileData());
        payload.forEach((key, value) -> {
            if (!isProtectedIdentityField(key)) profile.put(key, value);
        });
        profile.put("role", "customer");
        profile.putIfAbsent("createdAt", Instant.now().toString());
        profile.put("updatedAt", Instant.now().toString());

        var profileKey = text(payload.get("measurementProfileKey"));
        if (profileKey == null) {
            var gender = text(payload.get("gender"));
            var clothing = text(payload.get("preferredClothing"));
            profileKey = gender != null && clothing != null ? gender + "_" + clothing : "default";
        }
        profile.put("activeMeasurementProfileKey", profileKey);
        users.updateProfileData(appUser.id(), profile);

        var measurementPayload = profiles.findMeasurements(appUser.id())
            .map(jsonMaps::copy)
            .orElseGet(LinkedHashMap::new);
        measurementPayload.put("gender", payload.get("gender"));
        measurementPayload.put("unit", payload.getOrDefault("unit", "cm"));
        measurementPayload.put("preferredClothing", payload.get("preferredClothing"));
        measurementPayload.put("preferredClothingLabel", payload.get("preferredClothingLabel"));
        measurementPayload.put("activeProfileKey", profileKey);
        measurementPayload.putIfAbsent("profiles", new LinkedHashMap<String, Object>());
        addMeasurementProfile(measurementPayload, profileKey, payload, true);
        measurementPayload.put("createdAt", Instant.now().toString());
        measurementPayload.put("updatedAt", Instant.now().toString());
        profiles.saveMeasurements(appUser.id(), measurementPayload);
        return getProfile(users.findById(appUser.id()).orElseThrow());
    }

    @Transactional
    public Map<String, Object> patchProfile(AppUser appUser, Map<String, Object> payload) {
        var profile = jsonMaps.copy(appUser.profileData());
        payload.forEach((key, value) -> {
            if (!isProtectedIdentityField(key)) profile.put(key, value);
        });
        profile.put("updatedAt", Instant.now().toString());
        users.updateProfileData(appUser.id(), profile);
        return getProfile(users.findById(appUser.id()).orElseThrow());
    }

    @Transactional
    public Map<String, Object> saveMeasurementProfile(AppUser appUser, Map<String, Object> payload) {
        var measurement = profiles.findMeasurements(appUser.id()).orElseGet(LinkedHashMap::new);
        var profileKey = text(payload.get("measurementProfileKey"));
        if (profileKey == null) {
            profileKey = (text(payload.get("gender")) == null ? "default" : text(payload.get("gender")))
                + "_" + text(payload.get("preferredClothing"));
        }
        var setAsActive = Boolean.TRUE.equals(payload.get("setAsActive"));
        addMeasurementProfile(measurement, profileKey, payload, setAsActive);
        measurement.put("gender", payload.get("gender"));
        measurement.put("unit", payload.getOrDefault("unit", "cm"));
        measurement.putIfAbsent("createdAt", Instant.now().toString());
        measurement.put("updatedAt", Instant.now().toString());
        profiles.saveMeasurements(appUser.id(), measurement);

        var profile = jsonMaps.copy(appUser.profileData());
        profile.put("role", "customer");
        profile.put("gender", payload.get("gender"));
        profile.put("unit", payload.getOrDefault("unit", "cm"));
        if (setAsActive) {
            profile.put("preferredClothing", payload.get("preferredClothing"));
            profile.put("preferredClothingLabel", payload.get("preferredClothingLabel"));
            profile.put("activeMeasurementProfileKey", profileKey);
        }
        profile.put("updatedAt", Instant.now().toString());
        users.updateProfileData(appUser.id(), profile);
        return getProfile(users.findById(appUser.id()).orElseThrow());
    }

    @Transactional
    public Map<String, Object> setActiveMeasurementProfile(
        AppUser appUser,
        String profileKey,
        Map<String, Object> payload
    ) {
        var measurement = profiles.findMeasurements(appUser.id())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "measurements_not_found", "No measurement profiles were found."));
        var storedProfiles = jsonMaps.asMap(measurement.get("profiles"));
        if (!storedProfiles.containsKey(profileKey)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "measurement_profile_not_found", "Measurement profile not found.");
        }
        var active = jsonMaps.asMap(storedProfiles.get(profileKey));
        applyActiveMeasurementFields(measurement, profileKey, active, payload);
        profiles.saveMeasurements(appUser.id(), measurement);

        var profile = jsonMaps.copy(appUser.profileData());
        profile.put("activeMeasurementProfileKey", profileKey);
        profile.put("preferredClothing", payload.get("preferredClothing"));
        profile.put("preferredClothingLabel", payload.get("preferredClothingLabel"));
        profile.put("updatedAt", Instant.now().toString());
        users.updateProfileData(appUser.id(), profile);
        return getProfile(users.findById(appUser.id()).orElseThrow());
    }

    @Transactional
    public String createFamilyMember(AppUser appUser, Map<String, Object> payload) {
        var firstName = requiredText(payload.get("firstName"), "Name is required.");
        var relation = requiredText(payload.get("relation"), "Relation is required.");
        var memberKey = "fm_" + UUID.randomUUID().toString().replace("-", "");
        var data = new LinkedHashMap<String, Object>();
        data.put("id", memberKey);
        data.put("ownerUid", appUser.authUserId().toString());
        data.put("firstName", firstName);
        data.put("lastName", null);
        data.put("relation", relation);
        data.put("role", "family_member");
        data.put("subjectType", "family");
        data.put("phoneNumber", null);
        data.put("email", null);
        data.put("photoURL", null);
        data.put("unit", "cm");
        data.put("measurements", Map.of());
        data.put("measurementProfiles", Map.of());
        data.put("activeMeasurementProfileKey", null);
        data.put("createdAt", Instant.now().toString());
        data.put("updatedAt", Instant.now().toString());
        profiles.saveFamilyMember(appUser.id(), memberKey, data);
        return memberKey;
    }

    @Transactional
    public Map<String, Object> saveFamilyMeasurementProfile(
        AppUser appUser,
        String memberKey,
        Map<String, Object> payload
    ) {
        var member = getFamilyMember(appUser, memberKey);
        var data = jsonMaps.copy(member.data());
        var profileKey = text(payload.get("measurementProfileKey"));
        if (profileKey == null) {
            profileKey = (text(payload.get("gender")) == null ? "default" : text(payload.get("gender")))
                + "_" + text(payload.get("preferredClothing"));
        }
        var measurementProfiles = jsonMaps.asMap(data.get("measurementProfiles"));
        var profile = buildMeasurementProfile(profileKey, payload);
        measurementProfiles.put(profileKey, profile);
        data.put("measurementProfiles", measurementProfiles);
        data.put("gender", payload.get("gender"));
        data.put("unit", payload.getOrDefault("unit", "cm"));
        if (Boolean.TRUE.equals(payload.get("setAsActive"))) {
            applyFamilyActiveFields(data, profileKey, profile, payload);
        }
        data.put("updatedAt", Instant.now().toString());
        profiles.saveFamilyMember(appUser.id(), memberKey, data);
        return data;
    }

    @Transactional
    public Map<String, Object> setFamilyActiveMeasurementProfile(
        AppUser appUser,
        String memberKey,
        String profileKey,
        Map<String, Object> payload
    ) {
        var member = getFamilyMember(appUser, memberKey);
        var data = jsonMaps.copy(member.data());
        var measurementProfiles = jsonMaps.asMap(data.get("measurementProfiles"));
        var profile = jsonMaps.asMap(measurementProfiles.get(profileKey));
        if (profile.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "measurement_profile_not_found", "Family measurement profile not found.");
        }
        applyFamilyActiveFields(data, profileKey, profile, payload);
        data.put("updatedAt", Instant.now().toString());
        profiles.saveFamilyMember(appUser.id(), memberKey, data);
        return data;
    }

    private ProfileRepository.FamilyMember getFamilyMember(AppUser appUser, String memberKey) {
        return profiles.findFamilyMember(appUser.id(), memberKey)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "family_member_not_found", "Family member not found."));
    }

    private void addMeasurementProfile(
        Map<String, Object> measurement,
        String profileKey,
        Map<String, Object> payload,
        boolean setAsActive
    ) {
        var storedProfiles = jsonMaps.asMap(measurement.get("profiles"));
        var profile = buildMeasurementProfile(profileKey, payload);
        storedProfiles.put(profileKey, profile);
        measurement.put("profiles", storedProfiles);
        if (setAsActive) {
            applyActiveMeasurementFields(measurement, profileKey, profile, payload);
        }
    }

    private Map<String, Object> buildMeasurementProfile(String profileKey, Map<String, Object> payload) {
        var measurements = positiveNumbers(jsonMaps.asMap(payload.get("measurements")));
        var profile = new LinkedHashMap<String, Object>();
        profile.put("key", profileKey);
        profile.put("gender", payload.get("gender"));
        profile.put("preferredClothing", payload.get("preferredClothing"));
        profile.put("preferredClothingLabel", payload.get("preferredClothingLabel"));
        profile.put("unit", payload.getOrDefault("unit", "cm"));
        profile.put("measurements", measurements);
        profile.put("averagePoint", average(measurements));
        profile.put("primaryMeasurementKeys", stringList(payload.get("primaryMeasurementKeys")));
        profile.put("measurementKeys", new ArrayList<>(measurements.keySet()));
        profile.put("measurementDisplayNames", jsonMaps.asMap(payload.get("measurementDisplayNames")));
        return profile;
    }

    private void applyActiveMeasurementFields(
        Map<String, Object> measurement,
        String profileKey,
        Map<String, Object> active,
        Map<String, Object> payload
    ) {
        measurement.put("activeProfileKey", profileKey);
        measurement.put("preferredClothing", payload.getOrDefault("preferredClothing", active.get("preferredClothing")));
        measurement.put("preferredClothingLabel", payload.getOrDefault("preferredClothingLabel", active.get("preferredClothingLabel")));
        measurement.put("measurements", active.get("measurements"));
        measurement.put("averagePoint", active.get("averagePoint"));
        measurement.put("primaryMeasurementKeys", active.get("primaryMeasurementKeys"));
        measurement.put("measurementKeys", active.get("measurementKeys"));
        measurement.put("measurementDisplayNames", active.get("measurementDisplayNames"));
        measurement.put("updatedAt", Instant.now().toString());
    }

    private void applyFamilyActiveFields(
        Map<String, Object> data,
        String profileKey,
        Map<String, Object> profile,
        Map<String, Object> payload
    ) {
        data.put("activeMeasurementProfileKey", profileKey);
        data.put("preferredClothing", payload.getOrDefault("preferredClothing", profile.get("preferredClothing")));
        data.put("preferredClothingLabel", payload.getOrDefault("preferredClothingLabel", profile.get("preferredClothingLabel")));
        data.put("measurements", profile.get("measurements"));
        data.put("averagePoint", profile.get("averagePoint"));
        data.put("primaryMeasurementKeys", profile.get("primaryMeasurementKeys"));
        data.put("measurementKeys", profile.get("measurementKeys"));
        data.put("measurementDisplayNames", profile.get("measurementDisplayNames"));
    }

    private Map<String, Object> mergeProfileAndMeasurements(
        Map<String, Object> profile,
        Map<String, Object> measurement
    ) {
        var result = jsonMaps.copy(profile);
        var activeKey = text(measurement.get("activeProfileKey"));
        if (activeKey == null) activeKey = text(profile.get("activeMeasurementProfileKey"));
        var storedProfiles = jsonMaps.asMap(measurement.get("profiles"));
        var active = activeKey == null ? Map.<String, Object>of() : jsonMaps.asMap(storedProfiles.get(activeKey));

        result.put("activeMeasurementProfileKey", activeKey);
        result.put("measurementProfiles", storedProfiles);
        result.put("measurements", firstMap(active.get("measurements"), measurement.get("measurements"), profile.get("measurements")));
        result.put("unit", firstValue(active.get("unit"), measurement.get("unit"), profile.get("unit"), "cm"));
        result.put("averagePoint", firstValue(active.get("averagePoint"), measurement.get("averagePoint"), profile.get("averagePoint")));
        result.put("preferredClothing", firstValue(profile.get("preferredClothing"), measurement.get("preferredClothing"), active.get("preferredClothing")));
        result.put("preferredClothingLabel", firstValue(measurement.get("preferredClothingLabel"), profile.get("preferredClothingLabel"), active.get("preferredClothingLabel")));
        result.put("primaryMeasurementKeys", firstList(active.get("primaryMeasurementKeys"), measurement.get("primaryMeasurementKeys")));
        var measurementKeys = firstList(active.get("measurementKeys"), measurement.get("measurementKeys"));
        if (measurementKeys.isEmpty()) measurementKeys = new ArrayList<>(jsonMaps.asMap(result.get("measurements")).keySet());
        result.put("measurementKeys", measurementKeys);
        result.put("measurementDisplayNames", firstMap(active.get("measurementDisplayNames"), measurement.get("measurementDisplayNames")));
        result.put("measurementsUpdatedAt", measurement.get("updatedAt"));
        return result;
    }

    private Map<String, Object> positiveNumbers(Map<String, Object> raw) {
        var result = new LinkedHashMap<String, Object>();
        raw.forEach((key, value) -> {
            try {
                var number = new BigDecimal(String.valueOf(value));
                if (number.signum() > 0) result.put(key, number.stripTrailingZeros());
            } catch (NumberFormatException ignored) {
                // Invalid measurement values are intentionally omitted.
            }
        });
        return result;
    }

    private BigDecimal average(Map<String, Object> measurements) {
        if (measurements.isEmpty()) return null;
        var sum = measurements.values().stream()
            .map(value -> new BigDecimal(String.valueOf(value)))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(measurements.size()), 2, java.math.RoundingMode.HALF_UP);
    }

    private List<String> stringList(Object raw) {
        if (!(raw instanceof List<?> values)) return new ArrayList<>();
        return values.stream()
            .filter(String.class::isInstance)
            .map(String.class::cast)
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .distinct()
            .toList();
    }

    private List<String> firstList(Object... values) {
        for (var value : values) {
            var list = stringList(value);
            if (!list.isEmpty()) return list;
        }
        return new ArrayList<>();
    }

    private Map<String, Object> firstMap(Object... values) {
        for (var value : values) {
            var map = jsonMaps.asMap(value);
            if (!map.isEmpty()) return map;
        }
        return new LinkedHashMap<>();
    }

    private Object firstValue(Object... values) {
        for (var value : values) if (value != null) return value;
        return null;
    }

    private String requiredText(Object value, String message) {
        var text = text(value);
        if (text == null) throw new ApiException(HttpStatus.BAD_REQUEST, "validation_error", message);
        return text;
    }

    private boolean isProtectedIdentityField(String key) {
        return "uid".equals(key) || "role".equals(key) || "status".equals(key);
    }

    private String text(Object value) {
        return value instanceof String text && !text.isBlank() ? text.trim() : null;
    }
}
