from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    category_name: str # เปลี่ยนเป็น snake_case
    color_code: str # เปลี่ยนเป็น snake_case

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    category_id: int
    user_id: int
    # assignments: list[Assignment] # Optional: ถ้าต้องการ embed assignments ใน category response
    
    class Config:
        # อนุญาตให้ Pydantic อ่านข้อมูลจาก ORM model ได้โดยตรง
        from_attributes = True # เปลี่ยน orm_mode เป็น from_attributes สำหรับ Pydantic v2