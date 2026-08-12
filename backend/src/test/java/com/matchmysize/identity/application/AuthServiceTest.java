package com.matchmysize.identity.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.matchmysize.identity.infrastructure.AppUserRepository;
import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import com.matchmysize.identity.infrastructure.SupabaseAdminClient;
import com.matchmysize.otp.application.OtpService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock private OtpService otpService;
    @Mock private PhoneCredentialService phoneCredentials;
    @Mock private SupabaseAdminClient supabase;
    @Mock private IdentityService identities;
    @Mock private AppUserRepository users;

    @InjectMocks private AuthService authService;

    @Test
    void resetsOnlyTheRegisteredAccountAfterConsumingTheVerifiedOtp() {
        var phoneNumber = "+94771234567";
        var authUserId = UUID.randomUUID();
        var otpSessionId = UUID.randomUUID();
        var account = new AppUser(
            1L,
            authUserId,
            null,
            "phone94771234567@phone.whatmysize.app",
            phoneNumber,
            "customer",
            "active",
            Map.of()
        );

        when(phoneCredentials.normalize(phoneNumber)).thenReturn(phoneNumber);
        when(users.findByPhoneNumber(phoneNumber)).thenReturn(Optional.of(account));

        var result = authService.resetPassword(phoneNumber, "new-password", otpSessionId);

        assertEquals(Map.of("updated", true), result);
        verify(otpService).consumeVerified(otpSessionId, phoneNumber, "passwordReset");
        verify(supabase).updatePassword(authUserId, "new-password", phoneNumber);
    }

    @Test
    void sendsResetOtpOnlyForAnExistingAccount() {
        var phoneNumber = "+94771234567";
        var authUserId = UUID.randomUUID();
        var account = new AppUser(1L, authUserId, null, null, phoneNumber, "customer", "active", Map.of());
        var session = new OtpService.OtpSessionResponse(UUID.randomUUID(), "passwordReset", phoneNumber, 1L);

        when(phoneCredentials.normalize(phoneNumber)).thenReturn(phoneNumber);
        when(users.findByPhoneNumber(phoneNumber)).thenReturn(Optional.of(account));
        when(otpService.request(phoneNumber, "passwordReset")).thenReturn(session);

        assertEquals(session, authService.requestPasswordReset(phoneNumber));
        verify(otpService).request(phoneNumber, "passwordReset");
    }
}
