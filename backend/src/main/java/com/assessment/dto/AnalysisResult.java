package com.assessment.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AnalysisResult {
    private List<TestResult> testResults;
    private int instantScore;
    private int qualityScore;
    private String parseError;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TestResult {
        private String id;
        private String label;
        private boolean passed;
        private String feedback;
    }
}
