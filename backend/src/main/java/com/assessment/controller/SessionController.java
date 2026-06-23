package com.assessment.controller;

import com.assessment.dto.CheatEventRequest;
import com.assessment.dto.SessionReportDto;
import com.assessment.model.CandidateSession;
import com.assessment.model.CheatEvent;
import com.assessment.model.Submission;
import com.assessment.repository.CandidateSessionRepository;
import com.assessment.repository.CheatEventRepository;
import com.assessment.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.OptionalDouble;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final CandidateSessionRepository sessionRepository;
    private final SubmissionRepository submissionRepository;
    private final CheatEventRepository cheatEventRepository;

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionReportDto> getSession(@PathVariable String sessionId) {
        return sessionRepository.findBySessionId(sessionId)
                .map(session -> {
                    List<Submission> subs = submissionRepository.findBySessionIdOrderByChallengeIdAsc(sessionId);
                    List<CheatEvent> events = cheatEventRepository.findBySessionIdOrderByOccurredAtAsc(sessionId);
                    return ResponseEntity.ok(buildReport(session, subs, events));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<SessionReportDto> completeSession(@PathVariable String sessionId) {
        return sessionRepository.findBySessionId(sessionId)
                .map(session -> {
                    session.setEndTime(LocalDateTime.now());
                    session.setStatus(CandidateSession.SessionStatus.COMPLETED);
                    sessionRepository.save(session);
                    List<Submission> subs = submissionRepository.findBySessionIdOrderByChallengeIdAsc(sessionId);
                    List<CheatEvent> events = cheatEventRepository.findBySessionIdOrderByOccurredAtAsc(sessionId);
                    return ResponseEntity.ok(buildReport(session, subs, events));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{sessionId}/cheat-events")
    public ResponseEntity<?> reportCheatEvent(
            @PathVariable String sessionId,
            @RequestBody CheatEventRequest request) {
        if (!sessionRepository.existsBySessionId(sessionId)) {
            return ResponseEntity.notFound().build();
        }
        CheatEvent event = new CheatEvent();
        event.setSessionId(sessionId);
        event.setEventType(request.getEventType());
        event.setSeverity(request.getSeverity());
        event.setDetail(request.getDetail());
        event.setOccurredAt(LocalDateTime.now());
        cheatEventRepository.save(event);
        return ResponseEntity.ok().build();
    }

    private SessionReportDto buildReport(CandidateSession session, List<Submission> submissions, List<CheatEvent> cheatEvents) {
        OptionalDouble avgInstant = submissions.stream()
                .filter(s -> s.getInstantScore() != null)
                .mapToInt(Submission::getInstantScore)
                .average();
        OptionalDouble avgDeep = submissions.stream()
                .filter(s -> s.getDeepScore() != null)
                .mapToInt(Submission::getDeepScore)
                .average();
        int cheatScore = cheatEvents.stream().mapToInt(e -> severityPoints(e.getSeverity())).sum();
        return new SessionReportDto(
                session.getSessionId(), session.getCandidateName(), session.getCandidateEmail(),
                session.getStartTime(), session.getEndTime(), session.getStatus().name(),
                submissions, avgInstant.orElse(0), avgDeep.orElse(0),
                cheatEvents, cheatScore
        );
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
