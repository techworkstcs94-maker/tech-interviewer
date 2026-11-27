# JavaMSA Interviewer

A production-grade technical interview platform for assessing Spring Boot Microservices skills. Candidates write real Java code in a browser-based Monaco Editor and receive feedback through a **two-stage hybrid evaluation pipeline**: instant structural analysis via JavaParser AST, followed by deep JUnit verification via GitHub Actions.

---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [How Each Layer Works](#how-each-layer-works)
  - [Frontend](#frontend)
  - [Backend API](#backend-api)
  - [Hybrid Evaluation Pipeline](#hybrid-evaluation-pipeline)
  - [Real-time Communication (WebSocket)](#real-time-communication-websocket)
  - [Database](#database)
  - [Authentication](#authentication)
- [The 13 Challenges](#the-13-challenges)
- [Key Design Decisions](#key-design-decisions)
- [Infrastructure & Deployment](#infrastructure--deployment)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Setup Guide (Production)](#setup-guide-production)
- [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Why This Exists

Most coding interview platforms (LeetCode, HackerRank) test algorithmic puzzles — not the frameworks engineers use every day. A Spring Boot developer's real skills are in structuring controllers, configuring security, writing JPA repositories, and designing service layers. These can't be assessed with unit-test-only, stdin/stdout evaluation.

JavaMSA Interviewer fills that gap:
- Candidates write real annotated Spring Boot code in the browser
- Code is analysed structurally (does it have `@RestController`? `@PathVariable`?) in under 300ms
- Code is then compiled and run against actual Spring Boot integration tests in GitHub Actions
- Recruiters see a per-challenge breakdown of scores, timings, and raw JUnit output

---

## Architecture Overview

```
Browser (React + Monaco Editor)
        │  HTTP POST /api/submissions
        │  WebSocket /ws (STOMP)
        ▼
Spring Boot Backend (Render.com)
        │
  JavaParser AST analysis (synchronous, ~200ms)
        │
        │ WebSocket push (instant score)
        ▼
  structural score >= 70? ──── no ──► stop — AST result is final, no CI spent
        │
       yes
        ▼
  GitHub API dispatch (async; retries up to 2x more on failure, 2s/5s backoff)
        │
  GitHub Actions runner
  mvn test on challenge-N
        │
  Webhook POST /api/webhook/github
        │
        │ WebSocket push (deep score + JUnit output)
        ▼
  React UI updates
```

**Two-stage, gated evaluation:**
- **Stage 1 (Instant):** Synchronous. JavaParser parses the submitted Java source into an AST, checks for required annotations/patterns, and returns a 0–100 score with per-test-case feedback within 200–300ms. This result is always shown.
- **Gate:** Stage 2 only runs if the Stage 1 structural score is `>= 70` (`SubmissionController.AST_GATE_THRESHOLD`). Below that, the AST result is reported as final and GitHub Actions is never dispatched — deep verification is meant to be authoritative, but only once the structure is plausible, and it isn't worth spending a CI run on code that's still structurally broken.
- **Stage 2 (Deep):** Asynchronous. The backend base64-encodes the submitted code and calls the GitHub Actions `workflow_dispatch` API, retrying the dispatch call itself up to 2 more times on a transient failure before giving up and falling back to the Stage 1 result. Once dispatched, a runner checks out the repo, injects the candidate's code into the challenge project, runs `mvn test`, and POSTs results back to the backend via a webhook. The backend pushes results to the candidate's browser over WebSocket. A webhook reporting `0` tests run (the candidate's code failed to compile) is treated as inconclusive, not a pass or a real score — the UI falls back to showing the build output instead of a JUnit result.

---

## Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend language | Java 17 + Spring Boot 3.2 | Matches what candidates are assessed on; dogfooding the stack |
| Frontend | React 18 + TypeScript + Vite | Fast DX, strong typing for complex state (instant + deep results), Vite HMR |
| Styling | Tailwind CSS | Utility-first keeps dark-theme UI consistent without a component library |
| Code editor | Monaco Editor (`@monaco-editor/react`) | Same engine as VS Code; supports Java syntax highlighting |
| Database | PostgreSQL on Supabase | Managed Postgres with free tier; connection pooling via PgBouncer |
| DB migrations | Flyway | Schema-as-code, applied at startup, idempotent |
| ORM | Spring Data JPA + Hibernate | Standard Spring persistence layer |
| Static analysis | JavaParser 3.25.8 | Pure-Java AST parser; no compilation required; runs in-process |
| Deep testing | GitHub Actions (`workflow_dispatch`) | Real JVM, real Maven, real JUnit — no sandbox escaping or Docker-in-Docker |
| Real-time | WebSocket (STOMP over SockJS) | Push-based; candidates see results appear without polling |
| Auth | JWT (JJWT 0.11.5) + Spring Security | Stateless; recruiter dashboard protected, candidate sessions are UUID-keyed |
| Backend deploy | Render.com (Docker, free tier) | Git-push deploys; Docker isolates the JVM from the host |
| Frontend deploy | Vercel | Zero-config for React/Vite; global CDN; instant previews per branch |
| CI/CD evaluation | GitHub Actions | Runs on standard `ubuntu-latest`; Maven cache speeds up repeat runs |

---

## How Each Layer Works

### Frontend

**Pages:**
- `/` — Landing page with animated typewriter code block
- `/a/{token}` — Candidate entry via a recruiter-issued, single-use assessment link (shows title, challenge count and total time, then starts the session)
- `/challenge` — Main assessment arena (editor + results + timer)
- `/report` — End-of-session summary
- `/recruiter` — JWT-protected admin view: create/revoke assessment links, review sessions and submissions

**State management:** All state is React `useState`/`useEffect`. No Redux — the complexity doesn't justify it. Key state objects:
- `codes: Record<challengeId, string>` — editor content per challenge, auto-saved to `localStorage` every 30s
- `instantResults: AnalysisResult | null` — JavaParser output from the latest submission
- `deepResults: DeepResult | null` — JUnit counts from GitHub Actions callback
- `deepStatus: 'idle' | 'running' | 'done' | 'error'` — drives the spinner/badge in the results panel

**useWebSocket hook:**
```typescript
// Connects to ws://.../ws with STOMP over SockJS
// Subscribes to /topic/session/{sessionId}
// Dispatches incoming messages to the correct state setter
// based on message type: 'INSTANT_RESULT' | 'DEEP_STARTED' | 'DEEP_RESULT' | 'ERROR'
```

**useSnapshots hook:**
```typescript
// Keys: javamsa_code_{sessionId}_{challengeId}
// Scoped to session so code doesn't bleed across assessment sessions
// Auto-saves every 30s; restored on challenge tab switch
```

**Editor autocomplete (`lib/javaCompletions.ts`):**
Monaco's built-in "java" language mode has no semantic understanding of the Spring classpath (no
import resolution, no method signatures), so autocomplete is a curated snippet library instead of a
language server — `registerJavaCompletions` registers a
`monaco.languages.registerCompletionItemProvider('java', ...)` with snippets scoped to exactly what
the 10 challenges test (`@RestController`/`@GetMapping` handlers, `@Service` + constructor injection,
`@Entity`/`JpaRepository`, `@RestControllerAdvice` handlers, `WebClient`/`@CircuitBreaker`,
`SecurityFilterChain`/JWT, `@KafkaListener`/`@RetryableTopic`/`@Transactional`). `CodeEditor.tsx` calls
it on every mount but a module-level flag prevents re-registering (Monaco's completion registry is
global, not per-editor-instance).

**Build trick (Vercel):**
The Vercel build environment loses execute permissions on `.bin/` symlinks. The `package.json` build script bypasses this:
```json
"build": "node ./node_modules/typescript/bin/tsc && node ./node_modules/vite/bin/vite.js build"
```

**API proxying (vercel.json):**
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://tech-interviewer.onrender.com/api/:path*" },
    { "source": "/ws/:path*",  "destination": "https://tech-interviewer.onrender.com/ws/:path*" }
  ]
}
```
This avoids CORS entirely — the browser talks to Vercel's edge, which proxies to Render.

---

### Backend API

**Endpoints:**

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/challenges` | Candidate | The session's challenges — exactly those on its assessment link, in the recruiter's order |
| `GET` | `/api/challenges/{id}` | Candidate | Single challenge detail (403 if not on the session's link) |
| `GET` | `/api/recruiter/challenges` | Recruiter | Full challenge catalog with `timeLimitSeconds`/`deepVerified` |
| `GET` | `/api/recruiter/invites` | Recruiter | All assessment links with status (pending / in progress / completed / expired / revoked) |
| `POST` | `/api/recruiter/invites` | Recruiter | Create a single-use link: `{title, candidateName, candidateEmail, challengeIds, expiresInDays}` |
| `POST` | `/api/recruiter/invites/{id}/revoke` | Recruiter | Revoke an unused link |
| `GET` | `/api/invites/{token}` | None | Public link summary (title, candidate name, challenge count, total time, state) |
| `POST` | `/api/auth/login` | None | Use a link: `{inviteToken}` → candidate session + JWT (409 if already used, 410 if expired/revoked) |
| `PUT` | `/api/sessions/{id}/complete` | Session UUID | Mark session complete |
| `POST` | `/api/submissions` | Session UUID | Submit code → Stage 1 always, Stage 2 gated on the Stage 1 score (403 if not on the link or past the deadline) |
| `GET` | `/api/submissions/status` | Session UUID | Poll the latest submission's status (reconnect/fallback path) |
| `POST` | `/api/webhook/github` | HMAC secret | Receive deep evaluation results from GitHub Actions |
| `GET` | `/api/recruiter/sessions` | JWT | All sessions for recruiter dashboard |
| `POST` | `/auth/login` | — | Return JWT for recruiter |

**Submission flow (the most important endpoint):**
```
POST /api/submissions
  → save submission to DB
  → call CodeAnalysisService.analyzeCode(code, challenge)  [synchronous]
  → structural score >= 70 (AST_GATE_THRESHOLD)?
      no  → WebSocketService.sendInstantResult(sessionId, result)  [push to browser, stop here]
      yes → GitHubActionsService.triggerWorkflow(sessionId, challengeId, code)  [@Async, returns immediately]
  → return 200 to frontend
```
The AST result is *never* pushed twice for the same submission — either the gate rejects it and
`SubmissionController` sends it directly, or the gate passes and `GitHubActionsService` becomes
responsible for eventually reporting something (a deep result, or its own AST fallback if GitHub
Actions is unavailable/fails after retries/times out).

**Key services:**

`CodeAnalysisService` — wraps JavaParser. For each challenge it has a set of `TestCase` definitions each with a `predicate: CompilationUnit → Boolean`. The score is `Σ(passed_weight) / Σ(all_weights) * 100`.

`GitHubActionsService` — uses `WebClient` to call `POST /repos/{owner}/{repo}/actions/workflows/evaluate.yml/dispatches` with base64-encoded code as a workflow input. The `@Async` annotation runs this in a thread pool so the submission response is not blocked. The dispatch call retries up to 2 more times (2s, then 5s backoff) on failure before falling back to the AST result — a separate, non-retried 5-minute timeout still covers the case where dispatch succeeds but no webhook ever arrives.

`WebSocketService` — wraps `SimpMessagingTemplate`. Sends to `/topic/session/{sessionId}`. Every message has a `type` discriminator field so the frontend can route it:
```java
Map.of("type", "INSTANT_RESULT", "data", analysisResult)
Map.of("type", "DEEP_STARTED")
Map.of("type", "DEEP_RESULT", "deepScore", 80, "passedCount", 4, "totalCount", 5, ...)
Map.of("type", "ERROR", "message", "...")
```

`WebhookController` — receives the GitHub Actions callback. Validates `X-Webhook-Secret` header. Updates the submission record in DB. Pushes `DEEP_RESULT` over WebSocket. The camelCase naming in the outbound map is intentional — the TypeScript frontend reads camelCase keys.

---

### Hybrid Evaluation Pipeline

Stage 2 is **gated** on Stage 1: `SubmissionController` only calls `GitHubActionsService` when the
Stage 1 structural score is `>= 70`. Below that, the AST result is reported as final and no GitHub
Actions run is dispatched — there is no value in spending CI minutes verifying JUnit behavior of code
that doesn't even have the required annotations/structure yet, and it gives the candidate immediate,
actionable feedback to fix before their code is compiled for real.

#### Stage 1: JavaParser Instant Analysis

**Why JavaParser instead of compiling?**
- Compilation requires the full Spring Boot classpath (100MB+); instant analysis would take 30+ seconds
- JavaParser works on the source text, not bytecode — no classpath needed
- AST-level checks (annotations, method signatures, inheritance) are sufficient to score most Spring Boot patterns

**How it works:**
```java
// Parse the submitted code (no imports/package needed — JavaParser handles partial files)
CompilationUnit cu = StaticJavaParser.parse(code);

// Example test case predicate (challenge 1)
TestCase t1 = new TestCase("t1", "@RestController annotation present", 20,
    cu -> cu.findAll(ClassOrInterfaceDeclaration.class).stream()
            .anyMatch(c -> c.getAnnotationByName("RestController").isPresent()));

// Example: check @PathVariable in any method parameter
TestCase t3 = new TestCase("t3", "@PathVariable for ID parameter", 20,
    cu -> cu.findAll(Parameter.class).stream()
            .anyMatch(p -> p.getAnnotationByName("PathVariable").isPresent()));
```

Each challenge has 5–7 test cases weighted to sum to 100. A quality bonus (±10) is applied based on code structure metrics.

#### Stage 2: GitHub Actions Deep Verification

**Why GitHub Actions instead of an in-process sandbox?**
- Running arbitrary Java code safely in-process is very hard (SecurityManager was deprecated in Java 17)
- GitHub Actions gives a clean, isolated `ubuntu-latest` VM per run
- Maven cache (`~/.m2`) is shared across runs via `actions/cache`, reducing cold start from ~4min to ~30s
- Real Spring Boot context startup validates that annotations interact correctly (e.g., `@SpringBootTest` actually starts the application)

**The injection mechanism (`evaluate.yml`):**

The candidate's code is base64-encoded by the backend and passed as a `workflow_dispatch` input. The workflow:

1. Checks out the repo (which includes the challenge test project at `challenge-tests/challenge-N/`)
2. Decodes the base64 code and writes it to `CandidateSubmission.java` with a curated preamble:
   ```bash
   # Always injected (spring-boot-starter-web is in ALL challenge poms):
   import org.springframework.web.bind.annotation.*;
   import org.springframework.http.*;
   import java.util.*;
   import java.util.stream.*;
   # ... more standard library imports ...
   
   # Challenge-specific (only injected when the pom.xml has the JAR):
   # Challenge 3 → jakarta.persistence.*, spring data JPA
   # Challenge 5 → spring webflux, resilience4j
   # Challenge 6 → spring security, io.jsonwebtoken
   ```
3. Strips `package` and `import` lines from candidate code (replaced by preamble)
4. Strips `public` from class/interface/enum declarations (the file is `CandidateSubmission.java`, not `ProductController.java`, so the public class name must not match)
5. Runs `mvn test --no-transfer-progress`
6. Parses results from Surefire XML reports (`target/surefire-reports/TEST-*.xml`) with a stdout fallback
7. POSTs results to the backend webhook with HMAC verification

**A `0`-test result means the candidate's code failed to compile, not that it scored zero.** If step 5
fails at the compile phase, Maven never reaches Surefire — there's no XML report and no "Tests run:"
line in stdout, so step 6 correctly parses `0/0`. The backend/frontend treat this as inconclusive
rather than a real (if poor) JUnit result: the results panel shows a "Compilation failed" state with
the raw build output, never a pass, and never blends it with the Stage 1 structural score.

**If the dispatch call itself fails** (network blip, GitHub API error — not a candidate code issue),
`GitHubActionsService` retries it up to 2 more times with backoff before giving up and reporting the
Stage 1 result as final. This is separate from the run actually starting and then never reporting back
within 5 minutes, which has its own (non-retried) timeout fallback.

**Why strip `public` from class declarations?**
In Java, a `public class Foo` must be in a file named `Foo.java`. Since the candidate's controller is named `ProductController` but the file is `CandidateSubmission.java`, the compiler rejects it. Making it package-private (`class ProductController`) removes the filename constraint while keeping it visible within the same package.

**Why a curated preamble instead of the candidate's own imports?**
Candidate imports like `import com.example.SomeClass` could reference things that don't exist in the challenge project. Stripping all imports and replacing with a known-good preamble avoids this class of compilation error. The preamble is scoped per challenge to prevent importing JARs not in that challenge's `pom.xml` (Spring Security imports would fail to compile in challenge 1 which has no Security JAR).

**Challenge test projects:**
Each `challenge-tests/challenge-N/` is a standalone Maven project with:
- `Application.java` — minimal `@SpringBootApplication` entry point
- `CandidateSubmission.java` — placeholder overwritten at CI time
- A JUnit 5 test class using `@SpringBootTest @AutoConfigureMockMvc` (for HTTP tests) or Spring context inspection via reflection
- A `pom.xml` with only the dependencies needed for that challenge tier

---

### Real-time Communication (WebSocket)

**Protocol stack:** STOMP over SockJS over WebSocket

- **SockJS** provides fallback transports (long-polling) for environments where raw WebSocket is blocked. In practice, Vercel → Render works fine with WebSocket.
- **STOMP** adds message framing and topic subscriptions on top of raw WebSocket
- Each candidate subscribes to `/topic/session/{sessionId}` using their UUID session identifier

**Server config:**
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

**Security note:** STOMP topic subscriptions are gated by session UUID. Knowing another candidate's UUID would be required to eavesdrop on their results — acceptable for an interview platform where sessions are ephemeral.

---

### Database

**Schema (3 tables):**

```sql
-- challenges: seeded at startup via Flyway V1
CREATE TABLE challenges (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255), description TEXT, difficulty VARCHAR(50),
    category VARCHAR(100), time_limit_seconds INTEGER,
    starter_code TEXT, test_cases_json TEXT, hints_json TEXT, concepts_json TEXT
);

-- candidate_sessions: created when candidate registers
CREATE TABLE candidate_sessions (
    id VARCHAR(36) PRIMARY KEY,  -- UUID
    candidate_name VARCHAR(255), candidate_email VARCHAR(255),
    status VARCHAR(50),          -- ACTIVE / COMPLETED / EXPIRED
    time_limit_seconds INTEGER,  -- V9: assessment-level budget = sum of the link's challenge limits
    started_at TIMESTAMP, completed_at TIMESTAMP
);

-- submissions: one row per challenge submission
CREATE TABLE submissions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES candidate_sessions(id),
    challenge_id BIGINT REFERENCES challenges(id),
    submitted_code TEXT,
    instant_score INTEGER, deep_score INTEGER,
    elapsed_seconds INTEGER, submitted_at TIMESTAMP
);
```

**Supabase + PgBouncer:** Supabase provides two connection endpoints:
- Port 5432: direct PostgreSQL connection (not reachable from Render free tier)
- Port 6543: PgBouncer transaction-mode pooler (reachable)

PgBouncer in transaction mode doesn't support PostgreSQL named prepared statements. Flyway and Hibernate both use prepared statements by default. Fix: add `?prepareThreshold=0` to the JDBC URL, which disables server-side prepared statement caching:
```
jdbc:postgresql://db.xxx.supabase.co:6543/postgres?prepareThreshold=0
```

---

### Authentication

**Two distinct auth mechanisms:**

**Candidate sessions:**
- Created by `POST /api/auth/login {inviteToken}` when the candidate opens their single-use link — returns a UUID + JWT
- UUID stored in `localStorage`; sent with every submission as a header
- No passwords; sessions are scoped to the browser tab
- Code snapshots in `localStorage` are keyed `javamsa_code_{sessionId}_{challengeId}` so they don't bleed across sessions

**Recruiter JWT:**
- `POST /auth/login` with username/password → returns a signed JWT
- JWT contains role `RECRUITER`; valid for 24h
- Spring Security `SecurityFilterChain` permits `/api/**`, `/ws/**`, `/auth/**` without auth; requires JWT for `/api/recruiter/**`
- `JwtAuthenticationFilter extends OncePerRequestFilter` validates the bearer token on every request
- `JwtUtil` uses `Keys.hmacShaKeyFor(secret.getBytes())` for HMAC-SHA256 signing

---

## The 13 Challenges

Challenges 1-6 build a feature from scratch, 7-10 are Kafka (structural-only), and 11-13 are
**bug-fix** challenges: the candidate is handed already-wired Spring code with a planted bug and must
fix the behavior. For each candidate the recruiter picks any subset (and order) of these when creating
an assessment link on the dashboard; the table below is the full catalog.

| # | Title | Difficulty | Concepts Tested | Time | Stage 2 (JUnit) |
|---|-------|-----------|-----------------|------|------|
| 1 | REST Controller Basics | EASY | `@RestController`, `@GetMapping`, `@PathVariable`, `ResponseEntity` | 10 min | Yes |
| 2 | Service Layer Pattern | MEDIUM | `@Service`, constructor injection, interface pattern, custom exceptions, input validation | 15 min | Yes |
| 3 | Spring Data JPA | MEDIUM | `@Entity`, `@Id`, `JpaRepository`, derived queries, `@Query` JPQL | 15 min | Yes |
| 4 | Global Exception Handling | MEDIUM | `@ControllerAdvice`, `@ExceptionHandler`, `@ResponseStatus`, DTO pattern | 12 min | Yes |
| 5 | WebClient + Circuit Breaker | HARD | `WebClient`, Resilience4j `@CircuitBreaker`, timeout config, error handling | 20 min | Yes |
| 6 | JWT Security Configuration | HARD | `SecurityFilterChain`, `OncePerRequestFilter`, `Jwts.builder()`, stateless sessions | 25 min | Yes |
| 7 | Kafka Producer Basics | EASY | `KafkaTemplate`, constructor injection, partition keys | 10 min | No — structural only |
| 8 | Kafka Consumer Groups | MEDIUM | `@KafkaListener`, consumer groups, manual acknowledgment | 15 min | No — structural only |
| 9 | Dead Letter Topic Pattern | MEDIUM | `@RetryableTopic`, exponential backoff, `@DltHandler` | 15 min | No — structural only |
| 10 | Transactional Kafka Producer | HARD | `@Transactional`, `ProducerFactory`, exactly-once semantics | 20 min | No — structural only |
| 11 | Fix the Product Controller | MEDIUM | Bug fix — missing product must return 404 not 200 | 10 min | Yes |
| 12 | Fix the Global Exception Handler | MEDIUM | Bug fix — not-found must map to 404 not 500 | 10 min | Yes |
| 13 | Fix the Service Validation | MEDIUM | Bug fix — inverted price/name validation | 12 min | Yes |

Challenges 1-6 and 11-13 have a JUnit project under `challenge-tests/challenge-N/` and go through the
full gated two-stage pipeline. Challenges 7-10 (Kafka) don't have a JUnit harness yet
(`GitHubActionsService.JUNIT_ENABLED_CHALLENGES`), so they're always scored by Stage 1 (AST) alone —
GitHub Actions is never dispatched for them regardless of score. The bug-fix challenges (11-13) ship
buggy starter code; their AST checks act as the Stage-1 gate (structure intact + parses) while JUnit
decides pass/fail.

Each challenge has:
- A description with exact requirements
- Starter code pre-loaded in the editor
- 4 progressive hints (revealed on demand, Ctrl+H)
- 5–7 weighted instant-analysis test cases
- A JUnit integration test suite in `challenge-tests/challenge-N/`

---

## Key Design Decisions

### Why two evaluation stages?

**Speed vs accuracy tradeoff:**
- Pure AST analysis (JavaParser): 200ms, catches structural patterns, can miss runtime behavior
- Pure JUnit testing (GitHub Actions): 2–4 minutes, definitive, catches logic errors
- Together, gated: candidates always get immediate structural feedback, but the slow, CI-minute-costing
  JUnit stage only runs once that structural score clears a bar (`>= 70`) — the authoritative deep
  result then arrives asynchronously. Code that's still structurally wrong never reaches Stage 2 at all.

### Why GitHub Actions for deep evaluation?

Alternative: Run `mvn test` on the backend server itself in a subprocess.
- **Security risk:** Arbitrary code execution on the backend host
- **Resource risk:** Spring Boot test startup is CPU/memory-intensive
- **Isolation:** GitHub Actions gives a clean VM per run, no state bleeds between candidates

GitHub Actions was chosen because:
1. It's free for public repos
2. Maven cache (`actions/cache`) makes repeat runs fast (~30s vs ~4min cold)
3. The test infrastructure is version-controlled and auditable
4. No custom Docker-in-Docker or sandbox infrastructure needed

### Why one file per candidate? (CandidateSubmission.java)

The cleanest injection model is one file with all candidate code. Java supports multiple package-private classes in one file, so candidates can define `ProductController`, `Product`, `ProductService` etc. all in a single submission.

Alternatives considered:
- Multiple file upload: complex parsing, harder to base64-encode + inject
- File-per-class: needs to know filenames upfront, breaks for unexpected class names

### Why JavaParser and not regex?

Regex on Java source has too many false negatives: annotations can span lines, be fully qualified (`@org.springframework.web.bind.annotation.RestController`), etc. JavaParser's AST gives accurate structural queries regardless of formatting.

### Why STOMP over WebSocket and not SSE?

Server-Sent Events (SSE) are simpler for one-directional push but only work over HTTP/1.1. SSE with Render's free tier had timeout issues. STOMP over SockJS is more robust, and the SockJS fallback to long-polling worked as a safety net during initial deployment.

---

## Infrastructure & Deployment

### Backend (Render.com)

- Docker image built from `Dockerfile` at repo root
- Multi-stage build: Maven build → JRE-only runtime image
- Free tier: 512MB RAM, spins down after 15min inactivity (cold start ~30s)
- Env vars configured via Render dashboard (never committed to git)

```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline -q
COPY backend/src ./src
RUN mvn package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Frontend (Vercel)

- Root directory: `frontend`
- Build command: `node ./node_modules/typescript/bin/tsc && node ./node_modules/vite/bin/vite.js build`
  - Uses node to invoke tsc/vite directly (Vercel loses execute permissions on `.bin/` symlinks)
- Output directory: `dist`
- All `/api/*` and `/ws/*` paths rewritten to the Render backend URL via `vercel.json`

### GitHub Actions Secrets

| Secret | Value |
|--------|-------|
| `BACKEND_CALLBACK_URL` | `https://tech-interviewer.onrender.com` |
| `WEBHOOK_SECRET` | Same value as `WEBHOOK_SECRET` env var on Render |
| `SUPABASE_URL` | *(optional)* `https://xxx.supabase.co` — enables the direct Supabase keepalive |
| `SUPABASE_ANON_KEY` | *(optional)* Supabase anon/public key, same purpose |

### Keeping the free tier awake

Both free tiers idle out, on different clocks, and the fix for each is different:

| Platform | Idles after | Consequence | Recovery |
|----------|-------------|-------------|----------|
| Render (free web service) | 15 min without an inbound HTTP request | Cold start of 40-60s on the next request | Automatic, just slow |
| Supabase (free project) | 7 days without API/DB activity | Project **paused** | **Manual** restore from the dashboard |

`.github/workflows/keepalive.yml` handles both:

- The **`ping`** job hits `GET /api/ping` every 10 minutes. That endpoint deliberately runs
  `challengeRepository.count()` rather than returning a static `{"status":"UP"}` like `/api/health`
  does — a real query is what resets Supabase's inactivity clock, so one ping keeps *both* services
  alive.
- The **`supabase`** job talks to the Supabase REST API directly. This is the case the `ping` job
  cannot cover: if Render is down, suspended, or mid-failed-deploy, the database receives no traffic
  at all and pauses after 7 days. The job is skipped automatically when `SUPABASE_URL` /
  `SUPABASE_ANON_KEY` are not configured.

**GitHub Actions cron is a backup, not the primary pinger.** Scheduled workflows are throttled
during high load — runs are frequently minutes late and are sometimes dropped entirely, which is
enough to miss Render's 15-minute window. More importantly, **GitHub disables scheduled workflows
after 60 days with no repository activity**, at which point the keepalive silently stops with no
failure notification. Point a free external uptime monitor (cron-job.org, UptimeRobot, or similar)
at `https://tech-interviewer.onrender.com/api/ping` on a 10-minute interval as the primary, and let
this workflow be the redundant second source.

**Watch the instance-hours budget.** Render's free plan allows 750 instance-hours per month *across
the whole account*. Pinging every 10 minutes means the service never sleeps, which is ~730 hours —
essentially the entire allowance. A second free service on the same account will exceed the cap and
get suspended (which is what produces `x-render-routing: no-server`).

### Render Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `jdbc:postgresql://db.xxx.supabase.co:6543/postgres?prepareThreshold=0` |
| `DB_USER` | Supabase DB username |
| `DB_PASSWORD` | Supabase DB password |
| `JWT_SECRET` | At least 32-character secret for HMAC-SHA256 signing |
| `GITHUB_OWNER` | GitHub username owning the repo |
| `GITHUB_REPO` | Repository name (`JavaMsaInterviewer`) |
| `GITHUB_TOKEN` | Classic PAT with `workflow` scope |
| `WEBHOOK_SECRET` | Shared secret for webhook HMAC validation |

---

## Project Structure

```
JavaMsaInterviewer/
├── Dockerfile                          # Root Dockerfile (Render reads this)
├── render.yaml                         # Render service config
├── .github/
│   └── workflows/
│       └── evaluate.yml                # Deep evaluation CI workflow
│
├── backend/                            # Spring Boot 3.2 application
│   ├── pom.xml
│   └── src/main/java/com/assessment/
│       ├── AssessmentApplication.java
│       ├── controller/
│       │   ├── ChallengeController.java
│       │   ├── SessionController.java
│       │   ├── SubmissionController.java
│       │   ├── WebhookController.java   # Receives GitHub Actions callback
│       │   └── RecruiterController.java
│       ├── service/
│       │   ├── CodeAnalysisService.java # JavaParser AST analysis
│       │   ├── GitHubActionsService.java# workflow_dispatch trigger
│       │   └── WebSocketService.java    # SimpMessagingTemplate wrapper
│       ├── model/
│       │   ├── Challenge.java
│       │   ├── CandidateSession.java
│       │   └── Submission.java
│       ├── repository/
│       │   ├── ChallengeRepository.java
│       │   ├── SessionRepository.java
│       │   └── SubmissionRepository.java
│       ├── security/
│       │   ├── JwtUtil.java
│       │   └── JwtAuthenticationFilter.java
│       ├── config/
│       │   ├── SecurityConfig.java
│       │   └── WebSocketConfig.java
│       └── dto/
│           ├── SubmissionRequest.java
│           ├── AnalysisResult.java
│           └── WebhookPayload.java
│
├── frontend/                           # React 18 + TypeScript + Vite
│   ├── vercel.json                     # Proxy rewrites to Render
│   ├── package.json
│   └── src/
│       ├── pages/
│       │   ├── Landing.tsx             # Animated typewriter homepage
│       │   ├── StartSession.tsx        # Candidate registration
│       │   ├── ChallengeArena.tsx      # Main assessment UI
│       │   ├── Report.tsx              # End-of-session summary
│       │   └── Recruiter.tsx           # Admin dashboard
│       ├── components/
│       │   ├── CodeEditor.tsx          # Monaco Editor wrapper
│       │   ├── TestResults.tsx         # Unified instant + deep results panel
│       │   ├── AnalysisLog.tsx         # WebSocket event log
│       │   ├── Timer.tsx               # Assessment-level countdown (header)
│       │   └── HintsDrawer.tsx         # Slide-out hints panel
│       ├── hooks/
│       │   ├── useWebSocket.ts         # STOMP subscription + state dispatch
│       │   ├── useTimer.ts             # useAssessmentTimer: countdown to server deadline
│       │   └── useSnapshots.ts         # Session-scoped localStorage
│       ├── api/
│       │   ├── challenges.ts
│       │   ├── sessions.ts
│       │   └── submissions.ts
│       └── types/
│           └── index.ts                # AnalysisResult, DeepResult, Challenge, etc.
│
└── challenge-tests/                    # Standalone Maven projects (one per challenge)
    ├── challenge-1/                    # REST Controller — spring-boot-starter-web
    ├── challenge-2/                    # Service Layer — spring-boot-starter-web
    ├── challenge-3/                    # JPA — spring-boot-starter-data-jpa + H2
    ├── challenge-4/                    # Exception Handling — spring-boot-starter-web
    ├── challenge-5/                    # WebClient — spring-boot-starter-webflux + resilience4j
    └── challenge-6/                    # JWT Security — spring-boot-starter-security + jjwt
        └── each contains:
            ├── pom.xml
            └── src/
                ├── main/java/com/assessment/
                │   ├── Application.java          # @SpringBootApplication entry point
                │   └── CandidateSubmission.java  # Placeholder — overwritten by evaluate.yml
                └── test/java/com/assessment/
                    └── *Test.java                # JUnit 5 + Spring integration tests
```

---

## Local Development

### Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 18+
- PostgreSQL (or Docker)

### Backend

```bash
cd backend

# Set environment variables (or use a .env file with spring-dotenv)
export DATABASE_URL=jdbc:postgresql://localhost:5432/msainterviewer
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=local-dev-secret-key-must-be-at-least-32-chars
export GITHUB_OWNER=placeholder
export GITHUB_REPO=placeholder
export GITHUB_TOKEN=placeholder
export WEBHOOK_SECRET=dev-secret

mvn spring-boot:run
# API available at http://localhost:8080
# Flyway runs migrations automatically on startup
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# UI available at http://localhost:5173
# Vite proxies /api and /ws to localhost:8080 (see vite.config.ts)
```

### Running Challenge Tests Locally

```bash
# Inject a sample solution and run tests manually
cd challenge-tests/challenge-1

# Write a solution to CandidateSubmission.java, then:
mvn test
```

---

## Setup Guide (Production)

### 1. Fork the Repository

GitHub Actions must run from your own repo:
```
https://github.com/YOUR_USERNAME/JavaMsaInterviewer
```

### 2. Create Supabase Database

1. Go to [supabase.com](https://supabase.com) → New project
2. Settings → Database → Connection string → select **URI** mode → copy the URL
3. Switch to **Connection pooling** tab → copy the pooler URL (port 6543)
4. The JDBC URL format you need: `jdbc:postgresql://db.xxx.supabase.co:6543/postgres?prepareThreshold=0`

### 3. Create GitHub Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → select scope: **`workflow`**
3. Copy the token (you'll need it for the `GITHUB_TOKEN` env var on Render)

### 4. Configure GitHub Actions Secrets

In your GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Name | Value |
|------|-------|
| `BACKEND_CALLBACK_URL` | `https://your-app.onrender.com` (no trailing slash) |
| `WEBHOOK_SECRET` | Any random string (e.g., `openssl rand -hex 32`) |

### 5. Deploy Backend to Render

1. [render.com](https://render.com) → New → Web Service
2. Connect your GitHub fork
3. Runtime: **Docker** (Render auto-detects the root `Dockerfile`)
4. Add environment variables (use the same `WEBHOOK_SECRET` you set in GitHub):

```
DATABASE_URL   = jdbc:postgresql://db.xxx.supabase.co:6543/postgres?prepareThreshold=0
DB_USER        = postgres
DB_PASSWORD    = your-supabase-db-password
JWT_SECRET     = your-super-secret-key-at-least-32-characters-long
GITHUB_OWNER   = your-github-username
GITHUB_REPO    = JavaMsaInterviewer
GITHUB_TOKEN   = ghp_your_personal_access_token_with_workflow_scope
WEBHOOK_SECRET = the-same-random-string-from-step-4
```

5. Health check path: `/api/challenges`

### 6. Deploy Frontend to Vercel

1. [vercel.com](https://vercel.com) → Add New Project → Import your fork
2. Root directory: `frontend`
3. Build command will auto-detect from `package.json`
4. Update `frontend/vercel.json` — replace the destination URL with your actual Render URL
5. Settings → Deployment Protection → **disable** Vercel Authentication (otherwise the public assessment URL requires login)

### 7. Verify End-to-End

1. Open your Vercel URL
2. Click "Start Assessment" → enter name + email
3. Submit challenge 1 with any code
4. See instant analysis in ~300ms
5. GitHub Actions tab → Evaluate Submission → confirm a run starts
6. After 30–90s (cached Maven), deep score appears in the browser

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Submit current challenge |
| `Ctrl+H` | Toggle hints drawer |
| `Ctrl+1` to `Ctrl+6` | Switch to challenge N |

---

## Recruiter Access

- URL: `/recruiter`
- Default credentials: `admin` / `admin123`
- Shows all candidate sessions, per-challenge scores (instant + deep), elapsed time, and submitted code
- Change credentials by updating the `RecruiterController` or adding a `users` table
