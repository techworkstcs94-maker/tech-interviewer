package com.assessment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidate_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", unique = true, nullable = false)
    private String sessionId;

    @Column(name = "candidate_name", nullable = false)
    private String candidateName;

    @Column(name = "candidate_email", nullable = false)
    private String candidateEmail;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SessionStatus status = SessionStatus.ACTIVE;

    /** Total assessment time budget, fixed at login. Null = no limit (pre-V9 sessions). */
    @Column(name = "time_limit_seconds")
    private Integer timeLimitSeconds;

    /** startTime + timeLimitSeconds, or null when the session has no time limit. */
    public LocalDateTime deadline() {
        if (startTime == null || timeLimitSeconds == null) return null;
        return startTime.plusSeconds(timeLimitSeconds);
    }

    /** Seconds left until the deadline (never negative), or null when the session has no time limit. */
    public Long remainingSeconds(LocalDateTime now) {
        LocalDateTime deadline = deadline();
        if (deadline == null) return null;
        return Math.max(0, java.time.Duration.between(now, deadline).getSeconds());
    }

    /** True once {@code now} is more than {@code graceSeconds} past the deadline. */
    public boolean isPastDeadline(LocalDateTime now, long graceSeconds) {
        LocalDateTime deadline = deadline();
        return deadline != null && now.isAfter(deadline.plusSeconds(graceSeconds));
    }

    public enum SessionStatus {
        ACTIVE, COMPLETED, EXPIRED
    }
}
