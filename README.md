# 🚀 Smart Academic Planner Integration Guide

โปรเจกต์นี้เป็นการรวมร่างระหว่าง Frontend (Vanilla JS) และ Backend (FastAPI) โดยมีการเชื่อมต่อข้อมูลผ่าน REST API และใช้ JWT ในการยืนยันตัวตน

## ขั้นตอนการ Setup (Backend)

1. **เข้าไปที่โฟลเดอร์ Backend:**
   ```bash
   cd backend
   ```

2. **ตั้งค่า Environment Variables:**
   - ก๊อปปี้ไฟล์ `.env.example` เป็น `.env`
   - คัดลอกเนื้อหาในดิสคอร์ดมาใส่ใน .env

3. **รันระบบทั้งหมดด้วย Docker:**
   - ตรวจสอบให้มั่นใจว่าเปิดโปรแกรม Docker Desktop ไว้แล้ว
   - รันคำสั่งนี้เพื่อเคลียร์ข้อมูลเก่า (ลบ volume ฐานข้อมูลเดิม) และสร้างคอนเทนเนอร์ใหม่ทั้งหมด:
   ```bash
   docker-compose down -v && docker-compose up --build
   ```
   *หมายเหตุ: ระบบจะรัน `init.sql` อัตโนมัติในครั้งแรกเพื่อสร้างข้อมูลทดสอบ*

## ขั้นตอนการ Setup (Frontend)

เนื่องจาก Frontend ใช้ ES Modules และมีการดึงข้อมูลผ่าน API (Fetch) จึงต้องรันผ่าน Web Server เท่านั้น:
```bash
cd mainpage
python3 -m http.server 3000
```
เข้าใช้งานที่: [http://localhost:3000](http://localhost:3000)



## วิธีรับ JWT Token สำหรับทดสอบ (Manual Auth)
ในระหว่างที่ระบบ Login หน้าเว็บยังไม่สมบูรณ์ สามารถใช้ Token ทดสอบได้ดังนี้:
1. เข้าไปที่ [http://localhost:8080/docs](http://localhost:8080/docs)
2. ใช้เมนู `POST /auth/login` 
   - Body: `{"username": "adminuser", "password": "password"}`
3. ก๊อปปี้ค่าจาก `access_token` ใน Response
4. กลับมาที่หน้าเว็บ Dashboard (localhost:3000)
5. เปิด Developer Tools (F12) -> Console
6. พิมพ์คำสั่ง: `localStorage.setItem('token', 'ก๊อปค่ามาวางตรงนี้');`
7. กด `location.reload();` เพื่อดูผลลัพธ์ข้อมูลจริงจาก Database

---
