package com.assessment.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WebSocketMessage {
    private String type;
    private Object payload;
    private long timestamp;
    private Long challengeId;

    public static WebSocketMessage of(String type, Object payload) {
        return new WebSocketMessage(type, payload, System.currentTimeMillis(), null);
    }

    public static WebSocketMessage of(String type, Object payload, Long challengeId) {
        return new WebSocketMessage(type, payload, System.currentTimeMillis(), challengeId);
    }
}
