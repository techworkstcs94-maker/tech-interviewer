package com.assessment.controller;

import com.assessment.dto.AnalysisResult;
import com.assessment.dto.SubmissionRequest;
import com.assessment.dto.SubmissionResponse;
import com.assessment.model.Submission;
import com.assessment.repository.SubmissionRepository;
import com.assessment.service.CodeAnalysisService;
import com.assessment.service.GitHubActionsService;
import com.assessment.service.WebSocketService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@Slf4j
public class SubmissionController {

    // Below this raw structural score, code is considered too structurally broken to be worth a
    // GitHub Actions run — report the AST result immediately instead of spending CI time on it.
    private static final int AST_GATE_THRESHOLD = 70;

    private final SubmissionRepository submissionRepository;
    private final CodeAnalysisService codeAnalysisService;
    private final GitHubActionsService gitHubActionsService;
    private final WebSocketService webSocketService;
    private final ObjectMapper objectMapper;

    @PostMapping
    public ResponseEntity<SubmissionResponse> submit(
            @RequestBody SubmissionRequest request,
            Authentication authentication) {

        String sessionId = authentication.getName();
        log.info("Submission for session={} challenge={}", sessionId, request.getChallengeId());

        Submission submission = new Submission();
        submission.setSessionId(sessionId);
        submission.setChallengeId(request.getChallengeId());
        submission.setCode(request.getCode());
        submission.setElapsedSeconds(request.getElapsedSeconds());
        submission.setStatus(Submission.SubmissionStatus.PENDING);
        submission = submissionRepository.save(submission);

        AnalysisResult result = codeAnalysisService.analyze(request.getChallengeId(), request.getCode());

        int hintsUsed = request.getHintsUsed() != null ? request.getHintsUsed() : 0;
        int hintPenalty = hintsUsed * 5;
        int adjustedScore = Math.max(0, result.getInstantScore() - hintPenalty);
        AnalysisResult adjustedResult = new AnalysisResult(
                result.getTestResults(), adjustedScore, 0, result.getParseError());

        try {
            submission.setInstantScore(adjustedScore);
            submission.setInstantResults(objectMapper.writeValueAsString(result.getTestResults()));
            submission.setStatus(Submission.SubmissionStatus.INSTANT_DONE);
            submissionRepository.save(submission);
        } catch (Exception e) {
            log.error("Failed to serialize instant results", e);
        }

        // Stage 1 (AST) gate: only proceed to the slower, CI-minute-costing Stage 2 (GitHub
        // Actions JUnit verification) once the structure is sound. Otherwise report the AST
        // result now and stop — never call GitHub Actions for structurally broken code.
        if (result.getInstantScore() >= AST_GATE_THRESHOLD) {
            gitHubActionsService.triggerWorkflow(sessionId, request.getChallengeId(), request.getCode(), submission.getId(), adjustedResult);
        } else {
            log.info("Structural score {} below gate threshold {} — skipping GitHub Actions for session={} challenge={}",
                    result.getInstantScore(), AST_GATE_THRESHOLD, sessionId, request.getChallengeId());
            webSocketService.sendInstantResult(sessionId, request.getChallengeId(), adjustedResult);
        }

        return ResponseEntity.ok(new SubmissionResponse(
                submission.getId(),
                adjustedResult.getTestResults(),
                adjustedScore,
                0,
                submission.getStatus().name()
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(
            @RequestParam String sessionId,
            @RequestParam Long challengeId) {

        return submissionRepository.findFirstBySessionIdAndChallengeIdOrderByIdDesc(sessionId, challengeId)
                .map(sub -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("status", sub.getStatus().name());
                    response.put("deepScore", sub.getDeepScore() != null ? sub.getDeepScore() : 0);

                    if (sub.getDeepResults() != null) {
                        try {
                            Map<String, Object> deepResults = objectMapper.readValue(
                                    sub.getDeepResults(), new TypeReference<>() {});
                            response.put("passedCount", deepResults.getOrDefault("passedCount", 0));
                            response.put("totalCount", deepResults.getOrDefault("totalCount", 0));
                            response.put("rawOutput", deepResults.getOrDefault("rawOutput", ""));
                        } catch (Exception e) {
                            response.put("passedCount", 0);
                            response.put("totalCount", 0);
                            response.put("rawOutput", "");
                        }
                    } else {
                        response.put("passedCount", 0);
                        response.put("totalCount", 0);
                        response.put("rawOutput", "");
                    }
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
