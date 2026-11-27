# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A technical interview platform for Spring Boot Microservices skills. Candidates write Java in a
browser Monaco editor and get scored via a **two-stage hybrid evaluation pipeline**: instant
JavaParser AST analysis (~200ms) followed by deep JUnit verification in GitHub Actions (~2-4 min).
Results stream to the browser over STOMP/WebSocket. See `README.md` for the full architecture
write-up (design rationale, deployment, DB schema) — this file focuses on what you need to be
productive editing the code, including things the README doesn't cover.

## Commands

**Backend** (Spring Boot 3.2, Java 17, Maven, runs on :8080):
```bash
cd backend
mvn spring-boot:run                       # needs DATABASE_URL/DB_USER/DB_PASSWORD etc., see README "Local Development"
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run   # uses in-memory H2 instead of Postgres, no DB setup needed
mvn test                                  # backend has no test sources yet (src/test is empty) — this just verifies compilation
mvn compile                               # quick compile-only check
```

**Frontend** (React 18 + TS + Vite, runs on :5173):
```bash
cd frontend
npm install
npm run dev                               # Vite dev server, proxies /api and /ws to localhost:8080 (vite.config.ts)
npm run build                             # tsc --noEmit-equivalent type check, then vite build — no separate lint script
```
There is no frontend test runner configured (no `*.test.ts`/`*.spec.ts` files, no test script in `package.json`).

**Challenge JUnit harnesses** (the actual "tests" candidates are scored against):
```bash
cd challenge-tests/challenge-N            # N = 1..6 only — see "10 challenges, 6 with deep verification" below
# write a solution to src/main/java/com/assessment/CandidateSubmission.java
mvn test
```
Reference solutions live in `challenge-solutions/src/main/java/com/solutions/challengeN/` under package
`com.solutions.challengeN` — they are NOT drop-in compatible with `CandidateSubmission.java` (different
package, multiple files vs. the single-file-multiple-package-private-classes model the real pipeline uses).
They exist for the recruiter-facing solutions page, not for automated harness runs.

## Architecture

**Submission flow is a genuinely gated two-stage pipeline** (`SubmissionController.submit` →
[gate] → `GitHubActionsService` → `WebhookController` → `WebSocketService`):
1. `POST /api/submissions` saves a new `Submission` row and runs JavaParser AST analysis
   synchronously (`CodeAnalysisService`) — this always happens and is always shown.
2. **Stage 1 → Stage 2 gate, in `SubmissionController` itself**: only if the *raw* structural score
   (`result.getInstantScore()`, before the hint penalty) is `>= AST_GATE_THRESHOLD` (70) does it call
   `gitHubActionsService.triggerWorkflow(...)`. Below the threshold, `SubmissionController` pushes the
   AST result over WebSocket itself (`sendInstantResult`) and **never calls GitHub Actions** — no CI
   run is spent on structurally-broken code. This is deliberate: JUnit (Stage 2) is meant to be the
   authoritative signal, but only once Stage 1 says the structure is plausible.
3. `GitHubActionsService.triggerWorkflow` (`@Async`) dispatches a GitHub Actions `workflow_dispatch`
   that injects the candidate's code into `challenge-tests/challenge-N/CandidateSubmission.java` and
   runs `mvn test` there. The dispatch HTTP call itself retries up to 2 more times (2s, then 5s
   backoff) on failure before falling back to the AST result — see `MAX_DISPATCH_ATTEMPTS`/
   `RETRY_BACKOFF_MS`. This only covers a failure to *trigger* the run (network/API blip); it does not
   change the separate 5-minute no-webhook-arrived timeout fallback (`scheduleTimeoutFallback`), which
   is intentionally not retried (re-firing a whole new multi-minute CI run after a timeout would
   roughly double a candidate's worst-case wait). On a successful dispatch it pushes `DEEP_STARTED`
   over WebSocket.
4. GitHub Actions POSTs results to `POST /api/webhook/github` (HMAC-validated via `X-Webhook-Secret`),
   which updates the `Submission` row and pushes `DEEP_RESULT` over WebSocket.
5. All WebSocket messages go to STOMP topic `/topic/session/{sessionId}` with a `type` discriminator
   (`INSTANT_RESULT` | `DEEP_STARTED` | `DEEP_RESULT` | `ERROR`) and a `challengeId`; the frontend
   `useWebSocket` hook filters incoming messages against the currently active challenge.

**A `DEEP_RESULT`/`DEEP_DONE` with `totalCount === 0` is not a real result — it's reclassified as an
error, never a pass.** If the candidate's code fails to *compile* inside GitHub Actions, Maven never
reaches the Surefire test phase, so `evaluate.yml` reports `0/0` tests (see its XML/stdout parsing
fallback). Both places that interpret a deep result — `useWebSocket.ts`'s `handleMessage` (`DEEP_RESULT`
case) and its `fetchDeepStatus` REST-polling fallback (`DEEP_DONE` case) — check `totalCount > 0`
before setting `deepStatus = 'done'`; a `0` total sets `deepStatus = 'error'` instead, folding it into
the same fallback UI used for "GitHub Actions unavailable." `TestResults.tsx` further distinguishes
this specific case (`deepResults.totalCount === 0`) to show a red "Compilation failed" badge with the
raw build output auto-expanded, rather than the generic amber "structural only" message.

**Every submission/resubmission inserts a new `Submission` row** — there is no upsert. A candidate can
resubmit a challenge as many times as they like before passing, so `(sessionId, challengeId)` is **not**
unique in the `submissions` table. Anything that looks up a submission by `(sessionId, challengeId)`
(the `/api/submissions/status` polling endpoint, the GitHub webhook handler) must resolve to the
**latest** row (`findFirstBySessionIdAndChallengeIdOrderByIdDesc`), not `findBySessionIdAndChallengeId`
— the latter throws `IncorrectResultSizeDataAccessException` the moment a candidate resubmits.

**Local dev uses placeholder GitHub credentials** (`application-local.yml`: `github.owner/repo/token =
placeholder`). With placeholders, `GitHubActionsService` skips the GitHub dispatch entirely and sends
`INSTANT_RESULT` immediately — `deepStatus` never leaves `idle`/becomes `running`, so the "deep
verification running" UI and `DEEP_STARTED`/`DEEP_RESULT` messages are only observable against a real
GitHub-configured backend (staging/prod), not local dev.

**13 challenges exist, but only 9 have deep verification.** `DataInitializer` (local) seeds them;
prod gets them via Flyway migrations (`V1`/`V6` = 1-10, `V8` = 11-13). Layout: 1-6 build-from-scratch
(REST/Service/JPA/Exceptions/WebClient/Security); 7-10 Kafka (producer/consumer-groups/DLT/
transactional, **structural-only**, no JUnit harness); 11-13 **bug-fix** (controller 404 / exception
handler status / inverted service validation). JUnit projects exist under `challenge-tests/challenge-N/`
for 1-6 and 11-13, and `GitHubActionsService.JUNIT_ENABLED_CHALLENGES` is hardcoded to
`{1..6, 11..13}` — the Kafka challenges (7-10) always get structural-analysis-only scoring
(`sendInstantResult`, no GH Actions dispatch). **Three places are keyed by literal challenge id and
must move together when adding a deep-verified challenge:** the `switch` in `CodeAnalysisService.analyze`
(+ its `getFailedResults` fallback), `JUNIT_ENABLED_CHALLENGES`, and a `challenge-tests/challenge-N/`
folder. `evaluate.yml` resolves the folder as `challenge-${challenge_id}` and injects a universal import
set, so bug-fix challenges that only touch plain MVC/Core code need **no** workflow edit; a challenge
needing JPA/Security/etc. imports still needs a `case` added to `evaluate.yml`.

**Bug-fix challenges invert the meaning of the AST stage.** Their starter code is already structurally
complete (the bug is behavioral), so the `analyzeBugFixNN` methods act only as the Stage-1 gate: they
verify the code still parses and keeps the required structure (returning a high score so it clears
`AST_GATE_THRESHOLD`), and let JUnit be the authority. Each bug-fix harness is designed so the buggy
starter fails ≥1 test and the reference fix passes all — validated locally by injecting each into
`CandidateSubmission.java` and running `mvn test`.

**Recruiter-controlled global challenge selection.** `challenges.active` (added in `V7`, default TRUE)
is a single global set shared by every candidate — there is no per-candidate assignment. `GET
/api/challenges` (candidate-facing) returns only `active` challenges via
`findByActiveTrueOrderByIdAsc`; the recruiter dashboard's "Manage Challenges" modal reads all of them
via `GET /api/recruiter/challenges` (each flagged `deepVerified`) and replaces the set via
`PUT /api/recruiter/challenges/active` (rejects an empty selection). Changing the set affects new page
loads; candidates already mid-assessment keep what they loaded.

**Frontend per-challenge/per-submission state resets are intentionally synchronous, not effect-based.**
`useWebSocket(sessionId, challengeId)` resets `instantResults`/`deepResults`/`deepStatus` **during
render** (not in a `useEffect`) when `challengeId` changes, by comparing against a ref and calling the
state setters directly in the function body. This is the documented React "adjust state while
rendering" pattern — it forces React to discard the in-progress render and re-render before any
`ChallengeArena` effect can read stale results against the new `challengeId` (the previous effect-based
reset allowed exactly one render where an old challenge's `instantResults`/`deepResults` could be read
together with the new `activeChallenge`, e.g. during the post-pass auto-advance, falsely marking the
next challenge "passed"). `useWebSocket` also exposes `resetForNewSubmission()`, which `ChallengeArena`
calls right before each `Run Tests` click so a resubmission can't briefly inherit the previous attempt's
result for the same challenge.

**`fetchDeepStatus` (in `useWebSocket`) must not depend on `challengeId`.** It reads the active
challenge from `challengeIdRef.current` instead of taking it as a closure dependency. If it depended on
`challengeId`, every challenge switch would change `fetchDeepStatus`'s identity, which cascades into
`connect`'s identity changing, which forces the WebSocket to fully reconnect on every tab switch /
auto-advance — and `onConnect` calls `fetchDeepStatus()`, which would re-pull whatever submission status
already exists in the DB for the newly active challenge, regardless of whether the candidate actually
submitted anything for it in the current visit (a stale `DEEP_DONE` row from an earlier attempt would
make a challenge look "passed" just from switching to its tab).

**`TestResults.tsx`'s four render states must stay exhaustive — this has already regressed once.**
`deepSucceeded` / `isRunning` / `isFallback` / IDLE are meant to be mutually exclusive and jointly
exhaustive (exactly one always renders). `isFallback` must trigger whenever there's an `instantResults`
*or* a `deepResults` to show — **not** `deepStatus !== 'idle'`. Placeholder-credentials local dev, the
4 Kafka challenges (no JUnit harness), a Stage 1→2 gate rejection, and a GitHub dispatch exception all
push an `INSTANT_RESULT` while `deepStatus` stays `'idle'` (deep verification never started) — gating
`isFallback` on `deepStatus !== 'idle'` alone makes all of those render a blank panel (neither IDLE nor
FALLBACK matches). If you touch these flags, keep IDLE defined as the *complement* of the other three
(`!isRunning && !deepSucceeded && !isFallback`) rather than re-deriving it from `deepStatus` directly.

**The timer is assessment-level, not per-challenge, and the server owns the deadline.** At login
`AuthController` freezes `candidate_sessions.time_limit_seconds` (V9) = sum of the *active* challenges'
`timeLimitSeconds`; `Challenge.timeLimitSeconds` is now only an input to that sum. `GET
/api/sessions/{id}` returns `remainingSeconds` (a duration, not a timestamp, so server/browser timezone
and clock skew don't matter); `ChallengeArena` turns it into a local `deadlineMs` for
`useAssessmentTimer`, so refreshes and tab switches never reset the clock. `SubmissionController` rejects
submissions (403) more than `DEADLINE_GRACE_SECONDS` (60) past the deadline and marks the session
`EXPIRED`; `completeSession` also records `EXPIRED` when finishing after the deadline. At 0 the frontend
locks the editor, auto-submits every challenge that is not passed, differs from its starter code, and
differs from its last submitted code, then calls `handleFinish` — the grace window exists only to cover
that burst. Code is saved to `localStorage` on every challenge switch (cleanup of the effect keyed on
the active challenge id), and `elapsedSeconds` on a submission is per-challenge time-on-task.

**Editor autocomplete is a curated snippet library, not a language server.** Monaco has no semantic
understanding of the Spring classpath. `frontend/src/lib/javaCompletions.ts` registers a
`monaco.languages.registerCompletionItemProvider('java', ...)` with snippets scoped to exactly what
the 10 challenges test (REST/JPA/exception-handling/WebClient/Security/Kafka patterns). Registration
is guarded by a module-level flag (`registered`) since Monaco's completion registry is global, not
per-editor-instance — `CodeEditor.tsx` calls it on every mount, so without the guard every suggestion
would appear duplicated after a remount.

**Auth is two separate JWT-based mechanisms**, both stateless: candidate sessions (`POST
/api/auth/login`, UUID `sessionId` stored in `localStorage`, sent as the bearer token / basic-auth
principal on every request) and recruiter login (`POST /api/auth/recruiter`, hardcoded
`admin`/`admin123` in `AuthController`, JWT role `RECRUITER`). `Submission`, `CandidateSession` and
`CheatEvent` all key off the `sessionId` string, not a numeric candidate ID.
