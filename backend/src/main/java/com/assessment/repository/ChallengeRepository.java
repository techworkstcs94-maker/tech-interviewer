package com.assessment.repository;

import com.assessment.model.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChallengeRepository extends JpaRepository<Challenge, Long> {

    // Candidate-facing: only the challenges the recruiter has activated, in stable id order.
    List<Challenge> findByActiveTrueOrderByIdAsc();
}
