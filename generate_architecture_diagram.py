from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "Architecture-Workflow-Diagram.png"


def add_box(ax, x, y, w, h, text, fc, ec="#34495e", fs=9, weight="normal"):
    box = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle="round,pad=0.02,rounding_size=0.02",
        linewidth=1.3,
        edgecolor=ec,
        facecolor=fc,
    )
    ax.add_patch(box)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs, fontweight=weight)


def add_arrow(ax, x1, y1, x2, y2, text=None, fs=7):
    ax.annotate(
        "",
        xy=(x2, y2),
        xytext=(x1, y1),
        arrowprops=dict(arrowstyle="->", lw=1.1, color="#2c3e50"),
    )
    if text:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ax.text(mx, my + 0.01, text, fontsize=fs, color="#2c3e50", ha="center", va="center")


def main():
    fig, ax = plt.subplots(figsize=(18, 10))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")

    # Title
    ax.text(
        0.5,
        0.965,
        "Global AI Skill Challenge - Architecture Workflow",
        ha="center",
        va="center",
        fontsize=16,
        fontweight="bold",
    )

    # Group backgrounds
    add_box(ax, 0.03, 0.12, 0.26, 0.78, "Frontend Layer (Expo React Native)", "#dff0ff", fs=10, weight="bold")
    add_box(ax, 0.34, 0.12, 0.32, 0.78, "Backend Layer (FastAPI - api/)", "#ffe8cc", fs=10, weight="bold")
    add_box(ax, 0.70, 0.52, 0.27, 0.38, "External Services", "#f0e6ff", fs=10, weight="bold")
    add_box(ax, 0.70, 0.12, 0.27, 0.34, "Data Layer", "#e6f7e9", fs=10, weight="bold")

    # Frontend
    add_box(ax, 0.08, 0.84, 0.15, 0.05, "User / Participant", "#ffffff", fs=9, weight="bold")
    add_box(ax, 0.08, 0.74, 0.15, 0.07, "Navigation + Screens", "#ffffff")
    add_box(ax, 0.08, 0.64, 0.15, 0.07, "Auth Screens\nRegister / Verify / Login", "#ffffff")
    add_box(ax, 0.08, 0.54, 0.15, 0.07, "Quiz Screens\nQuiz / Timeout / Incorrect", "#ffffff")
    add_box(ax, 0.08, 0.44, 0.15, 0.07, "Creative Screen", "#ffffff")
    add_box(ax, 0.08, 0.34, 0.15, 0.07, "Dashboard / Result", "#ffffff")

    # Backend
    add_box(ax, 0.43, 0.73, 0.16, 0.09, "FastAPI API Gateway\n(main.py)", "#fffaf0", fs=9, weight="bold")
    add_box(ax, 0.37, 0.59, 0.12, 0.08, "JWT + Password\n(auth.py)", "#fffaf0", fs=8)
    add_box(ax, 0.52, 0.59, 0.12, 0.08, "OTP\nOrchestration", "#fffaf0", fs=8)
    add_box(ax, 0.37, 0.46, 0.12, 0.08, "Quiz Engine", "#fffaf0", fs=8)
    add_box(ax, 0.52, 0.46, 0.12, 0.08, "AI Scoring\n(ai_scorer.py)", "#fffaf0", fs=8)
    add_box(ax, 0.445, 0.33, 0.15, 0.08, "SMTP Sender\n(email_utils.py)", "#fffaf0", fs=8)
    add_box(ax, 0.445, 0.21, 0.15, 0.08, "SQLAlchemy ORM", "#fffaf0", fs=8)

    # External
    add_box(ax, 0.75, 0.80, 0.17, 0.07, "SMTP Provider\n(Mailtrap)", "#ffffff", fs=8)
    add_box(ax, 0.75, 0.69, 0.17, 0.07, "Groq LLM\nAgent A + Agent B", "#ffffff", fs=8)
    add_box(ax, 0.75, 0.58, 0.17, 0.07, "Fallback Scoring Path", "#ffffff", fs=8)

    # Data
    add_box(ax, 0.78, 0.38, 0.11, 0.06, "SQLite DB\n(global_quiz.db)", "#ffffff", fs=8, weight="bold")
    add_box(ax, 0.73, 0.28, 0.09, 0.05, "users", "#ffffff", fs=8)
    add_box(ax, 0.84, 0.28, 0.09, 0.05, "otp", "#ffffff", fs=8)
    add_box(ax, 0.73, 0.20, 0.09, 0.05, "quiz_attempts", "#ffffff", fs=8)
    add_box(ax, 0.84, 0.20, 0.09, 0.05, "responses", "#ffffff", fs=8)
    add_box(ax, 0.785, 0.13, 0.10, 0.05, "evaluation_audits", "#ffffff", fs=7)

    # Main flow arrows
    add_arrow(ax, 0.155, 0.84, 0.155, 0.81)
    add_arrow(ax, 0.23, 0.77, 0.43, 0.77, "Auth: /signup /verify-otp /resend-otp /login")
    add_arrow(ax, 0.23, 0.57, 0.43, 0.50, "Quiz: /quiz /verify-answer /quiz-timeout /submit-quiz")
    add_arrow(ax, 0.23, 0.47, 0.43, 0.47, "Creative: /submit-response")
    add_arrow(ax, 0.23, 0.37, 0.43, 0.38, "Read: /leaderboard /my-quiz-attempts /adjudication/shortlist")

    # Internal backend arrows
    add_arrow(ax, 0.51, 0.73, 0.43, 0.67)
    add_arrow(ax, 0.51, 0.73, 0.58, 0.67)
    add_arrow(ax, 0.51, 0.73, 0.43, 0.54)
    add_arrow(ax, 0.51, 0.73, 0.58, 0.54)
    add_arrow(ax, 0.51, 0.46, 0.52, 0.33)
    add_arrow(ax, 0.58, 0.63, 0.75, 0.83)
    add_arrow(ax, 0.64, 0.50, 0.75, 0.72)
    add_arrow(ax, 0.64, 0.48, 0.75, 0.61)

    # DB arrows
    add_arrow(ax, 0.52, 0.21, 0.78, 0.41)
    add_arrow(ax, 0.835, 0.38, 0.775, 0.33)
    add_arrow(ax, 0.835, 0.38, 0.885, 0.33)
    add_arrow(ax, 0.835, 0.38, 0.775, 0.25)
    add_arrow(ax, 0.835, 0.38, 0.885, 0.25)
    add_arrow(ax, 0.835, 0.38, 0.835, 0.18)

    # Legend
    add_box(ax, 0.03, 0.02, 0.18, 0.07, "Legend", "#ffffff", fs=9, weight="bold")
    ax.text(0.04, 0.065, "Blue: Frontend", fontsize=8, va="center")
    ax.text(0.11, 0.065, "Orange: Backend", fontsize=8, va="center")
    ax.text(0.04, 0.04, "Purple: External Services", fontsize=8, va="center")
    ax.text(0.15, 0.04, "Green: Data Layer", fontsize=8, va="center")

    fig.savefig(OUT, dpi=220, bbox_inches="tight")
    print(f"Saved diagram: {OUT}")


if __name__ == "__main__":
    main()
