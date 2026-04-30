from pydantic import BaseModel, validator, root_validator # เพิ่ม root_validator
from typing import Optional
# ไฟล์นี้คือ Schema สำหรับ User ครับ มีอยู่จริงและจำเป็นมากสำหรับโปรเจกต์
# ข้อมูลพื้นฐาน
class UserBase(BaseModel):
    email: str # Required for UserBase and UserCreate
    username: Optional[str] = None
    name: Optional[str] = None
    class Config:
        json_schema_extra = {
            "example": {
                "api": "localhost:8000/auth/login/google"
            }
        }
# ข้อมูลตอนสร้าง (รับจาก Client)
class UserCreate(UserBase):
    password: Optional[str] = None # Optional เพื่อให้ Google Login สร้างบัญชีได้โดยไม่มีรหัส
    confirm_password: Optional[str] = None

    @validator('username')
    def username_cannot_contain_at(cls, v):
        if v is not None and '@' in v: # Check if username contains '@'
            raise ValueError('Username cannot contain "@" symbol')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "email": "teststudent@example.com",
                "username": "teststudent1",
                "name": "Patcharaphol Sriprasert",
                "password": "password123",
                "confirm_password": "password123"
            }
        }

# ข้อมูลสำหรับ Login ปกติ
class UserLogin(BaseModel):
    # สำหรับ Login, ผู้ใช้สามารถระบุได้ทั้ง email หรือ username
    email: Optional[str] = None 
    username: Optional[str] = None 
    password: str
    @root_validator(skip_on_failure=True) # แก้ไขตรงนี้
    def check_email_or_username(cls, values):
        if not values.get('email') and not values.get('username'):
            raise ValueError('Either email or username must be provided')
        return values
        
    class Config:
        json_schema_extra = {
            "example": {
                "username": "teststudent1",
                "password": "password123"
            }
        }

# ข้อมูลตอนส่งกลับ (มี ID กลับไปให้ Client ด้วย)
class User(UserBase):
    user_id: int
    notification: bool

    class Config:
        from_attributes = True # เปลี่ยน orm_mode เป็น from_attributes สำหรับ Pydantic v2

# ข้อมูลสำหรับตอบกลับตอนสมัครสมาชิกสำเร็จ
class UserSignupResponse(BaseModel):
    message: str
    user: User
    categories: list[str] # เพิ่มฟิลด์สำหรับส่งรายชื่อ Category กลับไป