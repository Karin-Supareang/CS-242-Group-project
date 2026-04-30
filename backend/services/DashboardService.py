import pandas as pd
from sqlalchemy.orm import Session
# หมายเหตุ: แก้ไขการ import 'Assignment' ให้ตรงกับชื่อคลาสในไฟล์ models ของคุณ
from models.assignment import Assignment

class DashboardService:
    @staticmethod
    def get_task_status_summary(db: Session):
        # 1. ดึงข้อมูลงานทั้งหมดจากฐานข้อมูล
        tasks = db.query(Assignment).all()
        
        # 2. แปลงข้อมูลเป็น Dictionary เพื่อเตรียมเข้า Pandas
        task_data = [{"task_id": t.task_id, "status": t.status} for t in tasks]
        
        # 3. โยนข้อมูลเข้า Pandas DataFrame
        df = pd.DataFrame(task_data)
        
        # ถ้า Database ว่างเปล่า ให้ส่งค่า 0 กลับไปก่อน
        if df.empty:
            return {"Pending": 0, "In Progress": 0, "Done": 0}

        # 4. พระเอกของเรา: ใช้ Pandas จัดกลุ่ม (Groupby) และนับจำนวน (size) ตามสถานะ
        status_counts = df.groupby('status').size().to_dict()
        
        return status_counts