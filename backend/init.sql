-- 1. ลบตารางเก่า (เรียงลำดับตามความสัมพันธ์ FK)
DROP TABLE IF EXISTS assignment_category;
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
    notification BOOLEAN DEFAULT TRUE,
    google_access_token VARCHAR,
    google_refresh_token VARCHAR
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
    priority INTEGER,
    estimated_time INTEGER,
    percentage INTEGER,
    file_data BYTEA,
    file_name VARCHAR,
    file_mimetype VARCHAR,
    google_event_id VARCHAR
);
-- 4.5. สร้างตารางเชื่อม (Many-to-Many) สำหรับ assignment และ category
CREATE TABLE assignment_category (
    task_id INTEGER REFERENCES assignment(task_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES category(category_id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, category_id)
);
-- 5. เพิ่มข้อมูล (ระวังชื่อตารางและชื่อ Column ให้ตรงกับตอนสร้าง)
-- สำหรับ SERIAL PRIMARY KEY ไม่ต้องระบุคอลัมน์ user_id ใน INSERT statement
INSERT INTO "user" (email, username, name, hashed_password, notification)
VALUES ('admin@example.com', 'adminuser', 'Admin User', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', true);
-- หมายเหตุ: รหัสผ่านของ adminuser คือคำว่า password



-- เพิ่มข้อมูล Category พื้นฐาน (Urgent, Soon, Later) ให้ adminuser
INSERT INTO category (category_name, color_code, user_id)
VALUES ('Urgent', '#FF5733', (SELECT user_id FROM "user" WHERE username = 'adminuser')),
       ('Soon', '#FFC300', (SELECT user_id FROM "user" WHERE username = 'adminuser')),
       ('Later', '#33AFFF', (SELECT user_id FROM "user" WHERE username = 'adminuser'));

-- สำหรับ SERIAL PRIMARY KEY ไม่ต้องระบุคอลัมน์ category_id ใน INSERT statement
-- และ user_id ต้องเป็น INTEGER ที่ได้จาก user ที่สร้างไปแล้ว
INSERT INTO category (category_name, color_code, user_id)
VALUES ('Homework', '#FF5733', (SELECT user_id FROM "user" WHERE username = 'adminuser'));

-- เพิ่มข้อมูล Category เริ่มต้นเพิ่มเติม
INSERT INTO category (category_name, color_code, user_id)
VALUES ('Project', '#33AFFF', (SELECT user_id FROM "user" WHERE username = 'adminuser')),
       ('Exam', '#FFC300', (SELECT user_id FROM "user" WHERE username = 'adminuser'));



-- เพิ่มข้อมูล Assignment สำหรับทดสอบ Notification และ Priority
INSERT INTO assignment (title, description, deadline, status, estimated_time, percentage)
VALUES 
('งานด่วนมาก (เหลือ 1 ชม)', 'ทดสอบแจ้งเตือนโคตรด่วน', NOW() + INTERVAL '1 hour 30 minutes', 'pending', 1, 10),
('งานด่วน (เหลือ 5 ชม)', 'ทดสอบแจ้งเตือน 6 ชั่วโมงสุดท้าย', NOW() + INTERVAL '5 hours 30 minutes', 'pending', 6, 20),
('งานพรุ่งนี้ (เหลือ 23 ชม)', 'ทดสอบแจ้งเตือน 1 วัน', NOW() + INTERVAL '23 hours 30 minutes', 'pending', 24, 30),
('งานชิลๆ (เหลือ 3 วัน)', 'งานนี้ยังไม่ต้องรีบ Priority ควรจะต่ำสุด', NOW() + INTERVAL '3 days', 'pending', 72, 50),
('งานเสร็จแล้ว', 'งานนี้เสร็จแล้วไม่ควรแจ้งเตือนและ Priority ต้องเป็น null', NOW() + INTERVAL '1 day', 'completed', 48, 100);

-- เชื่อม Assignment เข้ากับ Category
INSERT INTO assignment_category (task_id, category_id)
VALUES 
(1, 1), -- งานด่วนมาก -> Homework
(2, 1), -- งานด่วน -> Homework
(3, 2), -- งานพรุ่งนี้ -> Project
(4, 2), -- งานชิลๆ -> Project
(5, 3); -- งานเสร็จแล้ว -> Exam

-- เพิ่มข้อมูล Assignment เริ่มต้นตามที่ร้องขอ
INSERT INTO assignment (title, description, deadline, status, estimated_time, percentage)
VALUES
('CS222 Assignment', 'งานวิชา CS222', '2024-04-26 23:59:00', 'pending', 6, 0),
('CS242 Assignment', 'งานวิชา CS242', '2024-04-30 23:59:00', 'pending', 96, 30),
('CS232 Assignment', 'งานวิชา CS232', '2024-04-27 23:59:00', 'pending', 288, 70);

-- เชื่อม Assignment ใหม่เข้ากับ Category (สมมติว่า ID เริ่มจาก 6)
INSERT INTO assignment_category (task_id, category_id)
VALUES
(6, 1), -- CS222 -> Homework
(7, 2), -- CS242 -> Project
(8, 3); -- CS232 -> Exam