package com.assessment.controller;

import com.assessment.service.AssessmentInviteService;
import com.assessment.service.AssessmentInviteService.InviteException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Public, unauthenticated summary of an assessment link — powers the /a/{token} landing page. */
@RestController
@RequestMapping("/api/invites")
@RequiredArgsConstructor
public class InviteController {

    private final AssessmentInviteService inviteService;

    @GetMapping("/{token}")
    public ResponseEntity<?> describe(@PathVariable String token) {
        try {
            return ResponseEntity.ok(inviteService.describe(token));
        } catch (InviteException e) {
            return ResponseEntity.status(e.getStatus()).body(Map.of("message", e.getMessage()));
        }
    }
}
