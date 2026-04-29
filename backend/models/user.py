from sqlalchemy import Column, String, Boolean, Integer
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "user" # เปลี่ยนเป็นเอกพจน์

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    name = Column(String)
    notification = Column(Boolean, default=True)
    google_access_token = Column(String, nullable=True)
    google_refresh_token = Column(String, nullable=True)

    # ความสัมพันธ์: 1 User มีได้หลาย Category
    categories = relationship("Category", back_populates="user")
