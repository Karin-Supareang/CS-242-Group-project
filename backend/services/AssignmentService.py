import uuid
import os
import google.generativeai as genai
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.assignment import Assignment
from schemas.assignment import AssignmentCreate, AssignmentBase, Assignment as AssignmentSchema # Assuming you'll create these schemas
from models.category import Category # เพื่อตรวจสอบว่า category_id มีอยู่จริง

class AssignmentManager:
    """
    Class สำหรับจัดการ Business Logic และการเข้าถึงข้อมูลของ Assignment
    """
    def __init__(self, db: Session):
        """
        Constructor สำหรับ AssignmentManager
        :param db: SQLAlchemy Session สำหรับการเข้าถึงฐานข้อมูล
        """
        self._db = db

    # Getter method
    def get_assignment_by_id(self, task_id: int, user_id: int) -> Assignment | None:
        """
        ดึงข้อมูล Assignment จาก task_id และตรวจสอบว่าเป็นของ user_id นี้
        """
        return self._db.query(Assignment).join(Assignment.categories).filter(
            Assignment.task_id == task_id,
            Category.user_id == user_id
        ).first()

    # Getter method
    def get_assignments_by_category(self, category_id: int, user_id: int) -> list[Assignment]:
        """
        ดึงรายการ Assignment ทั้งหมดที่อยู่ใน Category ที่ระบุ (ต้องเป็นของ user ด้วย)
        """
        category = self._db.query(Category).filter(
            Category.category_id == category_id,
            Category.user_id == user_id
        ).first()
        if not category:
            return []
        return category.assignments # ใช้ relationship ดึงข้อมูลออกมาได้เลย

    # Business logic method (Create Assignment)
    def create_assignment(self, user_id: int, assignment_data: AssignmentCreate) -> Assignment:
        """
        สร้าง Assignment ใหม่ และเชื่อมกับ Category หลายๆ หมวดหมู่
        """
        # ดึง Category ตาม ID ที่ส่งมา และต้องเป็นของ User คนนี้เท่านั้น
        categories = []
        if assignment_data.category_ids:
            categories = self._db.query(Category).filter(
                Category.category_id.in_(assignment_data.category_ids),
                Category.user_id == user_id
            ).all()
            
            if len(categories) != len(set(assignment_data.category_ids)):
                raise HTTPException(status_code=403, detail="One or more categories not found or not authorized")

        # ถ้าผู้ใช้ไม่ได้เลือกหมวดหมู่มาเลย ให้ค้นหา Category "Later" ของ User คนนี้มาใส่แทน
        if not categories:
            default_category = self._db.query(Category).filter(
                Category.category_name == "Later",
                Category.user_id == user_id
            ).first()
            if default_category:
                categories.append(default_category)

        db_assignment = Assignment(
            title=assignment_data.title,
            description=assignment_data.description,
            deadline=assignment_data.deadline,
            status=assignment_data.status,
            priority=assignment_data.priority,
            estimated_time=assignment_data.estimated_time,
            percentage=assignment_data.percentage,
        )
        db_assignment.categories.extend(categories) # ผูก Many-to-Many
        self._db.add(db_assignment)
        self._db.commit()
        self._db.refresh(db_assignment)
        return db_assignment

    # Business logic method (Append AI Summary)
    def append_summary_to_description(self, task_id: int, user_id: int, summary: str) -> Assignment:
        """
        นำข้อความสรุปจาก AI ไปต่อท้าย Description ของ Assignment
        """
        db_assignment = self.get_assignment_by_id(task_id, user_id)
        if not db_assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
            
        current_desc = db_assignment.description or ""
        # เพิ่มเส้นคั่นให้ดูสวยงามและแยกส่วนชัดเจน
        separator = "\n\n--- สรุปอัตโนมัติจาก AI Gemini ---\n" if current_desc else "--- สรุปอัตโนมัติจาก AI Gemini ---\n"
        db_assignment.description = current_desc + separator + summary
        
        self._db.commit()
        self._db.refresh(db_assignment)
        return db_assignment

    # Business logic method (Analyze File Content with Gemini)
    def analyze_file_content(self, file_content: bytes, file_mimetype: str) -> str:
        """
        ให้ Gemini สรุปข้อกำหนดจากไฟล์ที่เพิ่งอัปโหลด (ทำงานทันทีตอน POST ไฟล์)
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return "ระบบยังไม่ได้ตั้งค่า API Key สำหรับ AI (กรุณาเพิ่ม GEMINI_API_KEY ในไฟล์ .env)"
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        
        try:
            prompt = """ช่วยสรุปข้อกำหนดของงานชิ้นนี้ให้หน่อย ดึงเฉพาะใจความสำคัญ และช่วยประเมินเวลาที่น่าจะใช้ในการทำ (บอกเป็นชั่วโมงหรือวัน) อธิบายแบบสั้นๆ เข้าใจง่าย กฎเหล็ก: ห้ามใช้เครื่องหมาย Markdown เด็ดขาด (ห้ามใช้ตัวหนา ** หรือดอกจัน * หรือ # หรือขีด -) ให้พิมพ์ตอบกลับมาเป็นข้อความธรรมดา (Plain text) ล้วนๆ พิมพ์เว้นวรรคและขึ้นย่อหน้าใหม่ก็พอ ห้ามใส่ \ n ใน text"""
            response = model.generate_content([
                prompt,
                {"mime_type": file_mimetype, "data": file_content}
            ])
            return response.text
        except Exception as e:
            return f"เกิดข้อผิดพลาดในการวิเคราะห์ไฟล์ด้วย AI: {str(e)}"

    # Business logic method (Delete Assignment)
    def delete_assignment(self, task_id: int, user_id: int):
        """
        ลบ Assignment ที่ระบุ
        """
        db_assignment = self.get_assignment_by_id(task_id, user_id)
        if not db_assignment:
            raise HTTPException(status_code=404, detail="Assignment not found or not authorized")
        
        self._db.delete(db_assignment)
        self._db.commit()
        return {"message": "Assignment deleted successfully"}

    # Business logic method (Upload File)
    def upload_file(self, task_id: int, user_id: int, file_content: bytes, file_name: str, file_mimetype: str) -> Assignment:
        """
        อัปโหลดไฟล์แนบสำหรับ Assignment
        """
        db_assignment = self.get_assignment_by_id(task_id, user_id)
        if not db_assignment:
            raise HTTPException(status_code=404, detail="Assignment not found or not authorized")
        
        db_assignment.file_data = file_content
        db_assignment.file_name = file_name
        db_assignment.file_mimetype = file_mimetype
        
        self._db.commit()
        self._db.refresh(db_assignment)
        return db_assignment
