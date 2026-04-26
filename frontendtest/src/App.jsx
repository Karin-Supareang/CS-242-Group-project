import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // ดัก Token จาก URL (กรณี Login with Google สำเร็จแล้วเด้งกลับมา)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      document.cookie = `token=${urlToken}; path=/; max-age=7200`; // เก็บลง Cookie (อายุ 2 ชั่วโมง)
      setToken(urlToken);
      window.history.replaceState({}, document.title, "/"); // เคลียร์ URL
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"; // เคลียร์ Cookie
    setToken(null);
  };

  if (!token) {
    return <AuthPage setToken={setToken} />;
  }

  return <DashboardPage token={token} logout={logout} />;
}