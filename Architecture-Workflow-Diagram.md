# Global AI Skill Challenge - Architecture Workflow Diagram

```mermaid
flowchart TD
    U[User / Participant] --> UI[UI App<br/>Expo React Native Web/Mobile]

    subgraph Frontend["Frontend Layer (ui/)"]
        UI --> NAV[Navigation + Screens]
        NAV --> AUTH_UI[Auth Screens<br/>Register / EmailVerify / Login]
        NAV --> QUIZ_UI[Quiz Screens<br/>Quiz / Timeout / Incorrect]
        NAV --> CREATIVE_UI[Creative Screen]
        NAV --> DASH_UI[Dashboard / Result]
    end

    AUTH_UI -->|POST /signup| API
    AUTH_UI -->|POST /verify-otp| API
    AUTH_UI -->|POST /resend-otp| API
    AUTH_UI -->|POST /login| API

    QUIZ_UI -->|GET /quiz| API
    QUIZ_UI -->|POST /verify-answer| API
    QUIZ_UI -->|POST /quiz-timeout| API
    QUIZ_UI -->|POST /submit-quiz| API

    CREATIVE_UI -->|POST /submit-response| API
    DASH_UI -->|GET /leaderboard| API
    DASH_UI -->|GET /my-quiz-attempts| API
    DASH_UI -->|GET /adjudication/shortlist| API

    subgraph Backend["Backend Layer (api/) - FastAPI"]
        API[FastAPI API Gateway<br/>main.py]
        API --> AUTH[JWT + Password Hashing<br/>auth.py]
        API --> OTP[OTP Orchestration<br/>_issue_otp_for_email]
        API --> QUIZ[Quiz Engine<br/>question fetch + verify + attempts]
        API --> SCORE[AI Scoring Orchestrator<br/>ai_scorer.py]
        API --> EMAIL[SMTP Sender<br/>email_utils.py]
    end

    OTP --> EMAIL
    EMAIL --> SMTP[(SMTP Provider / Mailtrap)]

    SCORE -->|Groq API Key Present| GROQ[Groq LLM<br/>Agent A + Agent B]
    SCORE -->|No Key / Failure| FALLBACK[Fallback Scoring Path]

    API --> ORM[SQLAlchemy ORM]
    ORM --> DB[(SQLite DB<br/>global_quiz.db)]

    DB --> USERS[(users)]
    DB --> OTP_T[(otp)]
    DB --> ATTEMPTS[(quiz_attempts)]
    DB --> RESP[(responses)]
    DB --> AUDIT[(evaluation_audits)]

    API --> DOCS[Swagger Docs<br/>/docs]
```

## Flow Summary

1. User interacts with Expo UI screens.
2. UI calls FastAPI endpoints for auth, quiz, submission, and leaderboard.
3. Backend validates user/session and executes business rules.
4. OTP path uses SMTP integration for verification emails.
5. Quiz path enforces attempts, scoring, and pass criteria.
6. Creative path enforces 25-word rule and runs AI scoring (Groq or fallback).
7. Results and audit events are persisted in SQLite tables.
8. Leaderboard and attempts endpoints read persisted data for UI display.

