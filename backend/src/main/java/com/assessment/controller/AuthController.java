package com.assessment.controller;

import com.assessment.dto.LoginRequest;
import com.assessment.dto.LoginResponse;
import com.assessment.dto.RecruiterLoginRequest;
import com.assessment.model.CandidateSession;
import com.assessment.repository.CandidateSessionRepository;
import com.assessment.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final CandidateSessionRepository sessionRepository;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        String sessionId = UUID.randomUUID().toString();

        CandidateSession session = new CandidateSession();
        session.setSessionId(sessionId);
        session.setCandidateName(request.getName());
        session.setCandidateEmail(request.getEmail());
        session.setStartTime(LocalDateTime.now());
        session.setStatus(CandidateSession.SessionStatus.ACTIVE);
        sessionRepository.save(session);

        String token = jwtUtil.generateToken(sessionId, Map.of(
                "role", "CANDIDATE",
                "name", request.getName(),
                "email", request.getEmail()
        ));

        return ResponseEntity.ok(new LoginResponse(sessionId, token, request.getName()));
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
