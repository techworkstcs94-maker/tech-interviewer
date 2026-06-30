package com.assessment.service;

import com.assessment.dto.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendToSession(String sessionId, String type, Object payload, Long challengeId) {
        WebSocketMessage msg = WebSocketMessage.of(type, payload, challengeId);
        String destination = "/topic/session/" + sessionId;
        log.debug("Sending {} (challenge={}) to {}", type, challengeId, destination);
        try {
            messagingTemplate.convertAndSend(destination, msg);
        } catch (Exception e) {
            log.warn("Failed to send WebSocket message to {}: {}", destination, e.getMessage());
        }
    }

    public void sendInstantResult(String sessionId, Long challengeId, Object result) {
        sendToSession(sessionId, "INSTANT_RESULT", result, challengeId);
    }

    public void sendDeepStarted(String sessionId, Long challengeId) {
        sendToSession(sessionId, "DEEP_STARTED", "Deep verification running...", challengeId);
    }

    public void sendDeepResult(String sessionId, Long challengeId, Object result) {
        sendToSession(sessionId, "DEEP_RESULT", result, challengeId);
    }

    public void sendError(String sessionId, Long challengeId, String message) {
        sendToSession(sessionId, "ERROR", message, challengeId);
    }
}
