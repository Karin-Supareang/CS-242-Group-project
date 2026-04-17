from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
import os
from database import engine, Base
from controllers.authController import router as auth_router
from models import user as user_model # นำเข้าเพื่อให้ SQLAlchemy รู้จัก Table ก่อนสร้าง
from services.UserService import UserManager # Import UserManager class
from services.CategoryService import CategoryManager # Import CategoryManager class
from models import category as category_model
from models import assignment as assignment_model

# สร้าง Table ในฐานข้อมูล (ในโปรเจกต์ขนาดใหญ่ แนะนำให้ใช้ Alembic แทน)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FastAPI + PostgreSQL ของดี")

# การทำ OAuth ต้องใช้ Session เก็บค่า State ป้องกันการโจมตีแบบ CSRF
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY"))

@app.get("/")
def read_root():
    return {"message": "API is running successfully!"}

# กำหนด Prefix ตัวอย่างเช่น /api/v1 (ทำให้ /users กลายเป็น /api/v1/users ทันที)
app.include_router(auth_router, prefix="/api/v1")