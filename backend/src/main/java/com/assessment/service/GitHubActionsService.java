package com.assessment.service;

import com.assessment.dto.AnalysisResult;
import com.assessment.model.Submission;
import com.assessment.repository.SubmissionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class GitHubActionsService {

    @Value("${github.owner}")
    private String owner;

    @Value("${github.repo}")
    private String repo;

    @Value("${github.token}")
    private String token;

    private final WebClient webClient;
    private final WebSocketService webSocketService;
    private final SubmissionRepository submissionRepository;
    private final ScheduledExecutorService fallbackScheduler = Executors.newScheduledThreadPool(4);

    public GitHubActionsService(WebSocketService webSocketService, SubmissionRepository submissionRepository) {
        this.webSocketService = webSocketService;
        this.submissionRepository = submissionRepository;
        this.webClient = WebClient.builder()
                .baseUrl("https://api.github.com")
                .build();
    }

    @Async
    public void triggerWorkflow(String sessionId, Long challengeId, String code,
                                Long submissionId, AnalysisResult astFallback) {
        if ("placeholder".equals(owner) || "placeholder".equals(repo) || "placeholder".equals(token)) {
            log.warn("GitHub not configured — sending AST result as fallback for session {}", sessionId);
            webSocketService.sendInstantResult(sessionId, astFallback);
            return;
        }

        try {
            String base64Code = Base64.getEncoder().encodeToString(code.getBytes());
            Map<String, Object> body = Map.of(
                "ref", "main",
                "inputs", Map.of(
                    "session_id", sessionId,
                    "challenge_id", String.valueOf(challengeId),
                    "candidate_code", base64Code
                )
            );

            webClient.post()
                    .uri("/repos/{owner}/{repo}/actions/workflows/evaluate.yml/dispatches", owner, repo)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github.v3+json")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            webSocketService.sendDeepStarted(sessionId);
            log.info("GitHub Actions triggered for session={}, challenge={}", sessionId, challengeId);

            // If deep result never arrives within 8 minutes, fall back to AST
            fallbackScheduler.schedule(() -> {
                try {
                    Submission sub = submissionRepository.findById(submissionId).orElse(null);
                    if (sub != null && sub.getDeepScore() == null) {
                        log.warn("Deep eval timed out for submission {} — sending AST fallback", submissionId);
                        webSocketService.sendInstantResult(sessionId, astFallback);
                    }
                } catch (Exception e) {
                    log.error("Error in fallback scheduler for submission {}: {}", submissionId, e.getMessage());
                }
            }, 5, TimeUnit.MINUTES);

        } catch (Exception e) {
            log.error("Failed to trigger GitHub Actions for session {}: {}", sessionId, e.getMessage());
            webSocketService.sendInstantResult(sessionId, astFallback);
        }
    }
}
