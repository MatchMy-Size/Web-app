package com.matchmysize.otp.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.matchmysize.identity.application.PhoneCredentialService;
import com.matchmysize.identity.infrastructure.AppUserRepository;
import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import com.matchmysize.shared.api.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.simple.JdbcClient;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {
    @Mock private JdbcClient jdbc;
    @Mock private TextLkClient textLk;
    @Mock private PhoneCredentialService phoneCredentials;
    @Mock private AppUserRepository users;

    @Test
    void hashesAreBoundToBothSessionAndCode() {
        var session = UUID.fromString("c0a8012e-7d1b-4a9b-9e0a-7fcfca7a3391");

        var first = OtpService.hash(session, "123456");
        var same = OtpService.hash(session, "123456");
        var otherCode = OtpService.hash(session, "654321");
        var otherSession = OtpService.hash(UUID.randomUUID(), "123456");

        assertThat(first).hasSize(64).isEqualTo(same);
        assertThat(otherCode).isNotEqualTo(first);
        assertThat(otherSession).isNotEqualTo(first);
    }

    @Test
    void rejectsSignupOtpForRegisteredPhoneBeforeSendingSms() {
        var phoneNumber = "+94771234567";
        var account = new AppUser(1L, UUID.randomUUID(), null, null, phoneNumber, "customer", "active", Map.of());
        var service = new OtpService(jdbc, textLk, phoneCredentials, users, 300_000, "Code {code}");

        when(phoneCredentials.normalize(phoneNumber)).thenReturn(phoneNumber);
        when(users.findByPhoneNumber(phoneNumber)).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> service.request(phoneNumber, "signup"))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("already registered");
        verifyNoInteractions(jdbc, textLk);
    }
}
