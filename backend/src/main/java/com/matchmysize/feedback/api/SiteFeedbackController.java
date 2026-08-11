package com.matchmysize.feedback.api;

import java.util.List;

import com.matchmysize.feedback.application.SiteFeedbackService;
import com.matchmysize.feedback.application.SiteFeedbackService.PublicFeedback;
import com.matchmysize.identity.application.IdentityService;
import com.matchmysize.shared.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
public class SiteFeedbackController {
    record SubmitSiteFeedbackRequest(
        @Min(1) @Max(5) int rating,
        @NotBlank @Size(min = 10, max = 500) String message
    ) {}

    private final IdentityService identities;
    private final SiteFeedbackService feedback;

    public SiteFeedbackController(IdentityService identities, SiteFeedbackService feedback) {
        this.identities = identities;
        this.feedback = feedback;
    }

    @PostMapping
    ApiResponse<PublicFeedback> submit(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody SubmitSiteFeedbackRequest request
    ) {
        return ApiResponse.success(feedback.submit(
            identities.currentUser(jwt),
            request.rating(),
            request.message()
        ));
    }

    @GetMapping("/public")
    ApiResponse<List<PublicFeedback>> publicFeedback() {
        return ApiResponse.success(feedback.publicFeedback());
    }
}
