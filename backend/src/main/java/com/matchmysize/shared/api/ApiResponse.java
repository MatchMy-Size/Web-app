package com.matchmysize.shared.api;

public record ApiResponse<T>(String status, T data) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("success", data);
    }
}
