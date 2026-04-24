from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Form
from schemas.assignment import Assignment, AssignmentCreate
from schemas.category import Category
from services.AssignmentService import AssignmentManager
from services.CategoryService import CategoryManager
from controllers.authController import get_db, get_current_user_id
from sqlalchemy.orm import Session

router = APIRouter(prefix="/assignment", tags=["Assignments"])

@router.post("/post", response_model=Assignment)
def create_assignment(assignment_data: AssignmentCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = AssignmentManager(db)
    return manager.create_assignment(user_id, assignment_data)

@router.get("/get/tasks/{category_id}", response_model=list[Assignment])
def get_assignments_by_category(category_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = AssignmentManager(db)
    return manager.get_assignments_by_category(category_id)

@router.get("/get/categories/{task_id}", response_model=list[Category], summary="ดึงหมวดหมู่ทั้งหมดของ Assignment")
def get_categories_for_assignment(task_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = AssignmentManager(db)
    assignment = manager.get_assignment_by_id(task_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment.categories

@router.delete("/delete/{task_id}")
def delete_assignment(task_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = AssignmentManager(db)
    return manager.delete_assignment(task_id)

# เอา response_model ออกเพื่อให้คืนค่า Dict ที่มีผลวิเคราะห์ AI รวมอยู่ด้วยได้
@router.post("/upload")
async def upload_assignment_file(
    task_id: str = Form(...), 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    user_id: int = Depends(get_current_user_id)
):
    task_id=int(task_id) # แปลง task_id จาก str เป็น int
    manager = AssignmentManager(db)
    
    assignment = manager.get_assignment_by_id(task_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    file_content = await file.read()
    
    # อัปโหลดไฟล์และบันทึกลง Database
    manager.upload_file(task_id, file_content, file.filename, file.content_type)
    
    # ตรวจสอบว่าใน description มีคำว่า "Gemini" อยู่แล้วหรือไม่
    current_desc = assignment.description or ""
    if "Gemini" in current_desc:
        ai_analysis = "ไฟล์ถูกอัปโหลดเรียบร้อยแล้ว (ข้ามการวิเคราะห์ด้วย AI เนื่องจากเคยมีสรุปแล้ว)"
    else:
        # 2. เรียก AI วิเคราะห์ข้อมูลจากไฟล์ทันที
        ai_analysis = manager.analyze_file_content(file_content, file.content_type)
        # 3. นำผลที่ได้ไปต่อท้าย description ของ Assignment
        manager.append_summary_to_description(task_id, ai_analysis)
    
    return {
        "message": "File uploaded successfully",
        "task_id": task_id,
        "ai_analysis": ai_analysis
    }

@router.get("/download/{task_id}", summary="ดาวน์โหลดไฟล์ของ Assignment")
def download_assignment_file(task_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = AssignmentManager(db)
    assignment = manager.get_assignment_by_id(task_id)
    
    if not assignment or not assignment.file_data:
        raise HTTPException(status_code=404, detail="File not found for this assignment")
        
    return Response(
        content=assignment.file_data, 
        media_type=assignment.file_mimetype, 
        # Content-Disposition: attachment จะทำให้เบราว์เซอร์เด้งหน้าต่าง Save File อัตโนมัติพร้อมชื่อไฟล์เดิม
        headers={"Content-Disposition": f'attachment; filename="{assignment.file_name}"'}
    )