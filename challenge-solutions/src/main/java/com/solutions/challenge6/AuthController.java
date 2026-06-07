package com.solutions.challenge6;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Profile("challenge-6")
@RestController
@RequestMapping("/auth")
class AuthController {

    private final JwtService jwtService;

    AuthController(JwtService jwtService) { this.jwtService = jwtService; }

    @PostMapping("/login")
    ResponseEntity<?> login(@RequestBody Map<String, String> creds) {
        if ("user".equals(creds.get("username")) && "password".equals(creds.get("password"))) {
            return ResponseEntity.ok(Map.of("token", jwtService.generate(creds.get("username"))));
        }
        return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED).build();
    }
}
