const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const toRegister = document.getElementById('toRegister');
const toLogin = document.getElementById('toLogin');

// 1. Switch to Register
toRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
    clearErrors();
});

// 2. Switch to Login
toLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.style.display = 'none';
    loginSection.style.display = 'block';
    clearErrors();
});

// Real-time Validation Logic Helper
function setupValidation(inputId, errorId, validationType) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    
    if (!input || !errorEl) return null;

    const validate = () => {
        const val = input.value.trim();
        if (!val) {
            showFieldError(input, errorEl, 'กรุณากรอกข้อมูล');
            return false;
        }
        
        if (validationType === 'email' && !validateEmail(val)) {
            showFieldError(input, errorEl, 'รูปแบบ Email ไม่ถูกต้อง');
            return false;
        }
        
        if (validationType === 'password' && val.length < 6) {
            showFieldError(input, errorEl, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว');
            return false;
        }
        
        hideFieldError(input, errorEl);
        return true;
    };

    input.addEventListener('input', validate);
    return validate;
}

// Initialize Validations
const validateLoginEmail = setupValidation('loginEmail', 'emailError', 'email');
const validateLoginPassword = setupValidation('loginPassword', 'passwordError', 'password');
const validateRegEmail = setupValidation('regEmail', 'regEmailError', 'email');
const validateRegPassword = setupValidation('regPassword', 'regPasswordError', 'password');

function showFieldError(input, errorEl, msg) {
    input.classList.add('invalid');
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
}

function hideFieldError(input, errorEl) {
    input.classList.remove('invalid');
    errorEl.style.display = 'none';
}

function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.style.display = 'none');
    document.querySelectorAll('input').forEach(el => el.classList.remove('invalid'));
    const loginErr = document.getElementById('loginError');
    const registerErr = document.getElementById('registerError');
    if (loginErr) loginErr.style.display = 'none';
    if (registerErr) registerErr.style.display = 'none';
}

// 3. Register form submit
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const isEmailValid = validateRegEmail();
    const isPasswordValid = validateRegPassword();
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errBox = document.getElementById('registerError');

    errBox.style.display = 'none';

    if (!name || !username || !confirmPassword) {
        showError(errBox, 'กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    if (password !== confirmPassword) {
        showError(errBox, 'รหัสผ่านไม่ตรงกัน');
        return;
    }

    if (!isEmailValid || !isPasswordValid) return;

    try {
        const response = await fetch('http://localhost:8080/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('regEmail').value.trim(),
                username: username,
                password: password,
                confirm_password: confirmPassword,
                name: name
            })
        });

        if (!response.ok) {
            const err = await response.json();
            let msg = 'Registration failed';
            if (err.detail) {
                if (Array.isArray(err.detail)) {
                    msg = err.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
                } else {
                    msg = err.detail;
                }
            }
            throw new Error(msg);
        }

        alert('ลงทะเบียนสำเร็จแล้ว! กรุณาเข้าสู่ระบบ');
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
        clearErrors();
    } catch (error) {
        showError(errBox, error.message || 'Something went wrong');
    }
});

// 4. Login form submit
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const isEmailValid = validateLoginEmail();
    const isPasswordValid = validateLoginPassword();

    if (!isEmailValid || !isPasswordValid) return;

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errBox = document.getElementById('loginError');
    errBox.style.display = 'none';

    try {
        const response = await fetch('http://localhost:8080/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            const err = await response.json();
            let msg = 'Login failed';
            if (err.detail) {
                msg = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
            }
            throw new Error(msg);
        }

        const data = await response.json();
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            window.location.href = "index.html";
        }
    } catch (error) {
        showError(errBox, error.message || 'Something went wrong');
    }
});

function showError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 5. Google Login
window.handleGoogleLogin = function(response) {
    const idToken = response.credential;

    fetch('http://localhost:8080/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken })
    })
    .then(res => res.json())
    .then(data => {
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            window.location.href = "index.html";
        } else {
            alert('Google login failed');
        }
    })
    .catch(() => alert('Google login error'));
}