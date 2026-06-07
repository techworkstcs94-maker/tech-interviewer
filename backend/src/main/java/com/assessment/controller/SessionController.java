package com.assessment.controller;

import com.assessment.dto.SessionReportDto;
import com.assessment.model.CandidateSession;
import com.assessment.model.Submission;
import com.assessment.repository.CandidateSessionRepository;
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

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionReportDto> getSession(@PathVariable String sessionId) {
        return sessionRepository.findBySessionId(sessionId)
                .map(session -> {
                    List<Submission> subs = submissionRepository.findBySessionIdOrderByChallengeIdAsc(sessionId);
                    return ResponseEntity.ok(buildReport(session, subs));
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
                    return ResponseEntity.ok(buildReport(session, subs));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private SessionReportDto buildReport(CandidateSession session, List<Submission> submissions) {
        OptionalDouble avgInstant = submissions.stream()
                .filter(s -> s.getInstantScore() != null)
                .mapToInt(Submission::getInstantScore)
                .average();
        OptionalDouble avgDeep = submissions.stream()
                .filter(s -> s.getDeepScore() != null)
                .mapToInt(Submission::getDeepScore)
                .average();
        return new SessionReportDto(
                session.getSessionId(), session.getCandidateName(), session.getCandidateEmail(),
                session.getStartTime(), session.getEndTime(), session.getStatus().name(),
                submissions, avgInstant.orElse(0), avgDeep.orElse(0)
        );
    }
}
