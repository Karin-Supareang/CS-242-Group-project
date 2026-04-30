const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const toRegister = document.getElementById('toRegister');
const toLogin = document.getElementById('toLogin');

const API_BASE_URL = 'http://localhost:8080'; // URL ของ FastAPI Backend

//1. Click on text สมัครสมาชิกในหน้า Login
// 1. Switch to Register
toRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
});

// 2. Switch to Login
toLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.style.display = 'none';
    loginSection.style.display = 'block';
});

// 3. Register form submit
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                name: `${firstName} ${lastName}`.trim(),
                password: password,
                confirm_password: password
            }) // 💡 ไม่ได้ส่ง username ไปด้วย เพื่อให้ Backend ดึงจากหน้า @ ของอีเมลให้เลย
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Signup failed');
        }

        alert('ลงทะเบียนสำเร็จแล้ว! ระบบได้สร้าง Username ให้อัตโนมัติ กรุณาเข้าสู่ระบบอีกครั้ง');
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
        this.reset(); // ล้างข้อมูลในฟอร์มออก
    } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
});

// 4. Login form submit
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('http://localhost:8080/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Login failed');
        }

        const data = await response.json();
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            window.location.href = "index.html";
        }
    } catch (error) {
        alert(error.message);
    }
});

// 5. Google Login
function handleGoogleLogin() {
    // เปลี่ยนเส้นทางไปยัง Backend เพื่อเริ่มกระบวนการ OAuth
    window.location.href = 'http://localhost:8080/auth/login/google';
}
