package com.assessment.controller;

import com.assessment.model.AssessmentInvite;
import com.assessment.service.AssessmentInviteService;
import com.assessment.service.AssessmentInviteService.InviteException;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Recruiter management of single-use assessment links (secured by the /api/recruiter/** rule). */
@RestController
@RequestMapping("/api/recruiter/invites")
@RequiredArgsConstructor
public class RecruiterInviteController {

    private final AssessmentInviteService inviteService;

    @Data
    public static class CreateInviteRequest {
        private String title;
        private String candidateName;
        private String candidateEmail;
        private List<Long> challengeIds;
        private Integer expiresInDays;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list() {
        return ResponseEntity.ok(inviteService.listForRecruiter());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateInviteRequest req) {
        try {
            AssessmentInvite inv = inviteService.create(req.getTitle(), req.getCandidateName(),
                    req.getCandidateEmail(), req.getChallengeIds(), req.getExpiresInDays());
            return ResponseEntity.ok(Map.of("id", inv.getId(), "token", inv.getToken()));
        } catch (InviteException e) {
            return ResponseEntity.status(e.getStatus()).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<?> revoke(@PathVariable Long id) {
        try {
            inviteService.revoke(id);
            return ResponseEntity.ok(Map.of("id", id, "status", "REVOKED"));
        } catch (InviteException e) {
            return ResponseEntity.status(e.getStatus()).body(Map.of("message", e.getMessage()));
        }
    }
}
