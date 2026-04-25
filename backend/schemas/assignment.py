from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: datetime
    status: str
    priority: int
    estimated_time: Optional[int] = None
    percentage: Optional[int] = 0

class AssignmentCreate(AssignmentBase):
    category_ids: list[int] = [] # เปลี่ยนให้รับค่าเริ่มต้นเป็น list ว่าง (ไม่ต้องบังคับส่ง)
    class Config:
        json_schema_extra = {
            "example": {
                "title": "เขียน API ด้วย FastAPI",
                "description": "ทำให้เสร็จและทดสอบด้วย Swagger UI",
                "deadline": "2024-05-31T23:59:59.000Z",
                "status": "pending",
                "priority": 1,
                "estimated_time": 120,
                "percentage": 0,
                "category_ids": [1, 2]
            }
        }

class Assignment(AssignmentBase):
    task_id: int

    class Config:
        # อนุญาตให้ Pydantic อ่านข้อมูลจาก ORM model ได้โดยตรง
        from_attributes = True # เปลี่ยน orm_mode เป็น from_attributes สำหรับ Pydantic v2