CREATE TABLE IF NOT EXISTS cheat_events (
    id          BIGSERIAL    PRIMARY KEY,
    session_id  VARCHAR(255) NOT NULL,
    event_type  VARCHAR(100) NOT NULL,
    severity    VARCHAR(20)  NOT NULL,
    detail      VARCHAR(500),
    occurred_at TIMESTAMP    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cheat_events_session_id ON cheat_events(session_id);
CREATE INDEX IF NOT EXISTS idx_cheat_events_occurred_at ON cheat_events(occurred_at);
