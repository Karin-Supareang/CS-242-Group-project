/**
 * Smart Academic Planner - Summary Page (Pandas API)
 */

import { loadSidebar } from './sidebar.js';

(function () {
    const saved = localStorage.getItem('theme') || 'light';
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(saved + '-theme');
})();

const API_CONFIG = {
    AUTH_ME: 'http://localhost:8080/auth/me',
    SUMMARY: 'http://localhost:8080/dashboard/status'
};

document.addEventListener('DOMContentLoaded', async () => {
    let token = localStorage.getItem('token');
    if (!token) {
        const cookieMatch = document.cookie.match(/(?:^|; )(?:access_)?token=([^;]*)/);
        if (cookieMatch) {
            token = cookieMatch[1];
            localStorage.setItem('token', token);
        }
    }

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    await loadSidebar('summary');
    await loadData(token);
});

async function loadData(token) {
    try {
        const [userRes, summaryRes] = await Promise.all([
            fetch(API_CONFIG.AUTH_ME, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(API_CONFIG.SUMMARY, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        if (userRes.ok) {
            const user = await userRes.json();
            renderUser(user);
        }

        if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            renderSummary(summaryData.data);
        } else {
            throw new Error("Cannot fetch summary data");
        }
    } catch (err) {
        console.error('Load error:', err);
        document.getElementById('summaryContainer').innerHTML = `
            <div style="text-align: center; grid-column: 1 / -1; padding: 40px; color: var(--danger);">
                เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}
            </div>
        `;
    }
}

function renderUser(user) {
    const displayName = user.name || user.username || (user.email ? user.email.split('@')[0] : 'Guest');
    document.getElementById('userName').textContent = `Hello, ${displayName}!`;

    const textAvatar = document.getElementById('textAvatar');
    if (textAvatar) {
        textAvatar.textContent = (user.initials || displayName.substring(0, 2)).toUpperCase();
        textAvatar.style.display = 'block';
    }
}

function renderSummary(data) {
    const container = document.getElementById('summaryContainer');
    container.innerHTML = ''; // เคลียร์ของเก่า

    // สร้างการ์ดตามข้อมูลที่ตอบกลับมาจาก Pandas (เช่น pending, doing, completed)
    for (const [status, count] of Object.entries(data)) {
        let color = 'var(--text-main)';
        let title = status.toUpperCase();
        
        if (status === 'completed') color = 'var(--success)';
        else if (status === 'doing') color = 'var(--accent)';
        else if (status === 'pending') color = 'var(--danger)';

        const cardHtml = `
            <div class="stat-card" style="text-align: center;">
                <h3 class="stat-card__title" style="margin-bottom: 15px;">${title}</h3>
                <p class="stat-card__value" style="color: ${color}; font-size: 3rem;">${count}</p>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    }
    
    if (Object.keys(data).length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 30px;">ไม่มีข้อมูลในระบบ</div>';
    }
}