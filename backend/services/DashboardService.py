import pandas as pd
from sqlalchemy.orm import Session
from models.assignment import Assignment #

class DashboardService:
    @staticmethod
    def get_task_status_summary(db: Session):
        # ดึงข้อมูลจาก DB ผ่าน Session ที่ส่งมาจาก Controller
        tasks = db.query(Assignment).all()
        
        task_data = [{"task_id": t.task_id, "status": t.status} for t in tasks]
        df = pd.DataFrame(task_data)
        
        if df.empty:
            return {"Pending": 0, "In Progress": 0, "Done": 0}

        # ใช้ Pandas สรุปผล
        status_counts = df.groupby('status').size().to_dict()
        return status_counts