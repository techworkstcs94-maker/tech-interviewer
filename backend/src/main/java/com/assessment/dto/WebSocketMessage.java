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

    public static WebSocketMessage of(String type, Object payload) {
        return new WebSocketMessage(type, payload, System.currentTimeMillis());
    }
}
