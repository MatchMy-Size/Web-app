package com.matchmysize.identity.application;

import java.util.regex.Pattern;

import com.matchmysize.shared.api.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PhoneCredentialService {
    private static final Pattern E164 = Pattern.compile("^\\+[1-9]\\d{7,14}$");

    private final String passwordDomain;

    public PhoneCredentialService(
        @Value("${PHONE_PASSWORD_DOMAIN:phone.whatmysize.app}") String passwordDomain
    ) {
        this.passwordDomain = passwordDomain;
    }

    public String normalize(String phoneNumber) {
        var normalized = phoneNumber == null ? "" : phoneNumber.trim().replaceAll("\\s+", "");
        if (!E164.matcher(normalized).matches()) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "invalid_phone",
                "Phone number must be in E.164 format, e.g. +9477xxxxxxx."
            );
        }
        return normalized;
    }

    public String syntheticEmail(String phoneNumber) {
        return "phone" + normalize(phoneNumber).substring(1) + "@" + passwordDomain;
    }
}
