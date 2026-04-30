# 🚀 Smart Academic Planner Integration Guide

โปรเจกต์นี้เป็นการรวมร่างระหว่าง Frontend (Vanilla JS) และ Backend (FastAPI) โดยมีการเชื่อมต่อข้อมูลผ่าน REST API และใช้ JWT ในการยืนยันตัวตน

## ขั้นตอนการ Setup (Backend)

1. **เตรียม Environment:**
   เข้าไปที่โฟลเดอร์ `backend`:
   ```bash
   cd backend
   ```

   สร้าง Virtual Environment:
   ```bash
   python -m venv .venv
   ```
   > **⚠️ หากเจอข้อผิดพลาด `Permission denied` หรือคำสั่ง Activate ใช้ไม่ได้:**
   > 1. **ลองปิด Terminal แล้วเปิดใหม่แบบ "Run as Administrator"** นี่เป็นวิธีแก้ที่ได้ผลบ่อยที่สุด
   > 2. หากยังไม่ได้ผล อาจเป็นเพราะมี virtual environment เก่าที่ทำงานอยู่ ให้พิมพ์ `deactivate` แล้วลบโฟลเดอร์ `.venv` ทิ้ง (Mac/Linux ใช้ `rm -rf .venv`, PowerShell ใช้ `Remove-Item .venv -Recurse -Force`, CMD ใช้ `rmdir /s /q .venv`) แล้วลองสร้างใหม่อีกครั้ง

   จากนั้น เปิดใช้งาน (Activate) Virtual Environment โดยคำสั่งจะขึ้นอยู่กับระบบปฏิบัติการและเทอร์มินัลที่คุณใช้:
   - **สำหรับ macOS/Linux (bash/zsh):**
     ```bash
     source .venv/bin/activate
     ```
   - **สำหรับ Windows (Command Prompt):**
     ```cmd
     .venv\Scripts\activate
     ```
   - **สำหรับ Windows (PowerShell):**
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **สำหรับ Windows (Git Bash / MINGW64):**
     ```bash
     source .venv/Scripts/activate
     ```

   สุดท้าย ติดตั้งแพ็กเกจที่จำเป็น:
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
