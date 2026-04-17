import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# อ่านค่า DATABASE_URL จาก Environment Variable ถ้าไม่มีให้ใช้ค่า Local
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
