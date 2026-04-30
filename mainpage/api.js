import axios from 'axios';

const api = axios.create({
  // ดึง URL จากไฟล์ .env (ถ้าไม่มีจะใช้ 8080 เป็นค่าเริ่มต้น)
  baseURL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080',
});

// ตัวดักจับ Request เพื่อแนบ JWT Token อัตโนมัติ
api.interceptors.request.use((config) => {
  // ลองอ่านจาก localStorage ก่อน
  let token = localStorage.getItem('token');
  
  // ถ้าใน localStorage ไม่มี ให้ลองหาจาก Cookie
  if (!token) {
    const cookieMatch = document.cookie.match(/(?:^|; )token=([^;]*)/);
    if (cookieMatch) token = cookieMatch[1];
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;