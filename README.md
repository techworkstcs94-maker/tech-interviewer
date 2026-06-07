# JavaMSAInterviewer

Spring Boot Microservices Assessment Platform with hybrid evaluation: JavaParser (instant) + GitHub Actions (real tests).

## Architecture

```
Candidate submits code
       │
       ▼
 Spring Boot Backend
       │
   ┌───┴───┐
   │       │
JavaParser  GitHub Actions
(instant)   (deep, async)
   │       │
   └───┬───┘
       │
   WebSocket
       │
   React Frontend
```

## Stack

| Layer     | Technology                           |
|-----------|--------------------------------------|
| Backend   | Java 17, Spring Boot 3.2, Maven      |
| Frontend  | React 18, TypeScript, Vite, Tailwind |
| Database  | PostgreSQL (Supabase)                |
| Editor    | Monaco Editor                        |
| Analysis  | JavaParser 3.25.8 + GitHub Actions   |
| Realtime  | WebSocket (STOMP over SockJS)        |
| Deploy    | Render.com + Vercel                  |

## Challenges

| # | Topic                  | Difficulty | Time    |
|---|------------------------|------------|---------|
| 1 | REST Controller        | EASY       | 10 min  |
| 2 | Service Layer Pattern  | MEDIUM     | 15 min  |
| 3 | Spring Data JPA        | MEDIUM     | 15 min  |
| 4 | Exception Handling     | MEDIUM     | 12 min  |
| 5 | WebClient + Circuit Breaker | HARD  | 20 min  |
| 6 | JWT Security           | HARD       | 25 min  |

## Setup Guide

### 1. Fork the Repository

GitHub Actions must run from your own fork:
```
https://github.com/YOUR_USERNAME/javamsainterviewer
```

### 2. Create Supabase Database

1. Go to [supabase.com](https://supabase.com) → New project
2. Go to Settings → Database → Connection string (URI mode)
3. Copy the `DATABASE_URL`

### 3. Deploy Backend to Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repository
3. Set runtime: Docker, Dockerfile path: `./backend/Dockerfile`
4. Add environment variables:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your-super-secret-key-at-least-32-chars
GITHUB_OWNER=your-github-username
GITHUB_REPO=javamsainterviewer
GITHUB_TOKEN=ghp_your_personal_access_token
WEBHOOK_SECRET=any-random-secret-string
```

### 4. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → Import project
2. Set root directory: `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-app.onrender.com
   ```
4. Update `frontend/vercel.json` with your Render URL

### 5. Configure GitHub Actions Secrets

In your GitHub repo → Settings → Secrets → Actions:

```
BACKEND_CALLBACK_URL = https://your-app.onrender.com
WEBHOOK_SECRET       = same value as WEBHOOK_SECRET env var on Render
```

### 6. Create GitHub Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate token with `workflow` scope
3. Use as `GITHUB_TOKEN` on Render

### 7. Test the Setup

1. Open your Vercel URL
2. Click "Start Assessment"
3. Enter name + email
4. Submit challenge 1 with the starter code
5. See instant results appear in ~200ms
6. Wait 2-4 minutes for deep verification

## Local Development

### Backend

```bash
# Requires PostgreSQL running locally
cd backend
export DATABASE_URL=jdbc:postgresql://localhost:5432/msainterviewer
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=local-dev-secret-key-at-least-32-chars
export GITHUB_OWNER=placeholder
export GITHUB_REPO=placeholder
export GITHUB_TOKEN=placeholder
export WEBHOOK_SECRET=dev-secret

mvn spring-boot:run
# Runs on http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
# Proxies /api and /ws to localhost:8080
```

## Recruiter Access

- URL: `/recruiter`
- Username: `admin`
- Password: `admin123`

## Keyboard Shortcuts

| Shortcut     | Action              |
|--------------|---------------------|
| Ctrl+Enter   | Submit code         |
| Ctrl+H       | Toggle hints        |
| Ctrl+1 to 6  | Switch challenge    |

## How the Hybrid Evaluation Works

### Instant Analysis (JavaParser AST)
- Parses submitted code into an Abstract Syntax Tree
- Checks for specific annotations, method signatures, class hierarchies
- Returns results in ~100-300ms
- Score: 0-100 weighted by test case importance

### Deep Verification (GitHub Actions)
- Injects candidate code into the challenge test project
- Runs the actual JUnit test suite via `mvn test`
- Reports pass/fail counts via webhook callback
- Results appear in the WebSocket log panel
- Takes 2-4 minutes (Maven dependency download is cached)

## Project Structure

```
JavaMsaInterviewer/
├── backend/                    # Spring Boot API
│   ├── src/main/java/com/assessment/
│   │   ├── controller/         # REST endpoints
│   │   ├── service/            # Business logic + JavaParser
│   │   ├── model/              # JPA entities
│   │   ├── repository/         # Spring Data repositories
│   │   ├── security/           # JWT filter + util
│   │   ├── config/             # Security + WebSocket config
│   │   └── dto/                # Request/response DTOs
│   └── src/main/resources/
│       └── db/migration/       # Flyway SQL migrations
├── frontend/                   # React + TypeScript
│   └── src/
│       ├── pages/              # Route components
│       ├── components/         # Reusable UI
│       ├── hooks/              # useWebSocket, useTimer, useSnapshots
│       ├── api/                # Axios API clients
│       └── types/              # TypeScript interfaces
├── challenge-tests/            # Maven test projects (1-6)
│   └── challenge-N/
│       ├── src/main/           # Application + placeholder
│       └── src/test/           # JUnit test suites
└── .github/workflows/
    └── evaluate.yml            # CI evaluation workflow
```
