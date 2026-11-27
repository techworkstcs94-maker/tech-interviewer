package com.assessment.repository;

import com.assessment.model.AssessmentInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AssessmentInviteRepository extends JpaRepository<AssessmentInvite, Long> {

    Optional<AssessmentInvite> findByToken(String token);

    Optional<AssessmentInvite> findBySessionId(String sessionId);

    List<AssessmentInvite> findAllByOrderByCreatedAtDesc();

    /**
     * Atomically claims a PENDING invite for a new session. Returns 0 if another request claimed
     * (or a recruiter revoked) it first — the conditional UPDATE is what makes the link single-use
     * even under a double-click / two-tab race.
     */
    @Modifying
    @Query("update AssessmentInvite i set i.status = :started, i.sessionId = :sessionId, i.startedAt = :now " +
           "where i.id = :id and i.status = :pending")
    int claim(@Param("id") Long id,
              @Param("sessionId") String sessionId,
              @Param("now") LocalDateTime now,
              @Param("pending") AssessmentInvite.Status pending,
              @Param("started") AssessmentInvite.Status started);
}
