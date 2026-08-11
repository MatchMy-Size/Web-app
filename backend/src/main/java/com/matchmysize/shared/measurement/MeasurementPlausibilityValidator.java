package com.matchmysize.shared.measurement;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

/**
 * Provides non-blocking plausibility hints for customer-entered measurements.
 *
 * <p>These hints deliberately do not modify the submitted values. The client must
 * ask the customer to either keep the value, accept the suggested conversion, or
 * edit it before the profile is saved.</p>
 */
@Component
public class MeasurementPlausibilityValidator {
    private static final BigDecimal LIKELY_INCH_NECK_MINIMUM = new BigDecimal("12");
    private static final BigDecimal LIKELY_INCH_NECK_MAXIMUM = new BigDecimal("24");

    public MeasurementValidationResult validate(Map<String, Object> payload) {
        var measurements = asMap(payload.get("measurements"));
        var unit = payload.get("unit");
        var warnings = new ArrayList<MeasurementWarning>();

        addPossibleInchNeckWarning(measurements.get("neck"), unit, warnings);

        return new MeasurementValidationResult(true, List.copyOf(warnings));
    }

    private void addPossibleInchNeckWarning(
        Object rawValue,
        Object unit,
        List<MeasurementWarning> warnings
    ) {
        if (MeasurementUnits.usesInches(unit)) return;

        var enteredValue = positiveNumber(rawValue);
        if (enteredValue == null
            || enteredValue.compareTo(LIKELY_INCH_NECK_MINIMUM) < 0
            || enteredValue.compareTo(LIKELY_INCH_NECK_MAXIMUM) > 0) {
            return;
        }

        var suggestedValue = MeasurementUnits.toCentimetres(enteredValue, "in")
            .setScale(2, RoundingMode.HALF_UP)
            .stripTrailingZeros();
        var entered = format(enteredValue);
        var suggested = format(suggestedValue);
        warnings.add(new MeasurementWarning(
            "POSSIBLE_UNIT_MISMATCH",
            "neck",
            entered + " cm neck is unusual for an adult. Did you mean "
                + entered + " inches (" + suggested + " cm)?",
            enteredValue.stripTrailingZeros(),
            MeasurementUnits.CANONICAL_UNIT,
            suggestedValue,
            "cm",
            "inches"
        ));
    }

    private Map<String, Object> asMap(Object raw) {
        if (!(raw instanceof Map<?, ?> values)) return Map.of();
        var result = new java.util.LinkedHashMap<String, Object>();
        values.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    private BigDecimal positiveNumber(Object raw) {
        try {
            var number = new BigDecimal(String.valueOf(raw));
            return number.signum() > 0 ? number : null;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String format(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }

    public record MeasurementValidationResult(boolean valid, List<MeasurementWarning> warnings) {
    }

    public record MeasurementWarning(
        String code,
        String field,
        String message,
        BigDecimal enteredValue,
        String enteredUnit,
        BigDecimal suggestedValue,
        String suggestedUnit,
        String suggestedInputUnit
    ) {
    }
}
