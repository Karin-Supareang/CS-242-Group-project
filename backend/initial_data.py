"""
from sqlalchemy.orm import Session
from services import UserService
from models.user import User
from schemas.user import UserCreate

def init_db(db: Session) -> None:
    # ตรวจสอบว่ามี user อยู่แล้วหรือยัง
    user = db.query(User).filter(User.email == "admin@example.com").first()
    if not user:
        print("Creating initial user...")
        user_in = UserCreate(
            email="admin@example.com",
            name="Admin User",
            password="supersecretpassword"
        )
        UserService.create_user(db=db, user=user_in)
        print("Initial user created.")
"""