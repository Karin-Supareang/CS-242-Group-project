const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const toRegister = document.getElementById('toRegister');
const toLogin = document.getElementById('toLogin');

const API_BASE_URL = 'http://localhost:8080'; // URL ของ FastAPI Backend

//1. Click on text สมัครสมาชิกในหน้า Login
toRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
});

// 2.Click text เข้าสู่ระบบ in Register page
toLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.style.display = 'none';
    loginSection.style.display = 'block';
});

// 3.Press "register" button
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('ลงทะเบียนสำเร็จแล้ว! กรุณาเข้าสู่ระบบอีกครั้ง');
    
    //Back to login
    registerSection.style.display = 'none';
    loginSection.style.display = 'block';
});

// 4.Click "Log in" button
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    // สมมติว่ามี input field ที่มี id="loginUsername" และ id="loginPassword"
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    // สมมติว่ามี element สำหรับแสดง error ที่มี id="loginError"
    const errorElement = document.getElementById('loginError');
    if (errorElement) errorElement.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed. Please check your credentials.');
        }

        // เก็บ Token ที่ได้จาก Backend ลงใน localStorage
        localStorage.setItem('token', data.access_token);
        
        // ไปยังหน้า dashboard (index.html)
        window.location.href = "index.html";

    } catch (error) {
        console.error('Login error:', error);
        if (errorElement) {
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        }
    }
});

//swapping teacher-student role
const roleBtns = document.querySelectorAll('.role-btn');
roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});