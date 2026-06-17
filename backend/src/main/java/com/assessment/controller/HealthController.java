package com.assessment.controller;

import com.assessment.repository.ChallengeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final ChallengeRepository challengeRepository;

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    @GetMapping("/api/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        long challengeCount = challengeRepository.count();
        return ResponseEntity.ok(Map.of("status", "UP", "challenges", challengeCount));
    }
}
