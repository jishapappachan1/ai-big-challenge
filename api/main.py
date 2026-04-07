from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
import os
import json
import random
import string
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"), override=True)

from database import engine, Base, get_db
import models, schemas, auth, ai_scorer
from email_utils import send_otp_email, smtp_configured
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Global AI Skill Challenge API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open(os.path.join(os.path.dirname(__file__), "questions.json"), "r") as f:
    QUESTIONS = json.load(f)

MAX_QUIZ_ATTEMPTS = 10
QUIZ_QUESTION_COUNT = 2

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/signup", response_model=dict)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(user.password)
    # Create user as NOT verified initially
    new_user = models.User(email=user.email, hashed_password=hashed_pwd, is_verified=False)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate 6-digit OTP and store in otp table (overwrite previous for same email)
    code = "".join(random.choices(string.digits, k=6))
    existing_otp = db.query(models.OTP).filter(models.OTP.email == user.email).first()
    if existing_otp:
        existing_otp.code = code
    else:
        db.add(models.OTP(email=user.email, code=code))
    db.commit()

    sent = send_otp_email(user.email, code)
    response = {
        "message": "User registered. Please verify OTP sent to your email.",
        "email_sent": sent,
    }
    if not sent:
        response["message"] = (
            "User registered, but the verification email could not be sent. "
            "Check SMTP settings in .env or use otp_debug if enabled."
        )
    # Dev aid: include OTP in JSON only when SMTP missing or SMTP_DEBUG=true
    if os.getenv("SMTP_DEBUG", "").lower() in ("1", "true", "yes") or not smtp_configured():
        response["otp_debug"] = code
    return response


@app.post("/verify-otp", response_model=dict)
def verify_otp(payload: schemas.OTPVerify, db: Session = Depends(get_db)):
    otp_row = db.query(models.OTP).filter(
        models.OTP.email == payload.email,
        models.OTP.code == payload.code
    ).first()
    if not otp_row:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.delete(otp_row)
    db.commit()

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"message": "Email verified successfully.", "access_token": access_token}

@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not db_user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    
    attempts_count = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == db_user.id).count()
    has_passed_attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == db_user.id,
        models.QuizAttempt.passed == True
    ).first() is not None

    attempts_remaining = max(MAX_QUIZ_ATTEMPTS - attempts_count, 0)
    should_go_to_quiz = attempts_remaining > 0 and not has_passed_attempt

    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "attempts_remaining": attempts_remaining,
        "max_attempts": MAX_QUIZ_ATTEMPTS,
        "has_passed_quiz": has_passed_attempt,
        "next_screen": "Quiz" if should_go_to_quiz else "Dashboard"
    }

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not db_user or not auth.verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not db_user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/verify-answer")
def verify_answer(verification: schemas.VerifyAnswer, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempts_count = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == current_user.id).count()
    if attempts_count >= MAX_QUIZ_ATTEMPTS:
        raise HTTPException(status_code=403, detail="Maximum attempts reached")
    
    # Find the question and check the answer
    questions_dict = {str(q['id']): q['correct_option'] for q in QUESTIONS}
    correct_option = questions_dict.get(verification.id)
    
    if not correct_option:
        raise HTTPException(status_code=404, detail="Question not found")
        
    is_correct = verification.answer == correct_option
    
    # If the answer is incorrect, immediately fail the quiz attempt
    if not is_correct:
        new_attempt = models.QuizAttempt(user_id=current_user.id, score=0, passed=False)
        db.add(new_attempt)
        db.commit()
        return {"correct": False, "message": "Incorrect answer. You are disqualified."}
        
    return {"correct": True, "message": "Correct answer!"}

@app.post("/quiz-timeout")
def quiz_timeout(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempts_count = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == current_user.id).count()
    if attempts_count >= MAX_QUIZ_ATTEMPTS:
        raise HTTPException(status_code=403, detail="Maximum attempts reached")

    # Timeout counts as a failed attempt and consumes one retry.
    new_attempt = models.QuizAttempt(user_id=current_user.id, score=0, passed=False)
    db.add(new_attempt)
    db.commit()
    return {"message": "Timeout recorded as failed attempt"}

@app.get("/quiz")
def get_quiz(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempts_count = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == current_user.id).count()
    if attempts_count >= MAX_QUIZ_ATTEMPTS:
        raise HTTPException(status_code=403, detail="Maximum attempts reached")

    # Shuffle and pick 10 random questions
    shuffled_questions = random.sample(QUESTIONS, k=min(QUIZ_QUESTION_COUNT, len(QUESTIONS)))
    secure_questions = [{"id": q["id"], "question": q["question"], "options": q["options"]} for q in shuffled_questions]
    return {
        "questions": secure_questions,
        "attempts_remaining": MAX_QUIZ_ATTEMPTS - attempts_count,
        "max_attempts": MAX_QUIZ_ATTEMPTS
    }

@app.post("/submit-quiz")
def submit_quiz(submission: schemas.QuizSubmit, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempts_count = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == current_user.id).count()
    if attempts_count >= MAX_QUIZ_ATTEMPTS:
        raise HTTPException(status_code=403, detail="Maximum attempts reached")
    
    score = 0
    # Answers are validated against the full pool in questions_dict
    questions_dict = {str(q['id']): q['correct_option'] for q in QUESTIONS}
    for q_id, ans in submission.answers.items():
        if questions_dict.get(q_id) == ans:
            score += 1
            
    # Set passing score: must get all 10 out of 10
    passed = score >= QUIZ_QUESTION_COUNT
    
    new_attempt = models.QuizAttempt(user_id=current_user.id, score=score, passed=passed)
    db.add(new_attempt)
    db.commit()
    return {"score": score, "passed": passed}

@app.post("/submit-response")
def submit_response(submission: schemas.CreativeSubmit, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == current_user.id).first()
    if not attempt or not attempt.passed:
        raise HTTPException(status_code=403, detail="Must pass quiz first")
    
    existing = db.query(models.Response).filter(models.Response.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Response already submitted")
        
    words = submission.response.split()
    if len(words) != 25:
        raise HTTPException(status_code=400, detail=f"Response must be exactly 25 words. Current count: {len(words)}")
        
    scores = ai_scorer.evaluate_creative_response(submission.response)
    
    new_response = models.Response(
        user_id=current_user.id,
        content=submission.response,
        relevance=scores.get('relevance', 0),
        creativity=scores.get('creativity', 0),
        clarity=scores.get('clarity', 0),
        impact=scores.get('impact', 0),
        total_score=scores.get('total_score', 0)
    )
    db.add(new_response)
    db.commit()
    return {"message": "Response scored", "scores": scores}

@app.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    results = db.query(models.Response).order_by(models.Response.total_score.desc()).limit(10).all()
    leaderboard = []
    for r in results:
        user = db.query(models.User).filter(models.User.id == r.user_id).first()
        if user:
            # Mask email
            email_parts = user.email.split('@')
            masked_email = email_parts[0][:2] + "***@" + email_parts[1]
            leaderboard.append({
                "email": masked_email,
                "score": r.total_score
            })
    return {"leaderboard": leaderboard}

@app.get("/my-quiz-attempts")
def get_my_quiz_attempts(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempts_used = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == current_user.id).count()
    return {
        "attempts_used": attempts_used,
        "max_attempts": MAX_QUIZ_ATTEMPTS,
        "attempts_remaining": max(MAX_QUIZ_ATTEMPTS - attempts_used, 0)
    }
