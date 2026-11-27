package com.assessment.controller;

import com.assessment.dto.LoginRequest;
import com.assessment.dto.LoginResponse;
import com.assessment.dto.RecruiterLoginRequest;
import com.assessment.model.CandidateSession;
import com.assessment.security.JwtUtil;
import com.assessment.service.AssessmentInviteService;
import com.assessment.service.AssessmentInviteService.InviteException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AssessmentInviteService inviteService;
    private final JwtUtil jwtUtil;

    /**
     * Candidates can only start via a recruiter-issued, single-use assessment link. The invite
     * supplies the name/email and challenge set; the session timer = sum of those challenges' limits.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        CandidateSession session;
        try {
            session = inviteService.start(request.getInviteToken());
        } catch (InviteException e) {
            return ResponseEntity.status(e.getStatus()).body(Map.of("message", e.getMessage()));
        }

        String token = jwtUtil.generateToken(session.getSessionId(), Map.of(
                "role", "CANDIDATE",
                "name", session.getCandidateName(),
                "email", session.getCandidateEmail()
        ));

        return ResponseEntity.ok(new LoginResponse(session.getSessionId(), token, session.getCandidateName()));
    }

    @PostMapping("/recruiter")
    public ResponseEntity<?> recruiterLogin(@RequestBody RecruiterLoginRequest request) {
        if ("admin".equals(request.getUsername()) && "admin123".equals(request.getPassword())) {
            String token = jwtUtil.generateToken("recruiter", Map.of("role", "RECRUITER"));
            return ResponseEntity.ok(Map.of("token", token, "role", "RECRUITER"));
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }
}
