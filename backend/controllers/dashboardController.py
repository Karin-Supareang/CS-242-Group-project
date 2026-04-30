from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from controllers.authController import get_db # เพื่อนคุณประกาศไว้ในนี้
from services.DashboardService import DashboardService

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/status")
def get_status_summary(db: Session = Depends(get_db)):
    # ส่ง db session เข้าไปให้ Service ทำงาน
    result = DashboardService.get_task_status_summary(db)
    return {"data": result}