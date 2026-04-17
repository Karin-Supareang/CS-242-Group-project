from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    categoryName: str
    colorCode: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    category_id: str
    user_id: str
    # assignments: list[Assignment] # Optional: ถ้าต้องการ embed assignments ใน category response
    
    class Config:
        # อนุญาตให้ Pydantic อ่านข้อมูลจาก ORM model ได้โดยตรง
        orm_mode = True