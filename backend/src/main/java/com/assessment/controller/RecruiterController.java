package com.assessment.controller;

import com.assessment.dto.SessionReportDto;
import com.assessment.model.Submission;
import com.assessment.repository.CandidateSessionRepository;
import com.assessment.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;

@RestController
@RequestMapping("/api/recruiter")
@RequiredArgsConstructor
public class RecruiterController {

    private final CandidateSessionRepository sessionRepository;
    private final SubmissionRepository submissionRepository;

    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getAllSessions() {
        List<Map<String, Object>> sessions = sessionRepository.findAll().stream()
                .map(session -> {
                    List<Submission> subs = submissionRepository.findBySessionId(session.getSessionId());
                    OptionalDouble avgInstant = subs.stream()
                            .filter(s -> s.getInstantScore() != null)
                            .mapToInt(Submission::getInstantScore).average();
                    OptionalDouble avgDeep = subs.stream()
                            .filter(s -> s.getDeepScore() != null)
                            .mapToInt(Submission::getDeepScore).average();
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("sessionId", session.getSessionId());
                    m.put("candidateName", session.getCandidateName());
                    m.put("candidateEmail", session.getCandidateEmail());
                    m.put("startTime", session.getStartTime() != null ? session.getStartTime().toString() : "");
                    m.put("endTime", session.getEndTime() != null ? session.getEndTime().toString() : "");
                    m.put("status", session.getStatus().name());
                    m.put("submissionCount", subs.size());
                    m.put("avgInstantScore", avgInstant.orElse(0));
                    m.put("avgDeepScore", avgDeep.orElse(0));
                    return m;
                })
                .toList();
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<?> getSessionDetail(@PathVariable String sessionId) {
        return sessionRepository.findBySessionId(sessionId)
                .map(session -> {
                    List<Submission> subs = submissionRepository.findBySessionIdOrderByChallengeIdAsc(sessionId);
                    OptionalDouble avgInstant = subs.stream()
                            .filter(s -> s.getInstantScore() != null)
                            .mapToInt(Submission::getInstantScore).average();
                    OptionalDouble avgDeep = subs.stream()
                            .filter(s -> s.getDeepScore() != null)
                            .mapToInt(Submission::getDeepScore).average();
                    return ResponseEntity.ok(new SessionReportDto(
                            session.getSessionId(), session.getCandidateName(), session.getCandidateEmail(),
                            session.getStartTime(), session.getEndTime(), session.getStatus().name(),
                            subs, avgInstant.orElse(0), avgDeep.orElse(0)
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
