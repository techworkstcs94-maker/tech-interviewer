-- Assessment-level timer: the whole session gets one time budget instead of a per-challenge clock.
-- Captured at login as the sum of the active challenges' time_limit_seconds, so later changes to
-- the active set (or to individual limits) never move an in-progress candidate's deadline.
-- Nullable: sessions created before this migration have no limit and are never treated as expired.
ALTER TABLE candidate_sessions ADD COLUMN time_limit_seconds INTEGER;
