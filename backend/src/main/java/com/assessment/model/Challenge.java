package com.assessment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "challenges")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Challenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private String difficulty;

    @Column(nullable = false)
    private String category;

    @Column(name = "time_limit_seconds", nullable = false)
    private Integer timeLimitSeconds;

    @Column(name = "starter_code", columnDefinition = "TEXT")
    private String starterCode;

    @Column(name = "test_cases_json", columnDefinition = "TEXT")
    private String testCasesJson;

    @Column(name = "hints_json", columnDefinition = "TEXT")
    private String hintsJson;

    @Column(name = "concepts_json", columnDefinition = "TEXT")
    private String conceptsJson;
}
