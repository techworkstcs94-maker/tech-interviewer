package com.assessment.repository;

import com.assessment.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findBySessionId(String sessionId);
    Optional<Submission> findBySessionIdAndChallengeId(String sessionId, Long challengeId);
    // Candidates can resubmit a challenge multiple times before passing, which creates
    // multiple rows per (sessionId, challengeId) — always resolve to the most recent one.
    Optional<Submission> findFirstBySessionIdAndChallengeIdOrderByIdDesc(String sessionId, Long challengeId);
    List<Submission> findBySessionIdOrderByChallengeIdAsc(String sessionId);
    void deleteBySessionId(String sessionId);
}
