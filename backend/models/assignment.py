from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Table, LargeBinary
from sqlalchemy.orm import relationship
from database import Base

# Association Table สำหรับความสัมพันธ์ Many-to-Many
assignment_category = Table(
    "assignment_category",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("assignment.task_id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("category.category_id", ondelete="CASCADE"), primary_key=True)
)

class Assignment(Base):
    __tablename__ = "assignment" # เปลี่ยนเป็นเอกพจน์

    task_id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime)
    status = Column(String)
    priority = Column(Integer, nullable=True) # อนุญาตให้เป็นค่าว่าง (None) ได้
    estimated_time = Column(Integer, nullable=True)
    percentage = Column(Integer, default=0)
    file_data = Column(LargeBinary, nullable=True) # ใช้ LargeBinary สำหรับ BYTEA
    file_name = Column(String, nullable=True)
    file_mimetype = Column(String, nullable=True)
    
    # ความสัมพันธ์ Many-to-Many ไปยัง Category (ผูกผ่าน Table เชื่อม)
    categories = relationship("Category", secondary=assignment_category, back_populates="assignments")