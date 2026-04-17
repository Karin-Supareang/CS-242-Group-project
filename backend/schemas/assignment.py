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
    task_id: str
    category_id: str

    class Config:
        # อนุญาตให้ Pydantic อ่านข้อมูลจาก ORM model ได้โดยตรง
        orm_mode = True