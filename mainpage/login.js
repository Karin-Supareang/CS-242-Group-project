const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const toRegister = document.getElementById('toRegister');
const toLogin = document.getElementById('toLogin');

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
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    //if valid infomation, go to index page
    window.location.href = "index.html"; 
});

//swapping teacher-student role
const roleBtns = document.querySelectorAll('.role-btn');
roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});