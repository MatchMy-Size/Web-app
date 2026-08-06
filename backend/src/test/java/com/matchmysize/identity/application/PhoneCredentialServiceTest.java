package com.matchmysize.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.matchmysize.shared.api.ApiException;
import org.junit.jupiter.api.Test;

class PhoneCredentialServiceTest {
    private final PhoneCredentialService service =
        new PhoneCredentialService("phone.whatmysize.app");

    @Test
    void createsTheExistingSyntheticPhoneEmail() {
        assertThat(service.syntheticEmail("+94771234567"))
            .isEqualTo("phone94771234567@phone.whatmysize.app");
    }

    @Test
    void rejectsNonE164PhoneNumbers() {
        assertThatThrownBy(() -> service.normalize("0771234567"))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("E.164");
    }
}
