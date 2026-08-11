package com.matchmysize.shared.api;

import java.util.Map;

import com.matchmysize.shared.measurement.MeasurementPlausibilityValidator;
import com.matchmysize.shared.measurement.MeasurementPlausibilityValidator.MeasurementValidationResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * This endpoint is public so measurement hints can be shown before a customer
 * completes sign-up. It has no persistence or identity side effects.
 */
@RestController
@RequestMapping("/api/measurements/validate")
public class MeasurementValidationController {
    private final MeasurementPlausibilityValidator validator;

    public MeasurementValidationController(MeasurementPlausibilityValidator validator) {
        this.validator = validator;
    }

    @PostMapping
    ApiResponse<MeasurementValidationResult> validate(@RequestBody Map<String, Object> payload) {
        return ApiResponse.success(validator.validate(payload));
    }
}
