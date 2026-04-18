from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Assignment(Base):
    __tablename__ = "assignment" # เปลี่ยนเป็นเอกพจน์

    task_id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime)
    status = Column(String)
    priority = Column(Integer)
    category_id = Column(Integer, ForeignKey("category.category_id")) # อ้างอิงตาราง category

    # ความสัมพันธ์: Assignment นี้อยู่ใน Category ไหน
    category = relationship("Category", back_populates="assignments")