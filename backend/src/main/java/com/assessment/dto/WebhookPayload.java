package com.assessment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class WebhookPayload {
    @JsonProperty("session_id")
    private String sessionId;

    @JsonProperty("challenge_id")
    private Long challengeId;

    @JsonProperty("deep_score")
    private Integer deepScore;

    @JsonProperty("passed_count")
    private Integer passedCount;

    @JsonProperty("total_count")
    private Integer totalCount;

    @JsonProperty("passed_tests")
    private List<String> passedTests;

    @JsonProperty("failed_tests")
    private List<String> failedTests;

    @JsonProperty("raw_output")
    private String rawOutput;
}
