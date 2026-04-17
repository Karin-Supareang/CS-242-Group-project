import uuid
from fastapi import HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from typing import Optional # เพิ่มบรรทัดนี้
from models.user import User
from schemas.user import UserCreate, UserLogin, UserBase

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
        return self._db.query(User).filter(User.email == email).first()

    # Getter method
    def get_user_by_username(self, username: str) -> User | None:
        """
        ดึงข้อมูล User จาก username
        """
        return self._db.query(User).filter(User.username == username).first()

    # Getter method
    def get_user_by_id(self, user_id: str) -> User | None:
        """
        ดึงข้อมูล User จาก user_id
        """
        return self._db.query(User).filter(User.user_id == user_id).first()

    # Business logic method (Create User)
    def create_user(self, user_data: UserCreate) -> User:
        """
        สร้าง User ใหม่ในระบบ พร้อมตรวจสอบสถานะ (invalid state)
        """
        if self.get_user_by_email(user_data.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        if self.get_user_by_username(user_data.username):
            raise HTTPException(status_code=400, detail="Username already taken")
        
        hashed_pwd = self._get_password_hash(user_data.password) if user_data.password else None
        
        db_user = User(
            user_id=str(uuid.uuid4()),
            email=user_data.email,
            username=user_data.username, # เพิ่ม username เข้ามา
            name=user_data.name,
            hashed_password=hashed_pwd,
            notification=True # กำหนดค่าเริ่มต้น
        )
        self._db.add(db_user)
        self._db.commit()
        self._db.refresh(db_user)
        return db_user

    # Complex business logic method: อัปเดตโปรไฟล์ผู้ใช้
    def update_user_profile(self, user_id: str, update_data: UserBase) -> User:
        """
        อัปเดตข้อมูลโปรไฟล์ผู้ใช้ พร้อมตรวจสอบสถานะ (invalid state)
        """
        db_user = self.get_user_by_id(user_id)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # ตรวจสอบสถานะ: หากเปลี่ยนอีเมล ต้องไม่ซ้ำกับอีเมลที่มีอยู่แล้วของคนอื่น
        if update_data.email and update_data.email != db_user.email:
            existing_user = self.get_user_by_email(update_data.email)
            if existing_user and existing_user.user_id != user_id:
                raise HTTPException(status_code=400, detail="Email already taken by another user")
        if update_data.username and update_data.username != db_user.username:
            existing_user = self.get_user_by_username(update_data.username)
            if existing_user and existing_user.user_id != user_id:
                raise HTTPException(status_code=400, detail="Username already taken by another user")


        # ใช้ setter (ผ่าน setattr) เพื่ออัปเดตค่า
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(db_user, field, value)
        
        self._db.commit()
        self._db.refresh(db_user)
        return db_user

    # Business logic method: ตรวจสอบการเข้าสู่ระบบ
    def authenticate_user(self, email: Optional[str], username: Optional[str], password: str) -> User | None:
        """
        ตรวจสอบข้อมูลการเข้าสู่ระบบของผู้ใช้
        """
        user = None
        if email:
            user = self.get_user_by_email(email)
        elif username:
            user = self.get_user_by_username(username)

        if not user or not user.hashed_password:
            return None # User ไม่พบ หรือไม่มีรหัสผ่าน (เช่น ล็อกอินด้วย Google)
        if not self._verify_password(password, user.hashed_password):
            return None # รหัสผ่านไม่ตรงกัน
        return user