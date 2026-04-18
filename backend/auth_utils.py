import os
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import HTTPException, status # เพิ่ม HTTPException และ status
from schemas.token import TokenData # นำเข้า TokenData จากไฟล์ที่เราเพิ่งสร้าง

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256" # ไม่ได้เปลี่ยน
ACCESS_TOKEN_EXPIRE_MINUTES = 120 # เปลี่ยนจาก 30 เป็น 120 นาที (2 ชั่วโมง)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, credentials_exception: HTTPException) -> TokenData: # เพิ่ม Type Hint
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    return token_data