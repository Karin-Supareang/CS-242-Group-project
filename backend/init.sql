-- 1. ลบตารางเก่า (เรียงลำดับตามความสัมพันธ์เพื่อไม่ให้ติด Error)
DROP TABLE IF EXISTS assignment_category;
DROP TABLE IF EXISTS assignment;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS "user";

-- 2. สร้างตาราง user
CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE,
    name VARCHAR,
    hashed_password VARCHAR,
    notification BOOLEAN DEFAULT TRUE,
    google_access_token VARCHAR,
    google_refresh_token VARCHAR
);

-- 3. สร้างตาราง category
CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR NOT NULL,
    color_code VARCHAR,
    user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE
);

-- 4. สร้างตาราง assignment
CREATE TABLE assignment (
    task_id SERIAL PRIMARY KEY,
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

-- 5. สร้างตารางเชื่อม (Many-to-Many)
CREATE TABLE assignment_category (
    task_id INTEGER REFERENCES assignment(task_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES category(category_id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, category_id)
);

-- 6. เพิ่มข้อมูล User (Admin และ Other User สำหรับเทสสิทธิ์การเข้าถึง)
INSERT INTO "user" (email, username, name, hashed_password, notification)
VALUES 
('admin@example.com', 'adminuser', 'Admin User', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', true),
('other@example.com', 'otheruser', 'Other User', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', true);

-- 7. เพิ่ม Category (ID 1-6 เป็นของ Admin, ID 7 เป็นของ Other User)
INSERT INTO category (category_name, color_code, user_id)
VALUES 
('Urgent', '#FF5733', 1),   -- ID 1
('Soon', '#FFC300', 1),     -- ID 2
('Later', '#33AFFF', 1),    -- ID 3
('Homework', '#44FF33', 1), -- ID 4
('Project', '#3352FF', 1),  -- ID 5
('Exam', '#FF33E9', 1),     -- ID 6
('Secret', '#000000', 2);   -- ID 7

-- 8. เพิ่ม Assignment พร้อมข้อมูลสำหรับวิเคราะห์ Dashboard
INSERT INTO assignment (title, description, deadline, status, priority, estimated_time, percentage)
VALUES 
('Many-to-Many Test Task', 'งานชิ้นนี้จะมี 2 Tags', NOW() + INTERVAL '2 days', 'pending', 5, 2, 10), -- ID 1
('Other User Task', 'ห้ามคนอื่นแก้', NOW() + INTERVAL '5 days', 'pending', 1, 1, 0); -- ID 2

-- 9. จุดสำคัญ: เชื่อม Many-to-Many (งานเดียวแต่มีหลายหมวดหมู่)
INSERT INTO assignment_category (task_id, category_id)
VALUES 
(1, 1), -- งาน ID 1 เป็นหมวด Urgent
(1, 5), -- งาน ID 1 เป็นหมวด Project ด้วย (นี่คือ Many-to-Many ค่ะ!)
(2, 7); -- งาน ID 2 เป็นหมวด Secret ของคนอื่น