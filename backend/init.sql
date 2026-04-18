-- 1. ลบตารางเก่า (เรียงลำดับตามความสัมพันธ์ FK)
DROP TABLE IF EXISTS assignment;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS "user"; 

-- 2. สร้างตาราง user
CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY, -- เปลี่ยนเป็น SERIAL PRIMARY KEY เพื่อให้ auto-increment
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    name VARCHAR,
    hashed_password VARCHAR,
    notification BOOLEAN DEFAULT TRUE
);
-- 3. สร้างตาราง category
CREATE TABLE category (
    category_id SERIAL PRIMARY KEY, -- เปลี่ยนเป็น SERIAL PRIMARY KEY
    category_name VARCHAR NOT NULL,
    color_code VARCHAR,
    user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE -- เปลี่ยนเป็น INTEGER
);
-- 4. สร้างตาราง assignment
CREATE TABLE assignment (
    task_id SERIAL PRIMARY KEY, -- เปลี่ยนเป็น SERIAL PRIMARY KEY
    title VARCHAR NOT NULL,
    description TEXT,
    deadline TIMESTAMP NOT NULL,
    status VARCHAR NOT NULL,
    priority INTEGER NOT NULL,
    category_id INTEGER NOT NULL REFERENCES category(category_id) ON DELETE CASCADE -- เปลี่ยนเป็น INTEGER
);
-- 5. เพิ่มข้อมูล (ระวังชื่อตารางและชื่อ Column ให้ตรงกับตอนสร้าง)
-- สำหรับ SERIAL PRIMARY KEY ไม่ต้องระบุคอลัมน์ user_id ใน INSERT statement
INSERT INTO "user" (email, username, name, hashed_password, notification)
VALUES ('admin@example.com', 'adminuser', 'Admin User', '$2b$12$yourhashedpasswordhere', true);

-- สำหรับ SERIAL PRIMARY KEY ไม่ต้องระบุคอลัมน์ category_id ใน INSERT statement
-- และ user_id ต้องเป็น INTEGER ที่ได้จาก user ที่สร้างไปแล้ว
INSERT INTO category (category_name, color_code, user_id)
VALUES ('Homework', '#FF5733', (SELECT user_id FROM "user" WHERE username = 'adminuser'));