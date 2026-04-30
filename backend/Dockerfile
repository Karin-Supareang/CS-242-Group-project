FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกโค้ดทั้งหมดจากเครื่องของคุณไปยัง /app ใน Container
COPY . .
# ตั้งค่า PYTHONPATH เพื่อให้ Python หาโมดูลภายในโปรเจกต์เจอ
ENV PYTHONPATH "${PYTHONPATH}:/app"
# ใช้ตัวแปร BACKEND_PORT จาก .env (ถ้าไม่มีจะใช้ 8080 เป็นค่าเริ่มต้น)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${BACKEND_PORT:-8080}"]