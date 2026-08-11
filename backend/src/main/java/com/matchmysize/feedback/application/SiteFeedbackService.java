package com.matchmysize.feedback.application;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.matchmysize.feedback.infrastructure.SiteFeedbackRepository;
import com.matchmysize.feedback.infrastructure.SiteFeedbackRepository.SiteFeedbackRecord;
import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import com.matchmysize.shared.api.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SiteFeedbackService {
    public record PublicFeedback(
        UUID id,
        String displayName,
        int rating,
        String message,
        Instant updatedAt
    ) {}

    private final SiteFeedbackRepository feedback;

    public SiteFeedbackService(SiteFeedbackRepository feedback) {
        this.feedback = feedback;
    }

    @Transactional
    public PublicFeedback submit(AppUser appUser, int rating, String message) {
        requireActiveCustomer(appUser);
        if (rating < 1 || rating > 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_rating", "Rating must be between 1 and 5.");
        }
        var normalizedMessage = message == null ? "" : message.trim();
        if (normalizedMessage.length() < 10 || normalizedMessage.length() > 500) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "invalid_feedback_message",
                "Feedback must contain between 10 and 500 characters."
            );
        }

        var saved = feedback.save(new SiteFeedbackRecord(
            UUID.randomUUID(),
            appUser.id(),
            publicDisplayName(appUser.profileData()),
            rating,
            normalizedMessage
        ));

        return publicView(saved);
    }

    @Transactional(readOnly = true)
    public List<PublicFeedback> publicFeedback() {
        return feedback.findPublished().stream()
            .map(this::publicView)
            .toList();
    }

    private PublicFeedback publicView(SiteFeedbackRepository.SavedSiteFeedback feedback) {
        return new PublicFeedback(
            feedback.id(),
            feedback.displayName(),
            feedback.rating(),
            feedback.message(),
            feedback.updatedAt()
        );
    }

    private String publicDisplayName(Map<String, Object> profile) {
        var firstName = text(profile.get("firstName"));
        var lastName = text(profile.get("lastName"));
        var displayName = firstName == null
            ? "MatchMySize customer"
            : lastName == null
                ? firstName
                : firstName + " " + lastName.substring(0, 1).toUpperCase() + ".";
        return displayName.length() <= 120 ? displayName : displayName.substring(0, 120).trim();
    }

    private void requireActiveCustomer(AppUser appUser) {
        if (!"active".equalsIgnoreCase(appUser.status())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "account_inactive", "Your account is not active.");
        }
        if (!"customer".equalsIgnoreCase(appUser.role())) {
            throw new ApiException(
                HttpStatus.FORBIDDEN,
                "customer_access_required",
                "Only customer accounts can leave public feedback."
            );
        }
    }

    private String text(Object value) {
        return value instanceof String text && !text.isBlank() ? text.trim() : null;
    }
}
