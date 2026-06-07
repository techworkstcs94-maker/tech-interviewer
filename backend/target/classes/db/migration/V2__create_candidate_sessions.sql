CREATE TABLE candidate_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(36) UNIQUE NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX idx_candidate_sessions_session_id ON candidate_sessions(session_id);
