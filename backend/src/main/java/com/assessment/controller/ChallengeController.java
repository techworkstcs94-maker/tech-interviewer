package com.assessment.controller;

import com.assessment.model.Challenge;
import com.assessment.repository.ChallengeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeRepository challengeRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllChallenges() {
        List<Map<String, Object>> challenges = challengeRepository.findAll().stream()
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", c.getId());
                    m.put("title", c.getTitle());
                    m.put("description", c.getDescription());
                    m.put("difficulty", c.getDifficulty());
                    m.put("category", c.getCategory());
                    m.put("timeLimitSeconds", c.getTimeLimitSeconds());
                    m.put("starterCode", c.getStarterCode() != null ? c.getStarterCode() : "");
                    m.put("testCasesJson", c.getTestCasesJson() != null ? c.getTestCasesJson() : "[]");
                    m.put("hintsJson", c.getHintsJson() != null ? c.getHintsJson() : "[]");
                    m.put("conceptsJson", c.getConceptsJson() != null ? c.getConceptsJson() : "[]");
                    return m;
                })
                .toList();
        return ResponseEntity.ok(challenges);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Challenge> getChallenge(@PathVariable Long id) {
        return challengeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
