import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

"""
ไฟล์นี้ใช้สำหรับตั้งค่าการเชื่อมต่อฐานข้อมูล PostgreSQL ด้วย SQLAlchemy
"""

# โหลดค่าจากไฟล์ .env
load_dotenv()

# ดึงค่า DATABASE_URL จาก Environment Variable
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# ตรวจสอบว่า DATABASE_URL ถูกตั้งค่าหรือไม่
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set. Please check your .env file.")

# สร้าง SQLAlchemy Engine
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

# สร้าง SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# สร้าง Base class สำหรับ declarative models
Base = declarative_base()
