from fastapi import FastAPI
import asyncio
import os
from starlette.middleware.sessions import SessionMiddleware
from controllers.authController import router as auth_router
from controllers.categoryController import router as category_router
from controllers.assignmentController import router as assignment_router
from controllers.notificationController import router as notification_router
from fastapi.middleware.cors import CORSMiddleware
from services.AutomaticService import check_deadlines_and_notify

app = FastAPI(
    title="FastAPI + PostgreSQL"
)

# การทำ OAuth ต้องใช้ Session เก็บค่า State ป้องกันการโจมตีแบบ CSRF สำหรับการทำงานของ Session ใน FastAPI เราต้องเพิ่ม Middleware และกำหนด Secret Key เพื่อเข้ารหัสข้อมูลใน Session
# ของ google log in ห้ามลบ
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # สั่งให้ Background Task เริ่มทำงานพร้อมกับเซิร์ฟเวอร์
    asyncio.create_task(check_deadlines_and_notify())

app.include_router(auth_router)
app.include_router(category_router)
app.include_router(assignment_router)
app.include_router(notification_router)