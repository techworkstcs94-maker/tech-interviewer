-- Recruiter-created, single-use assessment links. Replaces the global `challenges.active` set as the
-- way candidates get challenges: each invite names one candidate and an ordered list of challenges,
-- and its random token is the URL (/a/{token}) the recruiter shares. Starting the assessment claims
-- the invite (status PENDING -> STARTED, session_id set), so the link cannot be reused.
CREATE TABLE assessment_invites (
    id              BIGSERIAL PRIMARY KEY,
    token           VARCHAR(64)  NOT NULL UNIQUE,
    title           VARCHAR(255) NOT NULL,
    candidate_name  VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP    NOT NULL,
    expires_at      TIMESTAMP    NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    session_id      VARCHAR(36),
    started_at      TIMESTAMP
);

CREATE INDEX idx_assessment_invites_session_id ON assessment_invites(session_id);

-- Ordered challenge list per invite; sort_order is the candidate's tab order.
CREATE TABLE assessment_invite_challenges (
    invite_id    BIGINT  NOT NULL REFERENCES assessment_invites(id) ON DELETE CASCADE,
    sort_order   INTEGER NOT NULL,
    challenge_id BIGINT  NOT NULL,
    PRIMARY KEY (invite_id, sort_order)
);
