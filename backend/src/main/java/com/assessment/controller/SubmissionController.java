package com.assessment.controller;

import com.assessment.dto.AnalysisResult;
import com.assessment.dto.SubmissionRequest;
import com.assessment.dto.SubmissionResponse;
import com.assessment.model.Submission;
import com.assessment.repository.SubmissionRepository;
import com.assessment.service.CodeAnalysisService;
import com.assessment.service.GitHubActionsService;
import com.assessment.service.WebSocketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@Slf4j
public class SubmissionController {

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

        try {
            submission.setInstantScore(result.getInstantScore());
            submission.setInstantResults(objectMapper.writeValueAsString(result.getTestResults()));
            submission.setStatus(Submission.SubmissionStatus.INSTANT_DONE);
            submissionRepository.save(submission);
        } catch (Exception e) {
            log.error("Failed to serialize instant results", e);
        }

        webSocketService.sendInstantResult(sessionId, result);
        gitHubActionsService.triggerWorkflow(sessionId, request.getChallengeId(), request.getCode());

        return ResponseEntity.ok(new SubmissionResponse(
                submission.getId(),
                result.getTestResults(),
                result.getInstantScore(),
                result.getQualityScore(),
                submission.getStatus().name()
        ));
    }
}
