from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Assignment(Base):
    __tablename__ = "assignments"

    task_id = Column(String, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime)
    status = Column(String)
    priority = Column(Integer)
    category_id = Column(String, ForeignKey("categories.category_id"))

    # ความสัมพันธ์: Assignment นี้อยู่ใน Category ไหน
    category = relationship("Category", back_populates="assignments")