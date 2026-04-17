# Global AI Skill Challenge - Demo Transcript

## 12-Minute Demo Script

### 0:00 - 0:45 | Opening
Say:
- "This is a full-stack AI quiz challenge app. Users verify via OTP, clear a retry-limited quiz, submit a 25-word response, and get rubric-based AI scoring."
- "Stack: Expo React Native UI, FastAPI backend, SQLite DB, SMTP OTP, Groq scoring with fallback."

Show:
- Architecture PDF first page (`Application-Architecture-Report.pdf`).

---

### 0:45 - 1:30 | System Readiness
Show 3 tabs quickly:
- UI: `http://localhost:8081`
- API docs: `http://127.0.0.1:8000/docs`
- Mailtrap inbox (or OTP source)

Say:
- "Everything runs locally; APIs are testable via Swagger."

---

### 1:30 - 3:00 | Signup + OTP Verification
In UI:
1. Click **Register**
2. Enter demo email/password
3. Submit signup

In Mailtrap:
4. Open received OTP mail

Back in UI:
5. Enter OTP and verify

Say:
- "User is created unverified first; OTP validation flips `is_verified` and issues JWT."

---

### 3:00 - 4:15 | Login + Protected Flow
In UI:
1. Login with same user
2. Land on quiz flow

Say:
- "JWT is stored client-side and attached to protected API calls."

---

### 4:15 - 6:15 | Quiz Flow (Success + Failure Behavior)
In UI:
1. Start quiz attempt
2. Intentionally answer one question wrong (or trigger timeout) to show attempt consumption
3. Retry and pass the quiz

Say:
- "Attempts are capped. Wrong answer and timeout both consume attempts."
- "Questions are sampled from the question bank."

---

### 6:15 - 7:45 | Creative Response + AI Scoring
In UI:
1. Go to creative submission
2. Paste prepared **exact 25-word** response
3. Submit and show result/score

Say:
- "Backend enforces exact 25 words."
- "Scoring rubric is relevance, creativity, clarity, impact; total out of 100."

---

### 7:45 - 8:45 | Leaderboard
In UI:
1. Open Dashboard/Leaderboard
2. Show your new entry reflected

Say:
- "Leaderboard is generated from persisted response scores, with masked emails."

---

### 8:45 - 10:15 | DB Proof (Credibility Section)
Open DB Browser (`global_quiz.db`), show:
- `users` (verified user)
- `quiz_attempts` (fail/pass records)
- `responses` (stored content + scores)
- `evaluation_audits` (pipeline stage logs)

Say:
- "Every scoring stage is auditable for traceability."

---

### 10:15 - 11:15 | API Proof in Swagger
In `/docs`, open:
- `/submit-response`
- `/leaderboard`
- `/my-quiz-attempts`

Say:
- "Each frontend action maps to explicit REST endpoints; this is testable independently."

---

### 11:15 - 12:00 | Close + Production Posture
Say:
- "Current solution demonstrates complete workflow and observability."
- "Production hardening planned: OTP expiry/rate limits, stricter CORS, secrets management, and automated tests."

---

## Backup Plan (If Demo Hiccups)
- **SMTP issue**: show OTP debug path / explain resend endpoint.
- **Groq issue**: explain fallback scoring path and continue demo.
- **UI glitch**: continue via Swagger for backend proof.
- **Data confusion**: use DB tables as source of truth.

---

## Copy-Paste 25-Word Sample
"I combine practical AI delivery with user empathy, measurable impact, and disciplined execution, ensuring reliable outcomes, fast iteration, clear communication, and scalable value for teams."

---

## One-Page Cue Card

1. Intro (problem + stack)
2. Show app + docs + OTP inbox
3. Register + verify OTP
4. Login + quiz
5. Fail once (attempt consumed), then pass
6. Submit 25-word response
7. Show score + leaderboard
8. Show DB tables + audit trail
9. Show API endpoints in Swagger
10. Close with production hardening notes
