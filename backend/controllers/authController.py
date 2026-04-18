import os
from fastapi import APIRouter, Request, HTTPException, Depends, status # เพิ่ม status
import uuid # Added for fallback username generation
from fastapi.security import OAuth2PasswordBearer # เปลี่ยนเป็น OAuth2PasswordBearer

from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from database import SessionLocal
from services.UserService import UserManager # Import the UserManager class
# ดึง Schema จากโฟลเดอร์ schemas
from schemas.user import UserCreate, UserLogin, User, UserBase # เพิ่ม UserBase
from schemas.token import Token # เพิ่มการ import Token schema
from auth_utils import create_access_token, verify_token # เพิ่มการ import ฟังก์ชันสร้าง JWT และ verify_token

router = APIRouter(tags=["Authentication"])

# Dependency สำหรับดึง Database Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency Injection สำหรับ UserManager
def get_user_manager(db: Session = Depends(get_db)) -> UserManager:
    """
    สร้างและส่งคืน UserManager instance
    """
    return UserManager(db)

# OAuth2PasswordBearer สำหรับการดึง Token จาก Header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/login") # ชี้ไปที่ endpoint สำหรับ login

# Dependency สำหรับดึงข้อมูลผู้ใช้ปัจจุบันจาก Token
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_manager: UserManager = Depends(get_user_manager)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = verify_token(token, credentials_exception)
    user = user_manager.get_user_by_id(int(token_data.user_id)) # user_id เป็น int แล้ว
    if user is None:
        raise credentials_exception
    return user

# ตั้งค่าระบบ OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

@router.post("/signup", response_model=User, summary="ลงทะเบียนผู้ใช้ใหม่")
def signup_standard(user_data: UserCreate, user_manager: UserManager = Depends(get_user_manager)):
    # การสมัครแบบปกติ บังคับว่าต้องส่งรหัสผ่าน
    if not user_data.password:
        raise HTTPException(status_code=400, detail="Password is required")
        
    if user_data.password != user_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    return user_manager.create_user(user_data)

@router.post("/login", response_model=Token, summary="เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน")
def login_standard(user_data: UserLogin, user_manager: UserManager = Depends(get_user_manager)):
    db_user = user_manager.authenticate_user(email=user_data.email, username=user_data.username, password=user_data.password)
    # ตรวจสอบว่าบัญชีมีอยู่จริง และมีรหัสผ่าน (กันคนใช้ Google Login มาล็อกอินแบบปกติ)
    if not db_user: # authenticate_user จะจัดการเรื่อง user/password ไม่ตรงกันแล้ว
        raise HTTPException(status_code=400, detail="No user found or Invalid credentials")
        
    # สร้าง JWT Token
    access_token = create_access_token(data={"sub": str(db_user.user_id)}) # Convert user_id to string for JWT sub claim
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=User, summary="ดึงข้อมูลผู้ใช้ปัจจุบัน (Protected Route)")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่กำลังล็อกอินอยู่"""
    return current_user

@router.get("/login/google", summary="เริ่มกระบวนการเข้าสู่ระบบด้วย Google") # ไม่ต้องเปลี่ยน response_model ตรงนี้ เพราะมันจะ redirect
async def login_via_google(request: Request):
    # สร้าง URL ปลายทางที่ Google จะส่งกลับมาเมื่อ Login สำเร็จ
    redirect_uri = request.url_for('auth_google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback", response_model=Token, summary="Callback URL สำหรับ Google Login")
async def auth_google_callback(request: Request, user_manager: UserManager = Depends(get_user_manager)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")
    
    user_info = token.get('userinfo')
    if not user_info:
        raise HTTPException(status_code=400, detail="Could not get user info")
    
    # Auto-Signup: เช็คว่ามี user หรือยัง ถ้ายังให้สร้างทันที (ไม่มีรหัสผ่าน)
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google user info did not provide an email.")

    db_user = user_manager.get_user_by_email(email)
    if not db_user:
        # ใช้ email เต็มๆ เป็น username สำหรับ Google Login
        # เนื่องจาก email เป็น unique อยู่แล้ว username ก็จะ unique ด้วย
        generated_username = email
        new_user = UserBase(email=email, username=generated_username, name=user_info.get("name")) # ใช้ UserBase แทน UserCreate
        db_user = user_manager.create_user(new_user)
        
    # สร้าง JWT Token
    access_token = create_access_token(data={"sub": str(db_user.user_id)}) # Convert user_id to string for JWT sub claim
    return {"access_token": access_token, "token_type": "bearer"}
