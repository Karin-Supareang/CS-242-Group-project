from fastapi import FastAPI
import os
from starlette.middleware.sessions import SessionMiddleware
from controllers.authController import router as auth_router
from controllers.categoryController import router as category_router
from controllers.assignmentController import router as assignment_router

app = FastAPI(
    title="FastAPI + PostgreSQL"
)

# การทำ OAuth ต้องใช้ Session เก็บค่า State ป้องกันการโจมตีแบบ CSRF สำหรับการทำงานของ Session ใน FastAPI เราต้องเพิ่ม Middleware และกำหนด Secret Key เพื่อเข้ารหัสข้อมูลใน Session
# ของ google log in ห้ามลบ
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY"))


app.include_router(auth_router)
app.include_router(category_router)
app.include_router(assignment_router)