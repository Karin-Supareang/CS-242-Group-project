from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: datetime
    status: str
    priority: int

class AssignmentCreate(AssignmentBase):
    pass

class Assignment(AssignmentBase):
    task_id: int
    category_id: int

    class Config:
        # อนุญาตให้ Pydantic อ่านข้อมูลจาก ORM model ได้โดยตรง
        from_attributes = True # เปลี่ยน orm_mode เป็น from_attributes สำหรับ Pydantic v2