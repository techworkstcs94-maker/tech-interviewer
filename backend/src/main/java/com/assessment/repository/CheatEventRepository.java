package com.assessment.repository;

import com.assessment.model.CheatEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CheatEventRepository extends JpaRepository<CheatEvent, Long> {
    List<CheatEvent> findBySessionIdOrderByOccurredAtAsc(String sessionId);
    void deleteBySessionId(String sessionId);
    long countBySessionId(String sessionId);
}
