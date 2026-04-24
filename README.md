# CS-242-Group-project

pip install -r requirements.txt

docker-compose up --build
docker-compose down

docker-compose down -v

# 1. หยุดและลบ Container, Network, และ Volume ทั้งหมดของโปรเจกต์นี้
docker-compose down -v

# 2. ลบ Image ของโปรเจกต์ (web service) ที่อาจมีแคชเก่า
docker rmi backend-web --force

# 3. ลบ Image ของ postgres (ถ้าต้องการให้ดาวน์โหลดใหม่ทั้งหมด)
#    (ขั้นตอนนี้อาจไม่จำเป็นเสมอไป แต่ช่วยให้แน่ใจว่าไม่มีปัญหาจาก Image เก่า)
docker rmi postgres:15-alpine --force

docker-compose up --build --force-recreate
