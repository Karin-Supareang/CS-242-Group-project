import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from controllers.authController import get_db, get_current_user_id
from services.UserService import UserManager
from services.EmailService import EmailManager

router = APIRouter(prefix="/notify", tags=["Notifications"])

@router.post("/test-email", summary="ทดสอบส่งอีเมลแจ้งเตือน")
async def test_email_notification(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    user_manager = UserManager(db)
    user = user_manager.get_user_by_id(user_id)
    
    if not user or not user.email:
        raise HTTPException(status_code=400, detail="User or email not found")
        
    email_manager = EmailManager()
    subject = "ทดสอบระบบแจ้งเตือน Smart Academic Plan"
    display_name = user.name or user.username or user.email.split('@')[0]
    body = f"สวัสดีคุณ {display_name},\n\nอีเมลฉบับนี้ส่งจากระบบ Smart Academic Plan เพื่อทดสอบการรับการแจ้งเตือนทางอีเมลครับ!"
    
    await email_manager.send_email(user.email, subject, body)
    return {"message": f"Test email sent to {user.email} successfully"}
