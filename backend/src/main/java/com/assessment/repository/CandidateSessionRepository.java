package com.assessment.repository;

import com.assessment.model.CandidateSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CandidateSessionRepository extends JpaRepository<CandidateSession, Long> {
    Optional<CandidateSession> findBySessionId(String sessionId);
}
