package com.matchmysize.otp.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

class OtpServiceTest {
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
}
