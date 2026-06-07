package com.assessment.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.Map;

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

    public GitHubActionsService(WebSocketService webSocketService) {
        this.webSocketService = webSocketService;
        this.webClient = WebClient.builder()
                .baseUrl("https://api.github.com")
                .build();
    }

    @Async
    public void triggerWorkflow(String sessionId, Long challengeId, String code) {
        if ("placeholder".equals(owner) || "placeholder".equals(repo) || "placeholder".equals(token)) {
            log.warn("GitHub not configured — skipping deep evaluation for session {}", sessionId);
            webSocketService.sendError(sessionId,
                    "GitHub Actions not configured. Deep evaluation skipped. Set GITHUB_OWNER, GITHUB_REPO, and GITHUB_TOKEN env vars.");
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
        } catch (Exception e) {
            log.error("Failed to trigger GitHub Actions for session {}: {}", sessionId, e.getMessage());
            webSocketService.sendError(sessionId, "Failed to start deep evaluation: " + e.getMessage());
        }
    }
}
