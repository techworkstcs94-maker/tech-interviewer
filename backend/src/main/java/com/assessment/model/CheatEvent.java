package com.assessment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "cheat_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheatEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String severity;

    @Column(length = 500)
    private String detail;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;
}
