package com.matchmysize.recommendation.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import com.matchmysize.recommendation.domain.FitExperience;
import com.matchmysize.recommendation.domain.FitOutcome;
import com.matchmysize.recommendation.domain.RecommendationConfidence;
import com.matchmysize.recommendation.infrastructure.FitFeedbackRepository;
import com.matchmysize.recommendation.infrastructure.FitFeedbackRepository.FitFeedbackRecord;
import com.matchmysize.shared.api.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationFeedbackService {
    public record SubmitFeedbackCommand(
        String catalogId,
        String measurementProfileKey,
        String experience,
        String outcome,
        BigDecimal recommendationScore,
        String confidence,
        String note
    ) {}

    public record FeedbackResponse(
        UUID id,
        String experience,
        String outcome,
        Instant createdAt,
        Instant updatedAt
    ) {}

    private static final String ALGORITHM_VERSION = "frontend-v1";

    private final FitFeedbackRepository feedback;

    public RecommendationFeedbackService(FitFeedbackRepository feedback) {
        this.feedback = feedback;
    }

    @Transactional
    public FeedbackResponse submit(AppUser appUser, SubmitFeedbackCommand command) {
        requireActiveCustomer(appUser);

        var experience = parseEnum(FitExperience.class, command.experience(), "experience");
        var outcome = parseEnum(FitOutcome.class, command.outcome(), "outcome");
        var confidence = parseEnum(RecommendationConfidence.class, command.confidence(), "confidence");
        var catalog = feedback.findActiveCatalog(command.catalogId().trim())
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "recommendation_not_found",
                "This recommendation is no longer available."
            ));

        var record = new FitFeedbackRecord(
            UUID.randomUUID(),
            appUser.id(),
            catalog.catalogId(),
            command.measurementProfileKey().trim(),
            experience.name(),
            outcome.name(),
            catalog.recommendedSize(),
            command.recommendationScore(),
            confidence.name(),
            ALGORITHM_VERSION,
            catalog.brandName(),
            catalog.productTitle(),
            catalog.category(),
            optionalText(command.note())
        );

        var saved = feedback.save(record);
        return new FeedbackResponse(
            saved.id(),
            experience.name(),
            outcome.name(),
            saved.createdAt(),
            saved.updatedAt()
        );
    }

    private void requireActiveCustomer(AppUser appUser) {
        if (!"active".equalsIgnoreCase(appUser.status())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "account_inactive", "Your account is not active.");
        }
        if (!"customer".equalsIgnoreCase(appUser.role())) {
            throw new ApiException(
                HttpStatus.FORBIDDEN,
                "customer_access_required",
                "Only customer accounts can leave fit feedback."
            );
        }
    }

    private <E extends Enum<E>> E parseEnum(Class<E> enumType, String value, String field) {
        try {
            return Enum.valueOf(enumType, value.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "invalid_" + field,
                "Invalid " + field + " value."
            );
        }
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
