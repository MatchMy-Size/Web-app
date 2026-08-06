package com.matchmysize.shared.api;

public record ApiErrorResponse(String status, String message, String code) {
    public static ApiErrorResponse error(String message, String code) {
        return new ApiErrorResponse("error", message, code);
    }
}
