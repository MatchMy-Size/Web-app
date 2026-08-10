package com.matchmysize.shared.measurement;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Converts every persisted body or garment measurement to the canonical unit used by MatchMySize: centimetres.
 */
public final class MeasurementUnits {
    public static final String CANONICAL_UNIT = "cm";
    private static final BigDecimal CENTIMETRES_PER_INCH = new BigDecimal("2.54");

    private MeasurementUnits() {
    }

    public static Map<String, Object> toCentimetres(Map<String, Object> rawMeasurements, Object sourceUnit) {
        var normalized = new LinkedHashMap<String, Object>();
        rawMeasurements.forEach((key, value) -> {
            var number = positiveNumber(value);
            if (number == null) return;
            normalized.put(key, toCentimetres(number, sourceUnit).stripTrailingZeros());
        });
        return normalized;
    }

    public static BigDecimal toCentimetres(BigDecimal value, Object sourceUnit) {
        if (!usesInches(sourceUnit)) return value;
        return value.multiply(CENTIMETRES_PER_INCH).setScale(2, RoundingMode.HALF_UP);
    }

    public static boolean usesInches(Object unit) {
        if (!(unit instanceof String value)) return false;
        return switch (value.trim().toLowerCase()) {
            case "in", "inch", "inches", "imperial" -> true;
            default -> false;
        };
    }

    public static void normalizeCatalogRecord(Map<String, Object> record) {
        var sourceUnit = record.get("unit");
        var measurements = toCentimetres(asMap(record.get("measurements")), sourceUnit);
        if (!measurements.isEmpty()) {
            record.put("measurements", measurements);
            record.put("averagePoint", average(measurements));
        }
        record.put("unit", CANONICAL_UNIT);
    }

    public static BigDecimal average(Map<String, Object> measurements) {
        if (measurements.isEmpty()) return null;
        var sum = measurements.values().stream()
            .map(MeasurementUnits::positiveNumber)
            .filter(value -> value != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(measurements.size()), 2, RoundingMode.HALF_UP)
            .stripTrailingZeros();
    }

    private static Map<String, Object> asMap(Object value) {
        if (!(value instanceof Map<?, ?> map)) return Map.of();
        var result = new LinkedHashMap<String, Object>();
        map.forEach((key, item) -> result.put(String.valueOf(key), item));
        return result;
    }

    private static BigDecimal positiveNumber(Object value) {
        try {
            var number = new BigDecimal(String.valueOf(value));
            return number.signum() > 0 ? number : null;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
