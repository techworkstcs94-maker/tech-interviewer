package com.assessment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "challenge_id", nullable = false)
    private Long challengeId;

    @Column(columnDefinition = "TEXT")
    private String code;

    @Column(name = "instant_score")
    private Integer instantScore;

    @Column(name = "deep_score")
    private Integer deepScore;

    @Column(name = "instant_results", columnDefinition = "TEXT")
    private String instantResults;

    @Column(name = "deep_results", columnDefinition = "TEXT")
    private String deepResults;

    @Column(name = "elapsed_seconds")
    private Integer elapsedSeconds;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SubmissionStatus status = SubmissionStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public enum SubmissionStatus {
        PENDING, INSTANT_DONE, DEEP_DONE
    }
}
