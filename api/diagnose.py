import sys
sys.path.insert(0, '.')

try:
    import schemas
    print("schemas OK")
except Exception as e:
    print(f"schemas FAIL: {e}")

try:
    import models
    print("models OK")
except Exception as e:
    print(f"models FAIL: {e}")

try:
    import auth
    print("auth OK")
except Exception as e:
    print(f"auth FAIL: {e}")

try:
    from database import engine, Base, get_db
    print("database OK")
except Exception as e:
    print(f"database FAIL: {e}")

try:
    from main import app
    print("main app OK")
except Exception as e:
    print(f"main app FAIL: {e}")

# Try simulating a signup call
try:
    from database import SessionLocal
    import models, auth
    db = SessionLocal()
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = pwd_context.hash("testpassword")
    print(f"bcrypt hash OK: {hashed[:20]}...")
    db.close()
except Exception as e:
    print(f"signup sim FAIL: {e}")

print("Pydantic version:")
import pydantic
print(pydantic.VERSION)
