from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: datetime
    status: str
    priority: Optional[int] = 1
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

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    estimated_time: Optional[int] = None
    percentage: Optional[int] = None
    category_ids: Optional[list[int]] = None

class CategorySimple(BaseModel):
    category_id: int
    category_name: str
    color_code: Optional[str] = None
    class Config:
        from_attributes = True

class Assignment(AssignmentBase):
    task_id: int
    categories: List[CategorySimple] = [] # ระบุ Schema ให้ชัดเจนแทน Any
    file_name: Optional[str] = None 

    class Config:
        from_attributes = True