FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกโค้ดทั้งหมดจากเครื่องของคุณไปยัง /app ใน Container
COPY . .
# ตั้งค่า PYTHONPATH เพื่อให้ Python หาโมดูลภายในโปรเจกต์เจอ
ENV PYTHONPATH "${PYTHONPATH}:/app"
# Render จะส่ง Environment Variable ชื่อ PORT มาให้ (ค่าเริ่มต้นมักเป็น 10000)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]