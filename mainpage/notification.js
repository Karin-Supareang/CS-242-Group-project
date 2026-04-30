/**
 * Smart Academic Planner - Notification Page
 */

import { loadSidebar } from './sidebar.js';

// Apply saved theme immediately on load
(function () {
    const saved = localStorage.getItem('theme') || 'light';
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(saved + '-theme');
})();

const API_CONFIG = {
    DASHBOARD: './test/data.json',
    USER: './test/user.json',
    AUTH_ME: 'http://localhost:8080/auth/me',
    ASSIGNMENTS: 'http://localhost:8080/assignment/get/all'
};

let allTasks = [];

document.addEventListener('DOMContentLoaded', async () => {
    // เช็ก Token ก่อนโหลดหน้าเว็บ
    let token = localStorage.getItem('token');
    if (!token) {
        const cookieMatch = document.cookie.match(/(?:^|; )(?:access_)?token=([^;]*)/);
        if (cookieMatch) {
            token = cookieMatch[1];
            localStorage.setItem('token', token);
        }
    }

    // ถ้าไม่มี Token ให้เด้งกลับไปหน้า Login ทันที
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    await loadSidebar('notification');
    await loadData();
    initFilter();
});

async function loadData() {
    const token = localStorage.getItem('token');
    try {
        const [dataRes, userRes] = await Promise.all([
            fetch(API_CONFIG.ASSIGNMENTS, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(API_CONFIG.AUTH_ME, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        if (dataRes.ok) {
            const tasks = await dataRes.json();
            allTasks = tasks.map(t => ({
                ...t,
                status_id: t.status === 'completed' ? 2 : (t.status === 'doing' ? 1 : 0)
            }));
        } else {
            const data = await (await fetch(API_CONFIG.DASHBOARD)).json();
            allTasks = data.tasks;
        }

        // ถ้าดึงข้อมูลจาก API จริงสำเร็จ ให้ใช้ข้อมูลจริง ถ้าไม่สำเร็จ (เช่น Token หมดอายุ) ให้ใช้ค่าจำลองไปก่อน
        let user;
        if (userRes.ok) {
            user = await userRes.json();
        } else {
            user = await (await fetch(API_CONFIG.USER)).json();
        }
        
        renderUser(user);
        renderNotifications('all');
    } catch (err) {
        console.error('Load error:', err);
    }
}

function renderUser(user) {
    const displayName = user.name || user.username || (user.email ? user.email.split('@')[0] : 'Guest');
    document.getElementById('userName').textContent = `Hello, ${displayName}!`;

    const imgAvatar = document.getElementById('imgAvatar');
    const textAvatar = document.getElementById('textAvatar');
    if (user.avatar_url && imgAvatar) {
        imgAvatar.src = user.avatar_url;
        imgAvatar.style.display = 'block';
        if (textAvatar) textAvatar.style.display = 'none';
    } else if (textAvatar) {
        // ดึงตัวอักษร 2 ตัวแรกจากชื่อมาทำเป็นรูปโปรไฟล์แบบข้อความ
        textAvatar.textContent = (user.initials || displayName.substring(0, 2)).toUpperCase();
        textAvatar.style.display = 'block';
    }
}

function renderNotifications(filter) {
    const now = new Date();
    const cutoff3 = new Date(); cutoff3.setDate(now.getDate() + 3);
    const cutoff7 = new Date(); cutoff7.setDate(now.getDate() + 7);

    let tasks = allTasks;
    if (filter === 'pending') tasks = tasks.filter(t => t.status_id === 0);
    if (filter === 'doing')   tasks = tasks.filter(t => t.status_id === 1);
    if (filter === 'done')    tasks = tasks.filter(t => t.status_id === 2);

    const urgent = tasks.filter(t => new Date(t.deadline) <= cutoff3);
    const soon   = tasks.filter(t => { const d = new Date(t.deadline); return d > cutoff3 && d <= cutoff7; });
    const later  = tasks.filter(t => new Date(t.deadline) > cutoff7);

    renderList('listUrgent', urgent, 'urgent');
    renderList('listSoon',   soon,   'soon');
    renderList('listLater',  later,  'later');

    document.getElementById('sectionUrgent').style.display = urgent.length ? '' : 'none';
    document.getElementById('sectionSoon').style.display   = soon.length   ? '' : 'none';
    document.getElementById('sectionLater').style.display  = later.length  ? '' : 'none';
}

function renderList(listId, tasks, type) {
    const list = document.getElementById(listId);
    list.innerHTML = '';
    tasks.forEach(task => {
        const badge = getStatusBadge(task.status_id);
        const card = document.createElement('div');
        card.className = `noti-card noti-card--${type}`;
        card.style.cursor = 'pointer';
        card.style.backgroundColor = '#ffffff';
        
        card.addEventListener('click', () => showTaskDetails(task));

        card.innerHTML = `
            <div class="noti-card__info">
                <div class="noti-card__title" style="color: #333333;">${task.title}</div>
                <div class="noti-card__date" style="color: #666666;">Due: ${formatDate(task.deadline)}</div>
            </div>
            <span class="noti-badge ${badge.cls}">${badge.label}</span>
        `;
        list.appendChild(card);
    });
}

function getStatusBadge(statusId) {
    if (statusId === 2) return { cls: 'noti-badge--done',    label: 'ส่งแล้ว' };
    if (statusId === 1) return { cls: 'noti-badge--doing',   label: 'กำลังทำ' };
    return                     { cls: 'noti-badge--pending', label: 'ยังไม่ส่ง' };
}

function initFilter() {
    const filterSelect = document.getElementById('filterSelect');
    if (filterSelect) {
        filterSelect.addEventListener('change', e => {
            renderNotifications(e.target.value);
        });
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

function showTaskDetails(task) {
    const existing = document.getElementById('taskDetailModal');
    if (existing) existing.remove();

    const badge = getStatusBadge(task.status_id);
    let tagsHtml = '-';
    if (task.categories && task.categories.length > 0) {
        tagsHtml = task.categories.map(cat => `<span style="background-color: ${cat.color_code}20; color: ${cat.color_code}; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; margin-right: 5px; font-weight: 600;">${cat.category_name}</span>`).join('');
    }

    const modalHtml = `
        <div id="taskDetailModal" class="overlay overlay--active" style="display: flex; justify-content: center; align-items: center; z-index: 3000; background-color: rgba(0,0,0,0.5);">
            <div style="background: #ffffff; padding: 30px; border-radius: 16px; width: 90%; max-width: 500px; color: #333333; box-shadow: 0 10px 25px rgba(0,0,0,0.2); position: relative;">
                <button id="btnCloseModal" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #888;">&times;</button>
                
                <h2 style="margin: 0 0 20px 0; color: #585191; font-size: 1.5rem; padding-right: 30px;">${task.title}</h2>
                
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px; margin-bottom: 20px; font-size: 0.95rem;">
                    <div style="color: #666; font-weight: 600;">กำหนดส่ง:</div>
                    <div>${formatDate(task.deadline)} ${new Date(task.deadline).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} น.</div>
                    
                    <div style="color: #666; font-weight: 600;">สถานะ:</div>
                    <div><span class="noti-badge ${badge.cls}" style="display: inline-block;">${badge.label}</span></div>
                    
                    <div style="color: #666; font-weight: 600;">หมวดหมู่:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">${tagsHtml}</div>
                    
                    <div style="color: #666; font-weight: 600;">เวลาประเมิน:</div>
                    <div>${task.estimated_time ? task.estimated_time + ' ชั่วโมง' : 'ไม่ได้ระบุ'}</div>
                </div>
                
                <div style="background: #f4f5f9; padding: 15px; border-radius: 8px;">
                    <div style="color: #666; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem;">รายละเอียดงาน:</div>
                    <div style="white-space: pre-wrap; font-size: 0.9rem; line-height: 1.6; max-height: 200px; overflow-y: auto;">${task.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</div>
                </div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; text-align: right;">
                    <button id="btnDeleteTaskModal" style="background: #ff5c5c; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 600; transition: background 0.2s;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px; margin-top: -2px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ลบงานนี้
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const closeModal = () => document.getElementById('taskDetailModal')?.remove();
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('taskDetailModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskDetailModal') closeModal();
    });
    
    const btnDelete = document.getElementById('btnDeleteTaskModal');
    if (btnDelete) {
        btnDelete.addEventListener('click', async () => {
            if (confirm(`คุณต้องการลบงาน "${task.title}" ใช่หรือไม่?`)) {
                try {
                    const token = localStorage.getItem('token');
                    const taskId = task.task_id || task.id;
                    const res = await fetch(`http://localhost:8080/assignment/delete/${taskId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) throw new Error('ไม่สามารถลบงานได้');
                    
                    alert('ลบงานสำเร็จ');
                    window.location.reload(); // โหลดหน้าใหม่เพื่ออัปเดตรายการ
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            }
        });
    }
}
