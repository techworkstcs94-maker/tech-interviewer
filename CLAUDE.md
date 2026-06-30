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

**Submission flow** (`SubmissionController.submit` → `CodeAnalysisService` → `GitHubActionsService` → `WebhookController` → `WebSocketService`):
1. `POST /api/submissions` saves a new `Submission` row, runs JavaParser AST analysis synchronously
   (`CodeAnalysisService`), and returns the instant result in the HTTP response.
2. `GitHubActionsService.triggerWorkflow` (`@Async`) dispatches a GitHub Actions `workflow_dispatch`
   that injects the candidate's code into `challenge-tests/challenge-N/CandidateSubmission.java` and
   runs `mvn test` there. On success it pushes `DEEP_STARTED` over WebSocket.
3. GitHub Actions POSTs results to `POST /api/webhook/github` (HMAC-validated via `X-Webhook-Secret`),
   which updates the `Submission` row and pushes `DEEP_RESULT` over WebSocket.
4. All WebSocket messages go to STOMP topic `/topic/session/{sessionId}` with a `type` discriminator
   (`INSTANT_RESULT` | `DEEP_STARTED` | `DEEP_RESULT` | `ERROR`) and a `challengeId`; the frontend
   `useWebSocket` hook filters incoming messages against the currently active challenge.

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

**10 challenges exist, but only 6 have deep verification.** `DataInitializer` seeds 10 challenges
(1-6: REST/Service/JPA/Exceptions/WebClient/Security; 7-10: Kafka producer/consumer-groups/DLT/
transactional). Only challenges 1-6 have a JUnit project under `challenge-tests/challenge-N/`, and
`GitHubActionsService.JUNIT_ENABLED_CHALLENGES` is hardcoded to `{1..6}` — challenges 7-10 always get
structural-analysis-only scoring (`sendInstantResult`, no GH Actions dispatch). If a Kafka challenge
ever gets a real JUnit harness added under `challenge-tests/challenge-N/`, that set must be updated too.

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

**Auth is two separate JWT-based mechanisms**, both stateless: candidate sessions (`POST
/api/auth/login`, UUID `sessionId` stored in `localStorage`, sent as the bearer token / basic-auth
principal on every request) and recruiter login (`POST /api/auth/recruiter`, hardcoded
`admin`/`admin123` in `AuthController`, JWT role `RECRUITER`). `Submission`, `CandidateSession` and
`CheatEvent` all key off the `sessionId` string, not a numeric candidate ID.
