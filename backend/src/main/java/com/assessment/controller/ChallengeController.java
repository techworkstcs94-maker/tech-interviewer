package com.assessment.controller;

import com.assessment.model.Challenge;
import com.assessment.repository.ChallengeRepository;
import com.assessment.service.AssessmentInviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeRepository challengeRepository;
    private final AssessmentInviteService inviteService;

    /**
     * The calling session's challenges: exactly those on its assessment link, in the recruiter's
     * order. Sessions that predate assessment links fall back to the legacy global active set.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllChallenges(Authentication authentication) {
        String sessionId = authentication != null ? authentication.getName() : null;
        Optional<List<Long>> allowed = inviteService.allowedChallengeIds(sessionId);

        List<Challenge> challenges;
        if (allowed.isPresent()) {
            Map<Long, Challenge> byId = challengeRepository.findAllById(allowed.get()).stream()
                    .collect(Collectors.toMap(Challenge::getId, Function.identity()));
            challenges = allowed.get().stream().map(byId::get).filter(Objects::nonNull).toList();
        } else {
            challenges = challengeRepository.findByActiveTrueOrderByIdAsc();
        }

        return ResponseEntity.ok(challenges.stream().map(c -> {
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
        }).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Challenge> getChallenge(@PathVariable Long id, Authentication authentication) {
        String sessionId = authentication != null ? authentication.getName() : null;
        Optional<List<Long>> allowed = inviteService.allowedChallengeIds(sessionId);
        if (allowed.isPresent() && !allowed.get().contains(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return challengeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
