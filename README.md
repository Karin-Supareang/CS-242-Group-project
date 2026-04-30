# 🚀 Smart Academic Planner Integration Guide

โปรเจกต์นี้เป็นการรวมร่างระหว่าง Frontend (Vanilla JS) และ Backend (FastAPI) โดยมีการเชื่อมต่อข้อมูลผ่าน REST API และใช้ JWT ในการยืนยันตัวตน

## ขั้นตอนการ Setup (Backend)

1. **เตรียม Environment:**
   ```bash
   cd backend
   python -m venv .venv
   ```

   Next, activate the virtual environment. The command depends on your operating system and terminal:
   - **On macOS/Linux (bash/zsh):**
     ```bash
     source .venv/bin/activate
     ```
   - **On Windows (Command Prompt):**
     ```cmd
     .venv\Scripts\activate
     ```
   - **On Windows (PowerShell):**
     ```powershell
     .venv\Scripts\Activate.ps1
     ```

   Finally, install the required packages:
   ```bash
   python -m pip install -r requirements.txt
   ```

2. **ตั้งค่า Environment Variables:**
   - ก๊อปปี้ไฟล์ `.env.example` เป็น `.env`
   - คัดลอกเนื้อหาในดิสคอร์ดมาใส่ใน .env
   - แก้ไข `DATABASE_URL` ให้ตรงกับที่ใช้ (ใช้ `localhost` แทน `db` หากรันนอก Docker)

3. **เปิดใช้งาน Database (Docker):**
   - ตรวจสอบให้มั่นใจว่ารัน Docker Desktop อยู่
   ```bash
   docker-compose up -d db
   ```
   *หมายเหตุ: ระบบจะรัน `init.sql` อัตโนมัติในครั้งแรกเพื่อสร้างข้อมูลทดสอบ*

4. **รันเซิร์ฟเวอร์:**
   ```bash
   uvicorn main:app --reload --port 8080
   ```

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
