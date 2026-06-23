package com.assessment.dto;

import lombok.Data;

@Data
public class CheatEventRequest {
    private String eventType;
    private String severity;
    private String detail;
}
