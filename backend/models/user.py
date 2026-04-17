from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    name = Column(String)
    notification = Column(Boolean, default=True)

    # ความสัมพันธ์: 1 User มีได้หลาย Category
    categories = relationship("Category", back_populates="user")
