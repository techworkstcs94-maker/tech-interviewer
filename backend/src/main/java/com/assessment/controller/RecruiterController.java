package com.assessment.controller;

import com.assessment.dto.SessionReportDto;
import com.assessment.model.CheatEvent;
import com.assessment.model.Submission;
import com.assessment.repository.CandidateSessionRepository;
import com.assessment.repository.CheatEventRepository;
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
    private final CheatEventRepository cheatEventRepository;

    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getAllSessions() {
        List<Map<String, Object>> sessions = sessionRepository.findAll().stream()
                .map(session -> {
                    List<Submission> subs = submissionRepository.findBySessionId(session.getSessionId());
                    List<CheatEvent> events = cheatEventRepository.findBySessionIdOrderByOccurredAtAsc(session.getSessionId());
                    OptionalDouble avgInstant = subs.stream()
                            .filter(s -> s.getInstantScore() != null)
                            .mapToInt(Submission::getInstantScore).average();
                    OptionalDouble avgDeep = subs.stream()
                            .filter(s -> s.getDeepScore() != null)
                            .mapToInt(Submission::getDeepScore).average();
                    int cheatScore = events.stream().mapToInt(e -> severityPoints(e.getSeverity())).sum();
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
                    m.put("cheatScore", cheatScore);
                    m.put("cheatEventCount", events.size());
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
                    List<CheatEvent> events = cheatEventRepository.findBySessionIdOrderByOccurredAtAsc(sessionId);
                    OptionalDouble avgInstant = subs.stream()
                            .filter(s -> s.getInstantScore() != null)
                            .mapToInt(Submission::getInstantScore).average();
                    OptionalDouble avgDeep = subs.stream()
                            .filter(s -> s.getDeepScore() != null)
                            .mapToInt(Submission::getDeepScore).average();
                    int cheatScore = events.stream().mapToInt(e -> severityPoints(e.getSeverity())).sum();
                    return ResponseEntity.ok(new SessionReportDto(
                            session.getSessionId(), session.getCandidateName(), session.getCandidateEmail(),
                            session.getStartTime(), session.getEndTime(), session.getStatus().name(),
                            subs, avgInstant.orElse(0), avgDeep.orElse(0),
                            events, cheatScore
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<?> deleteSession(@PathVariable String sessionId) {
        return sessionRepository.findBySessionId(sessionId)
                .map(session -> {
                    cheatEventRepository.deleteBySessionId(sessionId);
                    submissionRepository.deleteBySessionId(sessionId);
                    sessionRepository.delete(session);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private int severityPoints(String severity) {
        return switch (severity) {
            case "low"      -> 1;
            case "medium"   -> 3;
            case "high"     -> 8;
            case "critical" -> 20;
            default         -> 0;
        };
    }
}
