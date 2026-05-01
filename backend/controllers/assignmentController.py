from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Form
from schemas.assignment import Assignment, AssignmentCreate, AssignmentUpdate
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

@router.get("/get/all", response_model=list[Assignment], summary="ดึง Assignment ทั้งหมดของผู้ใช้สำหรับแสดงปฏิทิน")
def get_all_assignments(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = AssignmentManager(db)
    return manager.get_all_assignments_by_user(user_id)

@router.patch("/update/{task_id}", response_model=Assignment)
def update_assignment(task_id: int, update_data: AssignmentUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = AssignmentManager(db)
    return manager.update_assignment(task_id, user_id, update_data)

@router.get("/get/tasks/{category_id}", response_model=list[Assignment])
def get_assignments_by_category(category_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = AssignmentManager(db)
    return manager.get_assignments_by_category(category_id, user_id)

@router.get("/get/categories/{task_id}", response_model=list[Category], summary="ดึงหมวดหมู่ทั้งหมดของ Assignment")
def get_categories_for_assignment(task_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = AssignmentManager(db)
    assignment = manager.get_assignment_by_id(task_id, user_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or not authorized")
    return assignment.categories

@router.delete("/delete/{task_id}")
def delete_assignment(task_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = AssignmentManager(db)
    return manager.delete_assignment(task_id, user_id)

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
    
    assignment = manager.get_assignment_by_id(task_id, user_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or not authorized")
        
    file_content = await file.read()
    
    # อัปโหลดไฟล์และบันทึกลง Database
    manager.upload_file(task_id, user_id, file_content, file.filename, file.content_type)
    
    # ตรวจสอบว่าใน description มีคำว่า "Gemini" อยู่แล้วหรือไม่
    current_desc = assignment.description or ""
    if "Gemini" in current_desc:
        ai_analysis = "ไฟล์ถูกอัปโหลดเรียบร้อยแล้ว (ข้ามการวิเคราะห์ด้วย AI เนื่องจากเคยมีสรุปแล้ว)"
    else:
        # 2. เรียก AI วิเคราะห์ข้อมูลจากไฟล์ทันที
        ai_analysis = manager.analyze_file_content(file_content, file.content_type)
        # 3. นำผลที่ได้ไปต่อท้าย description ของ Assignment
        manager.append_summary_to_description(task_id, user_id, ai_analysis)
        
        # 4. ให้ AI ตั้งชื่อ, ประเมินเวลาทำงาน, และหากำหนดส่งจากไฟล์ แล้วอัปเดตลง Database
        update_fields = {}
        if assignment.estimated_time is None or assignment.estimated_time == 0:
            estimated_time = manager.estimate_time_from_file(file_content, file.content_type)
            if estimated_time is not None:
                update_fields["estimated_time"] = estimated_time
                
        extracted_deadline = manager.extract_deadline_from_file(file_content, file.content_type)
        if extracted_deadline is not None:
            update_fields["deadline"] = extracted_deadline
            
        extracted_title = manager.extract_title_from_file(file_content, file.content_type)
        if extracted_title is not None:
            update_fields["title"] = extracted_title
            
        if update_fields:
            manager.update_assignment(task_id, user_id, AssignmentUpdate(**update_fields))
    
    return {
        "message": "File uploaded successfully",
        "task_id": task_id,
        "ai_analysis": ai_analysis
    }

@router.get("/download/{task_id}", summary="ดาวน์โหลดไฟล์ของ Assignment")
def download_assignment_file(task_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    manager = AssignmentManager(db)
    assignment = manager.get_assignment_by_id(task_id, user_id)
    
    if not assignment or not assignment.file_data:
        raise HTTPException(status_code=404, detail="File not found or not authorized for this assignment")
        
    return Response(
        content=assignment.file_data, 
        media_type=assignment.file_mimetype, 
        # Content-Disposition: attachment จะทำให้เบราว์เซอร์เด้งหน้าต่าง Save File อัตโนมัติพร้อมชื่อไฟล์เดิม
        headers={"Content-Disposition": f'attachment; filename="{assignment.file_name}"'}
    )