from fastapi import HTTPException
from passlib.context import CryptContext
from typing import Optional
from models.user import User
from schemas.user import UserBase, UserUpdate
from models.category import Category
from sqlalchemy.orm import Session
from sqlalchemy import func

class UserManager:
    """
    Class สำหรับจัดการ Business Logic และการเข้าถึงข้อมูลของ User
    """
    def __init__(self, db: Session):
        """
        Constructor สำหรับ UserManager
        :param db: SQLAlchemy Session สำหรับการเข้าถึงฐานข้อมูล
        """
        self._db = db  # Encapsulation: ใช้ _db เป็น internal attribute
        self._pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") # Internal attribute

    def _get_password_hash(self, password: str) -> str:
        """
        Method ภายในสำหรับแฮชรหัสผ่าน
        """
        return self._pwd_context.hash(password)

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Method ภายในสำหรับตรวจสอบรหัสผ่าน
        """
        return self._pwd_context.verify(plain_password, hashed_password)

    # Getter method
    def get_user_by_email(self, email: str) -> User | None:
        """
        ดึงข้อมูล User จากอีเมล
        """
        return self._db.query(User).filter(func.lower(User.email) == email.lower()).first()

    # Getter method
    def get_user_by_username(self, username: str) -> User | None:
        """
        ดึงข้อมูล User จาก username
        """
        if not username:
            return None
        return self._db.query(User).filter(func.lower(User.username) == username.lower()).first()

    # Getter method
    def get_user_by_id(self, user_id: int) -> User | None:
        """
        ดึงข้อมูล User จาก user_id
        """
        return self._db.query(User).filter(User.user_id == user_id).first()

    # Business logic method (Create User)
    def create_user(self, user_data: UserBase) -> User: # เปลี่ยน Type Hint เป็น UserBase
        """
        สร้าง User ใหม่ในระบบ พร้อมตรวจสอบสถานะ (invalid state)
        """
        if self.get_user_by_email(user_data.email):
            raise HTTPException(status_code=400, detail="Email already registered")

        # กำหนดค่า username: ถ้าไม่ได้กรอกมา ให้ดึงคำหน้า @ จากอีเมล
        final_username = user_data.username if user_data.username else user_data.email.split('@')[0]
        
        # ตรวจสอบความซ้ำซ้อนในฐานข้อมูล
        original_username = final_username
        counter = 1
        while self.get_user_by_username(final_username):
            if user_data.username: # ถ้าผู้ใช้เจาะจงพิมพ์มาเองแล้วซ้ำ ให้แจ้ง Error แบบปกติ
                raise HTTPException(status_code=400, detail="Username already taken")
            # ถ้าเป็นระบบ Auto-generate แล้วซ้ำ ให้รันตัวเลขต่อท้ายไปเรื่อยๆ (เช่น test1, test2)
            final_username = f"{original_username}{counter}"
            counter += 1
        
        hashed_pwd = None
        # ตรวจสอบว่า user_data มี password attribute หรือไม่ (สำหรับ Standard Signup)
        if hasattr(user_data, 'password') and user_data.password:
            hashed_pwd = self._get_password_hash(user_data.password)
        
        db_user = User(
            email=user_data.email.lower(),
            username=final_username.lower(),
            name=user_data.name,
            hashed_password=hashed_pwd,
            notification=True # กำหนดค่าเริ่มต้น
        )
        self._db.add(db_user)
        self._db.commit()
        self._db.refresh(db_user)
        
        # สร้าง Category เริ่มต้น 3 หมวดหมู่ (ทำงานทันทีที่สร้างบัญชีสำเร็จ รวมถึงการล็อกอินผ่าน Google ครั้งแรกด้วย)
        default_categories = [
            Category(category_name="Urgent", color_code="#FF5733", user_id=db_user.user_id),
            Category(category_name="Soon", color_code="#FFC300", user_id=db_user.user_id),
            Category(category_name="Later", color_code="#33AFFF", user_id=db_user.user_id)
        ]
        self._db.add_all(default_categories)
        self._db.commit()
        
        return db_user

    # Business logic method: ตรวจสอบการเข้าสู่ระบบ
    def authenticate_user(self, email: Optional[str], username: Optional[str], password: str) -> User | None:
        """
        ตรวจสอบข้อมูลการเข้าสู่ระบบของผู้ใช้
        """
        user = None
        if email:
            user = self.get_user_by_email(email)
        if not user and username:
            user = self.get_user_by_username(username)

        if not user or not user.hashed_password:
            return None # User ไม่พบ หรือไม่มีรหัสผ่าน (เช่น ล็อกอินด้วย Google)
        if not self._verify_password(password, user.hashed_password):
            return None # รหัสผ่านไม่ตรงกัน
        return user

    # Business logic method (Update User)
    def update_user(self, user_id: int, update_data: UserUpdate) -> User | None:
        """
        อัปเดตข้อมูล User (ชื่อ และ Username)
        """
        db_user = self.get_user_by_id(user_id)
        if not db_user:
            return None
        
        if update_data.username is not None and update_data.username.lower() != (db_user.username.lower() if db_user.username else ""):
            if self.get_user_by_username(update_data.username):
                raise HTTPException(status_code=400, detail="Username already taken")
            db_user.username = update_data.username.lower()
            
        if update_data.name is not None:
            db_user.name = update_data.name
            
        self._db.commit()
        self._db.refresh(db_user)
        return db_user
