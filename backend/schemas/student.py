from pydantic import BaseModel
from typing import Optional

# ข้อมูลพื้นฐานของ Student
class StudentBase(BaseModel):
    email: str
    name: Optional[str] = None

# ข้อมูลที่รับตอนสร้าง Student (Signup)
class StudentCreate(StudentBase):
    password: Optional[str] = None
    confirm_password: Optional[str] = None

# ข้อมูลสำหรับ Login
class StudentLogin(BaseModel):
    email: str
    password: str

# ข้อมูลที่ส่งกลับไปให้ Client
class Student(StudentBase):
    student_id: int
    notification: bool
