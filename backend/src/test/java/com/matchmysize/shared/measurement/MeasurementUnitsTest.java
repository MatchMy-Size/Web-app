package com.matchmysize.shared.measurement;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.Map;

import org.junit.jupiter.api.Test;

class MeasurementUnitsTest {
    @Test
    void convertsInchMeasurementsToCentimetres() {
        var measurements = MeasurementUnits.toCentimetres(
            Map.of("bust", 36, "length", "24"),
            "inches"
        );

        assertThat(measurements)
            .containsEntry("bust", new BigDecimal("91.44"))
            .containsEntry("length", new BigDecimal("60.96"));
    }

    @Test
    void keepsCentimetreMeasurementsUnchanged() {
        var measurements = MeasurementUnits.toCentimetres(Map.of("waist", 78), "cm");

        assertThat(measurements).containsEntry("waist", new BigDecimal("78"));
    }
}
