package com.assessment.dto;

import com.assessment.model.CheatEvent;
import com.assessment.model.Submission;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SessionReportDto {
    private String sessionId;
    private String candidateName;
    private String candidateEmail;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private List<Submission> submissions;
    private double averageInstantScore;
    private double averageDeepScore;
    private List<CheatEvent> cheatEvents;
    private int cheatScore;
}
