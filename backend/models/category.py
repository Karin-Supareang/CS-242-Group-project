from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Category(Base):
    __tablename__ = "category" # เปลี่ยนเป็นเอกพจน์

    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String, nullable=False)
    color_code = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("user.user_id"))

    # ความสัมพันธ์: 1 Category เป็นของ 1 User
    user = relationship("User", back_populates="categories")
    # ความสัมพันธ์: 1 Category มีได้หลาย Assignment
    assignments = relationship("Assignment", back_populates="category")