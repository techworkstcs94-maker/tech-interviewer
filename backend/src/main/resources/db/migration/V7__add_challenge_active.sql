-- Global recruiter-controlled challenge selection.
-- active = TRUE means the challenge is shown to every candidate. Recruiter toggles the set
-- from the dashboard; all existing challenges default to active so behavior is unchanged.
ALTER TABLE challenges ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
