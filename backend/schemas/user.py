from pydantic import BaseModel, validator, root_validator # เพิ่ม root_validator
from typing import Optional
# ไฟล์นี้คือ Schema สำหรับ User ครับ มีอยู่จริงและจำเป็นมากสำหรับโปรเจกต์
# ข้อมูลพื้นฐาน
class UserBase(BaseModel):
    email: str # Required for UserBase and UserCreate
    username: str # Required for UserBase and UserCreate
    name: Optional[str] = None

# ข้อมูลตอนสร้าง (รับจาก Client)
class UserCreate(UserBase):
    password: Optional[str] = None # Optional เพื่อให้ Google Login สร้างบัญชีได้โดยไม่มีรหัส
    confirm_password: Optional[str] = None

    @validator('username')
    def username_cannot_contain_at(cls, v):
        if '@' in v: # Check if username contains '@'
            raise ValueError('Username cannot contain "@" symbol')
        return v

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

# ข้อมูลตอนส่งกลับ (มี ID กลับไปให้ Client ด้วย)
class User(UserBase):
    user_id: int
    notification: bool

    class Config:
        from_attributes = True # เปลี่ยน orm_mode เป็น from_attributes สำหรับ Pydantic v2