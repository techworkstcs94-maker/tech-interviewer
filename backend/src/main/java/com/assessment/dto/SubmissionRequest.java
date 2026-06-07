package com.assessment.dto;

import lombok.Data;

@Data
public class SubmissionRequest {
    private Long challengeId;
    private String code;
    private Integer elapsedSeconds;
}
