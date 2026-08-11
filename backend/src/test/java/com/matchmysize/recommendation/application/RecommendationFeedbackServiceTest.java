package com.matchmysize.recommendation.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import com.matchmysize.recommendation.infrastructure.FitFeedbackRepository;
import com.matchmysize.recommendation.infrastructure.FitFeedbackRepository.CatalogRecommendation;
import com.matchmysize.recommendation.infrastructure.FitFeedbackRepository.FitFeedbackRecord;
import com.matchmysize.recommendation.infrastructure.FitFeedbackRepository.SavedFeedback;
import com.matchmysize.shared.api.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RecommendationFeedbackServiceTest {
    @Mock private FitFeedbackRepository repository;
    @InjectMocks private RecommendationFeedbackService service;

    @Test
    void storesCustomerFeedbackAgainstTheAuthoritativeCatalogRecommendation() {
        var appUser = customer();
        var now = Instant.parse("2026-08-11T08:00:00Z");
        var savedId = UUID.randomUUID();
        when(repository.findActiveCatalog("catalog-xl")).thenReturn(Optional.of(
            new CatalogRecommendation("catalog-xl", "EKKO", "Regular shirt", "Shirt", "XL")
        ));
        when(repository.save(org.mockito.ArgumentMatchers.any())).thenReturn(
            new SavedFeedback(savedId, now, now)
        );

        var result = service.submit(appUser, new RecommendationFeedbackService.SubmitFeedbackCommand(
            "catalog-xl",
            "shirt-profile",
            "bought",
            "perfect",
            new BigDecimal("82.4"),
            "high",
            " The shoulders fit well. "
        ));

        var captor = ArgumentCaptor.forClass(FitFeedbackRecord.class);
        verify(repository).save(captor.capture());
        var stored = captor.getValue();

        assertThat(result.id()).isEqualTo(savedId);
        assertThat(result.experience()).isEqualTo("BOUGHT");
        assertThat(result.outcome()).isEqualTo("PERFECT");
        assertThat(stored.appUserId()).isEqualTo(appUser.id());
        assertThat(stored.recommendedSize()).isEqualTo("XL");
        assertThat(stored.brandName()).isEqualTo("EKKO");
        assertThat(stored.note()).isEqualTo("The shoulders fit well.");
    }

    @Test
    void rejectsAnUnknownOutcome() {
        assertThatThrownBy(() -> service.submit(customer(), new RecommendationFeedbackService.SubmitFeedbackCommand(
            "catalog-xl", "shirt-profile", "tried", "almost", new BigDecimal("80"), "high", null
        )))
            .isInstanceOf(ApiException.class)
            .hasMessage("Invalid outcome value.");
    }

    private AppUser customer() {
        return new AppUser(
            41L,
            UUID.randomUUID(),
            null,
            null,
            "+94771234567",
            "customer",
            "active",
            Map.of()
        );
    }
}
