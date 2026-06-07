package com.assessment.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubmissionResponse {
    private Long submissionId;
    private List<AnalysisResult.TestResult> instantResults;
    private int instantScore;
    private int qualityScore;
    private String status;
}
