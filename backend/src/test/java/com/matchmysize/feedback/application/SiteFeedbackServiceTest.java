package com.matchmysize.feedback.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import com.matchmysize.feedback.infrastructure.SiteFeedbackRepository;
import com.matchmysize.feedback.infrastructure.SiteFeedbackRepository.SavedSiteFeedback;
import com.matchmysize.feedback.infrastructure.SiteFeedbackRepository.SiteFeedbackRecord;
import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SiteFeedbackServiceTest {
    @Mock private SiteFeedbackRepository repository;
    @InjectMocks private SiteFeedbackService service;

    @Test
    void storesOnlyAPublicSafeCustomerDisplayName() {
        var now = Instant.parse("2026-08-11T10:00:00Z");
        var id = UUID.randomUUID();
        var customer = new AppUser(
            12L,
            UUID.randomUUID(),
            null,
            "private@example.com",
            "+94771234567",
            "customer",
            "active",
            Map.of("firstName", "Sarindu", "lastName", "Samarasekara")
        );
        when(repository.save(any())).thenReturn(
            new SavedSiteFeedback(id, "Sarindu S.", 5, "The recommendations are very useful.", now, now)
        );

        var result = service.submit(customer, 5, " The recommendations are very useful. ");

        var captor = ArgumentCaptor.forClass(SiteFeedbackRecord.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().displayName()).isEqualTo("Sarindu S.");
        assertThat(captor.getValue().message()).isEqualTo("The recommendations are very useful.");
        assertThat(result.displayName()).isEqualTo("Sarindu S.");
    }
}
