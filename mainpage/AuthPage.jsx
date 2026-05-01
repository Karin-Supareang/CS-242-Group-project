import React, { useState } from 'react';
import api from '../api.js';

export default function AuthPage({ setToken }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ email: '', username: '', name: '', password: '', confirm_password: '' });

  const backendUrl = api.defaults.baseURL || 'http://localhost:8080';

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { username: authForm.username, email: authForm.username, password: authForm.password });
      localStorage.setItem('token', res.data.access_token);
      document.cookie = `token=${res.data.access_token}; path=/; max-age=7200`; // เก็บลง Cookie
      setToken(res.data.access_token);
    } catch (e) { alert("Login Failed: " + (e.response?.data?.detail || "เกิดข้อผิดพลาด")); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/signup', authForm);
      alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      setIsLoginMode(true);
    } catch (e) { alert("Signup Failed: " + (e.response?.data?.detail || "เกิดข้อผิดพลาด")); }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', color: '#333' }}>Smart Academic Plan</h2>
        
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <button style={isLoginMode ? activeTabStyle : authTabStyle} onClick={() => setIsLoginMode(true)}>Login</button>
          <button style={!isLoginMode ? activeTabStyle : authTabStyle} onClick={() => setIsLoginMode(false)}>Sign Up</button>
        </div>

        {isLoginMode ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>Username หรือ Email</label>
              <input name="username" placeholder="กรอก Username หรือ Email" onChange={handleAuthChange} style={inputStyle} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>รหัสผ่าน</label>
              <input name="password" type="password" placeholder="กรอกรหัสผ่าน" onChange={handleAuthChange} style={inputStyle} required />
            </div>
            <button type="submit" style={btnPrimaryStyle}>เข้าสู่ระบบ</button>
          </form>
        ) : (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>อีเมล</label>
              <input name="email" type="email" placeholder="example@email.com" onChange={handleAuthChange} style={inputStyle} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>Username (ไม่บังคับ, ห้ามมี @)</label>
              <input name="username" placeholder="กรอก Username" onChange={handleAuthChange} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>ชื่อ - นามสกุล (ไม่บังคับ)</label>
              <input name="name" placeholder="กรอกชื่อ - นามสกุล" onChange={handleAuthChange} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>รหัสผ่าน</label>
              <input name="password" type="password" placeholder="กรอกรหัสผ่าน" onChange={handleAuthChange} style={inputStyle} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>ยืนยันรหัสผ่าน</label>
              <input name="confirm_password" type="password" placeholder="กรอกรหัสผ่านอีกครั้ง" onChange={handleAuthChange} style={inputStyle} required />
            </div>
            <button type="submit" style={btnPrimaryStyle}>สมัครสมาชิก</button>
          </form>
        )}
        
        <div style={{ textAlign: 'center', margin: '20px 0', color: '#888' }}>หรือ</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href={`${backendUrl}/auth/login/google`} style={btnGoogleStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '10px' }}><path fill="#fff" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/></svg>
            Login with Google
          </a>

        </div>
      </div>
    </div>
  );
}

const authTabStyle = { flex: 1, padding: '10px', border: 'none', backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' };
const activeTabStyle = { ...authTabStyle, backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px' };
const labelStyle = { fontSize: '14px', fontWeight: 'bold', color: '#475569' };
const inputStyle = { padding: '12px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '14px' };
const btnPrimaryStyle = { padding: '12px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };
const btnGoogleStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#4285F4', color: 'white', padding: '12px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' };