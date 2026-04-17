-- ตัวอย่างการเพิ่มข้อมูล User เริ่มต้น
INSERT INTO users (user_id, email, username, name, hashed_password, notification) VALUES
('bruhbruh', 'admin@example.com', 'adminuser', 'Admin User', '$2b$12$yourhashedpasswordhere', true);

-- ตัวอย่างการเพิ่ม Category เริ่มต้น
INSERT INTO categories (category_id, categoryName, colorCode, user_id) VALUES
('cat-001', 'Homework', '#FF5733', 'bruhbruh');
