CREATE TABLE submissions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    challenge_id BIGINT NOT NULL,
    code TEXT,
    instant_score INTEGER,
    deep_score INTEGER,
    instant_results TEXT,
    deep_results TEXT,
    elapsed_seconds INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id)
);

CREATE INDEX idx_submissions_session_id ON submissions(session_id);
CREATE INDEX idx_submissions_session_challenge ON submissions(session_id, challenge_id);
