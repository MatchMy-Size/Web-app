package com.matchmysize.shared.measurement;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.Map;

import org.junit.jupiter.api.Test;

class MeasurementPlausibilityValidatorTest {
    private final MeasurementPlausibilityValidator validator = new MeasurementPlausibilityValidator();

    @Test
    void warnsWhenAnAdultNeckValueLooksLikeInchesEnteredAsCentimetres() {
        var result = validator.validate(Map.of(
            "unit", "cm",
            "measurements", Map.of("neck", "16.5")
        ));

        assertThat(result.valid()).isTrue();
        assertThat(result.warnings()).singleElement().satisfies(warning -> {
            assertThat(warning.code()).isEqualTo("POSSIBLE_UNIT_MISMATCH");
            assertThat(warning.field()).isEqualTo("neck");
            assertThat(warning.enteredValue()).isEqualByComparingTo("16.5");
            assertThat(warning.suggestedValue()).isEqualByComparingTo(new BigDecimal("41.91"));
            assertThat(warning.message()).contains("Did you mean 16.5 inches");
        });
    }

    @Test
    void doesNotWarnWhenTheSameNeckValueIsExplicitlyEnteredInInches() {
        var result = validator.validate(Map.of(
            "unit", "in",
            "measurements", Map.of("neck", "16.5")
        ));

        assertThat(result.warnings()).isEmpty();
    }

    @Test
    void doesNotWarnForARegularCentimetreNeckMeasurement() {
        var result = validator.validate(Map.of(
            "unit", "cm",
            "measurements", Map.of("neck", "41.5")
        ));

        assertThat(result.warnings()).isEmpty();
    }
}
