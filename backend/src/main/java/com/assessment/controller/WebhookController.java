package com.assessment.controller;

import com.assessment.dto.WebhookPayload;
import com.assessment.model.Submission;
import com.assessment.repository.SubmissionRepository;
import com.assessment.service.WebSocketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/webhook")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final SubmissionRepository submissionRepository;
    private final WebSocketService webSocketService;
    private final ObjectMapper objectMapper;

    @Value("${webhook.secret}")
    private String webhookSecret;

    @PostMapping("/github")
    public ResponseEntity<?> handleGitHubWebhook(
            @RequestHeader("X-Webhook-Secret") String secret,
            @RequestBody WebhookPayload payload) {

        if (!webhookSecret.equals(secret)) {
            log.warn("Invalid webhook secret received");
            return ResponseEntity.status(403).body(Map.of("error", "Invalid webhook secret"));
        }

        log.info("GitHub webhook received: session={} challenge={} score={}",
                payload.getSessionId(), payload.getChallengeId(), payload.getDeepScore());

        Optional<Submission> submissionOpt = submissionRepository
                .findBySessionIdAndChallengeId(payload.getSessionId(), payload.getChallengeId());

        if (submissionOpt.isEmpty()) {
            log.warn("No submission for session={} challenge={}", payload.getSessionId(), payload.getChallengeId());
            return ResponseEntity.ok(Map.of("status", "no submission found"));
        }

        Submission submission = submissionOpt.get();
        submission.setDeepScore(payload.getDeepScore());
        submission.setStatus(Submission.SubmissionStatus.DEEP_DONE);

        try {
            submission.setDeepResults(objectMapper.writeValueAsString(Map.of(
                    "passedCount", payload.getPassedCount() != null ? payload.getPassedCount() : 0,
                    "totalCount", payload.getTotalCount() != null ? payload.getTotalCount() : 0,
                    "deepScore", payload.getDeepScore() != null ? payload.getDeepScore() : 0,
                    "rawOutput", payload.getRawOutput() != null ? payload.getRawOutput() : ""
            )));
        } catch (Exception e) {
            log.error("Failed to serialize deep results", e);
        }

        submissionRepository.save(submission);
        webSocketService.sendDeepResult(payload.getSessionId(), payload);

        return ResponseEntity.ok(Map.of("status", "processed"));
    }
}
