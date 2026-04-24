from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    category_name: str
    color_code: str = "#808080" # กำหนดค่า Default ที่นี่

class CategoryCreate(CategoryBase):
    class Config:
        json_schema_extra = {
            "example": {
                "category_name": "โปรเจกต์จบ",
                "color_code": "#FF5733"
            }
        }

class Category(CategoryBase):
    category_id: int
    user_id: int
    # assignments: list[Assignment] # Optional: ถ้าต้องการ embed assignments ใน category response
    
    class Config:
        # อนุญาตให้ Pydantic อ่านข้อมูลจาก ORM model ได้โดยตรง
        from_attributes = True # เปลี่ยน orm_mode เป็น from_attributes สำหรับ Pydantic v2