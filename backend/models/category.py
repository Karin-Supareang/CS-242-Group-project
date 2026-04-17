from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Category(Base):
    __tablename__ = "categories"

    category_id = Column(String, primary_key=True, index=True)
    categoryName = Column(String)
    colorCode = Column(String)
    user_id = Column(String, ForeignKey("users.user_id"))

    # ความสัมพันธ์: Category นี้เป็นของ User คนไหน
    user = relationship("User", back_populates="categories")
    # ความสัมพันธ์: 1 Category มีได้หลาย Assignment
    assignments = relationship("Assignment", back_populates="category")