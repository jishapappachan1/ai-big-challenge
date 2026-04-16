# Global AI Skill Challenge

## Functional, Architectural, and Technology Overview

### 1) Executive Summary

The application is a full-stack challenge platform where users:

1. Register and verify email via OTP
2. Attempt a limited-retry quiz
3. On passing, submit a 25-word creative response
4. Receive AI-based rubric scoring
5. Appear on leaderboard and adjudication views

It is built with an Expo React Native UI, FastAPI backend, SQLite persistence, SMTP email integration, and Groq-powered scoring orchestration.

### 2) Core Functional Requirements

#### 2.1 User Registration and Verification

- User can sign up with email and password
- System sends a 6-digit OTP to registered email
- User must verify OTP before login
- OTP can be resent for unverified accounts

#### 2.2 Authentication

- Verified users can log in
- JWT token issued after login or OTP verification
- Protected APIs require Bearer token

#### 2.3 Quiz Lifecycle

- User gets randomized questions from question bank
- Immediate answer verification endpoint available
- Wrong answer or timeout consumes one attempt
- Max attempts per user enforced (currently 10)
- Quiz pass state is stored and reused in downstream flow

#### 2.4 Creative Response Submission

- Allowed only after quiz pass
- Strict 25-word response validation
- One response per user
- AI scoring computes rubric dimensions and total score

#### 2.5 Results, Leaderboard, and Attempts

- Dashboard shows attempts used and remaining
- Leaderboard displays top scores with masked emails
- Adjudication shortlist endpoint ranks entries by score priority

### 3) Architecture Overview

#### 3.1 High-Level Architecture

- UI Layer: Expo React Native app (`ui`)
- API Layer: FastAPI service (`api/main.py`)
- Data Layer: SQLite (`api/global_quiz.db`) via SQLAlchemy
- External Services:
  - SMTP server for OTP mail
  - Groq LLM API for scoring

#### 3.2 Runtime Flow

- UI sends HTTP requests to FastAPI
- FastAPI handles validation, business logic, persistence
- SQLAlchemy maps models to SQLite tables
- AI scoring pipeline runs server-side and writes audit trail

### 4) Technology Stack

#### Frontend

- React Native (Expo)
- React Navigation (native stack)
- Axios (HTTP client)
- AsyncStorage (token and session persistence)

#### Backend

- Python
- FastAPI and Uvicorn
- SQLAlchemy ORM
- Pydantic schemas
- `python-jose` (JWT)
- `passlib` + `bcrypt` (password hashing)
- `python-dotenv` (environment loading)

#### Database

- SQLite file DB (`global_quiz.db`)

#### Integrations

- SMTP (`smtplib`) for OTP emails
- Groq SDK (`llama-3.1-8b-instant`) for scoring

### 5) Backend Functional Design

#### 5.1 Key API Endpoints

- `POST /signup`
- `POST /resend-otp`
- `POST /verify-otp`
- `POST /login`
- `GET /quiz`
- `POST /verify-answer`
- `POST /quiz-timeout`
- `POST /submit-quiz`
- `POST /submit-response`
- `GET /leaderboard`
- `GET /my-quiz-attempts`
- `GET /adjudication/shortlist`

#### 5.2 Business Rules

- OTP required to activate account
- Maximum quiz attempt policy enforced
- Timeout and wrong answer both consume attempts
- Creative response requires prior quiz pass
- Creative response must contain exactly 25 words
- Duplicate creative submissions blocked

### 6) Data Architecture (SQLite)

#### Tables

- `users`: identity, password hash, verification and payment flags
- `otp`: latest OTP per email
- `quiz_attempts`: score and pass or fail per attempt
- `responses`: creative content plus rubric scores and total
- `evaluation_audits`: full scoring pipeline stage logs

#### Relationship Highlights

- `quiz_attempts.user_id -> users.id`
- `responses.user_id -> users.id`
- `evaluation_audits.user_id -> users.id`

### 7) AI Scoring and Evaluation Design

#### 7.1 Rubric

Each category scored 0 to 25:

- Relevance
- Creativity
- Clarity
- Impact

Total score is sum of all four (0 to 100).

#### 7.2 Multi-Stage Scoring Pipeline

1. Precheck: word count tool
2. Agent A: initial LLM scorer
3. Normalization: clamp and round to valid rubric range
4. Agent B: reviewer or adjuster of Agent A scores
5. Finalize: total aggregation
6. Audit: all stage input and output captured as events

#### 7.3 Fallback and Resilience

- If no `GROQ_API_KEY`, fallback score logic applies
- If LLM call fails, pipeline returns zeros plus error audit event
- System remains functional even when AI provider fails

### 8) UI Functional Flow

1. App starts and checks token in AsyncStorage
2. No token leads to Landing, Register, EmailVerify
3. Verified login leads to Quiz
4. Quiz pass leads to Creative entry
5. Submit response leads to Entry accepted and dashboard or result views
6. Dashboard refreshes leaderboard and attempts metadata

### 9) Security and Governance Notes

#### Implemented

- Password hashing using bcrypt
- JWT-protected endpoints
- OTP verification gate before login
- Email masking in leaderboard

#### Improvement Areas

- Move JWT secret fully to environment and rotate regularly
- Add OTP expiry, throttling, and retry limits
- Tighten CORS for production
- Add comprehensive automated tests

### 10) Operations and Runbook

#### Local Startup

- Backend: create venv, install `requirements.txt`, run `uvicorn main:app --reload --port 8000`
- UI: `npm install`, `npx expo start --web -c`

#### Key URLs

- API: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`
- UI: `http://localhost:8081`

### 11) Demo Script for Evaluators

1. Register a new user
2. Verify OTP
3. Login and show token-based flow
4. Attempt quiz and show wrong-answer or timeout behavior
5. Pass quiz and submit 25-word response
6. Show scored output and leaderboard entry
7. Show DB tables (`responses`, `evaluation_audits`) to prove persistence and traceability

### 12) Conclusion

This application demonstrates a practical full-stack assessment workflow integrating secure user onboarding, controlled quiz-based eligibility, and explainable AI-assisted scoring with auditable trace logs.

