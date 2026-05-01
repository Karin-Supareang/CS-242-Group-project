import os
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Depends, status # เพิ่ม status
from fastapi.responses import RedirectResponse # เพิ่มการ import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from authlib.integrations.starlette_client import OAuth
from database import SessionLocal
from services.UserService import UserManager # Import the UserManager class
# ดึง Schema จากโฟลเดอร์ schemas
from schemas.user import UserCreate, UserLogin, User, UserBase, UserSignupResponse, UserUpdate
from schemas.token import Token # เพิ่มการ import Token schema
from auth_utils import create_access_token, verify_token # เพิ่มการ import ฟังก์ชันสร้าง JWT และ verify_token
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Authentication"])
# ปิด auto_error=False เพื่อให้ระบบไม่เด้ง Error ทันทีถ้าไม่มี Header (จะได้ไปหาใน Cookie ต่อ)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)
# Dependency ตัวใหม่สำหรับดึง Token (รองรับทั้ง Header จาก LocalStorage และ Cookie)
def get_token_from_header_or_cookie(
    request: Request
):
    # 1. ลองเช็กจาก Header ตรงๆ เองเลย
    auth_header = request.headers.get("Authorization")
    token_from_header = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token_from_header = auth_header.split(" ")[1]
    
    if token_from_header:
        return token_from_header
        
    # 2. ถ้า Header ไม่มี ลองเช็กจาก Cookie
    token_from_cookie = request.cookies.get("access_token")
    if token_from_cookie:
        return token_from_cookie
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Please provide token in Header or Cookie.",
        headers={"WWW-Authenticate": "Bearer"},
    )

# Dependency สำหรับตรวจสอบและดึง User ID ปัจจุบันจาก Token
def get_current_user_id(token: str = Depends(get_token_from_header_or_cookie)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = verify_token(token, credentials_exception)
    return int(token_data.user_id)

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



@router.post("/signup", response_model=UserSignupResponse, summary="ลงทะเบียนผู้ใช้ใหม่")
def signup_standard(user_data: UserCreate, user_manager: UserManager = Depends(get_user_manager)):
    # การสมัครแบบปกติ บังคับว่าต้องส่งรหัสผ่าน
    if not user_data.password:
        raise HTTPException(status_code=400, detail="Password is required")
        
    if user_data.password != user_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    new_user = user_manager.create_user(user_data)
    
    # ดึงชื่อ Category ทั้งหมดที่เพิ่งถูกสร้างขึ้นมาให้ User คนนี้
    category_names = [category.category_name for category in new_user.categories]
    return {
        "message": "User created successfully",
        "user": new_user,
        "categories": category_names
    }

@router.post("/login", response_model=Token, summary="เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน")
def login_standard(user_data: UserLogin, user_manager: UserManager = Depends(get_user_manager)):
    db_user = user_manager.authenticate_user(email=user_data.email, username=user_data.username, password=user_data.password)
    # ตรวจสอบว่าบัญชีมีอยู่จริง และมีรหัสผ่าน (กันคนใช้ Google Login มาล็อกอินแบบปกติ)
    if not db_user: # authenticate_user จะจัดการเรื่อง user/password ไม่ตรงกันแล้ว
        raise HTTPException(status_code=400, detail="No user found or Invalid credentials")
        
    # สร้าง JWT Token
    access_token = create_access_token(data={"sub": str(db_user.user_id)}) # Convert user_id to string for JWT sub claim
    return {"access_token": access_token, "token_type": "bearer"}

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

@router.get("/login/google", summary="เข้าสู่ระบบด้วย Google (ปกติ)")
async def login_via_google(request: Request):
    redirect_uri = request.url_for('auth_google_callback')
    # ล็อกอินปกติไม่ต้องขอ offline token และไม่ต้องขอ consent ซ้ำ
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback", summary="Callback URL สำหรับ Google Login") # เอา response_model ออกเพราะเราจะ Redirect
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
        # ปล่อยให้ UserService จัดการสร้าง username อัตโนมัติจากคำหน้า @ ของ email
        new_user = UserBase(email=email, name=user_info.get("name")) 
        db_user = user_manager.create_user(new_user)

    # สร้าง JWT Token
    access_token = create_access_token(data={"sub": str(db_user.user_id)}) # Convert user_id to string for JWT sub claim
    
    # ดึง URL ของ Frontend จาก .env (ถ้าไม่มีให้ใช้ default เป็น http://localhost:3000)
    frontend_url = os.getenv("GOOGLE_CALLBACK_FRONTEND_URL", "http://localhost:3000")
    
    # ส่งกลับไปยังหน้า Frontend พร้อมแนบ Token ไปใน URL 
    # เช่น http://localhost:3000/login/success?token=eyJhbGciOiJIUz...
    redirect_url = f"{frontend_url}?token={access_token}"
    
    # สร้าง Response สำหรับการเปลี่ยนหน้า
    response = RedirectResponse(url=redirect_url)
    
    # ทำอย่างที่ 2 ไปพร้อมกัน: ฝัง Token ลงใน Cookie ของเบราว์เซอร์
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=7200, # อายุคุกกี้ 2 ชั่วโมง (7200 วินาที)
        httponly=False # ตั้งเป็น False เพื่อให้ Frontend (JavaScript) สามารถเข้าถึงคุกกี้นี้ได้ด้วย
    )
    
    return response

@router.get("/me", response_model=User, summary="ดึงข้อมูลผู้ใช้ปัจจุบัน (Protected Route)")
async def read_users_me(
    user_id: int = Depends(get_current_user_id),
    user_manager: UserManager = Depends(get_user_manager)
):
    """ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่กำลังล็อกอินอยู่"""
    user = user_manager.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
    
@router.patch("/me", response_model=User, summary="อัปเดตข้อมูลผู้ใช้ปัจจุบัน")
async def update_users_me(
    update_data: UserUpdate,
    user_id: int = Depends(get_current_user_id),
    user_manager: UserManager = Depends(get_user_manager)
):
    """อัปเดตโปรไฟล์ของผู้ใช้ที่กำลังล็อกอินอยู่"""
    updated_user = user_manager.update_user(user_id, update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.delete("/me", summary="ลบบัญชีผู้ใช้ปัจจุบัน")
async def delete_current_user(
    user_id: int = Depends(get_current_user_id),
    user_manager: UserManager = Depends(get_user_manager)
):
    """ลบบัญชีผู้ใช้ที่กำลังล็อกอินอยู่"""
    success = user_manager.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "ลบบัญชีผู้ใช้เรียบร้อยแล้ว"}
