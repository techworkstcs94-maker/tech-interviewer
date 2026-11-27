package com.assessment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A single-use assessment link created by a recruiter for one named candidate. The random
 * {@code token} is the shareable URL; the ordered {@code challengeIds} are the only challenges the
 * resulting session can load or submit.
 */
@Entity
@Table(name = "assessment_invites")
@Data
@NoArgsConstructor
public class AssessmentInvite {

    public enum Status { PENDING, STARTED, REVOKED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(nullable = false)
    private String title;

    @Column(name = "candidate_name", nullable = false)
    private String candidateName;

    @Column(name = "candidate_email", nullable = false)
    private String candidateEmail;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "assessment_invite_challenges", joinColumns = @JoinColumn(name = "invite_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "challenge_id", nullable = false)
    private List<Long> challengeIds = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** Deadline for *starting* the assessment. Once started, the session's own timer governs. */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    /** The candidate session created when the link was used; null until then. */
    @Column(name = "session_id", length = 36)
    private String sessionId;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /** An unused link past its expiry date. */
    public boolean isLinkExpired(LocalDateTime now) {
        return status == Status.PENDING && now.isAfter(expiresAt);
    }
}
