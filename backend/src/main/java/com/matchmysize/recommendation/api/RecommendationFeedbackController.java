package com.matchmysize.recommendation.api;

import java.math.BigDecimal;

import com.matchmysize.identity.application.IdentityService;
import com.matchmysize.recommendation.application.RecommendationFeedbackService;
import com.matchmysize.recommendation.application.RecommendationFeedbackService.SubmitFeedbackCommand;
import com.matchmysize.shared.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationFeedbackController {
    record SubmitFeedbackRequest(
        @NotBlank @Size(max = 256) String catalogId,
        @NotBlank @Size(max = 128) String measurementProfileKey,
        @NotBlank String experience,
        @NotBlank String outcome,
        @NotNull @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal recommendationScore,
        @NotBlank @Size(max = 16) String confidence,
        @Size(max = 1000) String note
    ) {}

    private final IdentityService identities;
    private final RecommendationFeedbackService feedback;

    public RecommendationFeedbackController(
        IdentityService identities,
        RecommendationFeedbackService feedback
    ) {
        this.identities = identities;
        this.feedback = feedback;
    }

    @PostMapping("/feedback")
    ApiResponse<RecommendationFeedbackService.FeedbackResponse> submit(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody SubmitFeedbackRequest request
    ) {
        return ApiResponse.success(feedback.submit(
            identities.currentUser(jwt),
            new SubmitFeedbackCommand(
                request.catalogId(),
                request.measurementProfileKey(),
                request.experience(),
                request.outcome(),
                request.recommendationScore(),
                request.confidence(),
                request.note()
            )
        ));
    }
}
