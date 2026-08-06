package com.matchmysize.shared.config;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Component
public class JsonMaps {
    private static final TypeReference<LinkedHashMap<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final ObjectMapper objectMapper;

    public JsonMaps(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> read(String json) {
        if (json == null || json.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(json, MAP_TYPE);
        } catch (RuntimeException exception) {
            throw new IllegalStateException("Invalid JSON stored in the database.", exception);
        }
    }

    public String write(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("Unable to serialize JSON payload.", exception);
        }
    }

    public Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            var result = new LinkedHashMap<String, Object>();
            map.forEach((key, item) -> result.put(String.valueOf(key), item));
            return result;
        }
        return new LinkedHashMap<>();
    }

    public Map<String, Object> copy(Map<String, Object> value) {
        return objectMapper.convertValue(value == null ? Map.of() : value, MAP_TYPE);
    }
}
