/**
 * Smart Academic Planner - Priority Page
 */

import { loadSidebar } from './sidebar.js';

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

    await loadSidebar('priority');
    await loadData();
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

        let user;
        if (userRes.ok) {
            user = await userRes.json();
        } else {
            user = await (await fetch(API_CONFIG.USER)).json();
        }
        
        renderUser(user);
        renderPriorityList();
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
        textAvatar.textContent = (user.initials || displayName.substring(0, 2)).toUpperCase();
        textAvatar.style.display = 'block';
    }
}

function renderPriorityList() {
    // กรองเอางานที่ยังไม่เสร็จ (status_id != 2) และ priority ไม่ใช่ null
    let tasks = allTasks.filter(t => t.priority !== null && t.status_id !== 2);
    
    // เรียงลำดับจาก 1, 2, 3 ... (ตัวเลขน้อยคือด่วนมาก)
    tasks.sort((a, b) => a.priority - b.priority);

    const list = document.getElementById('listPriority');
    list.innerHTML = '';
    
    if (tasks.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #888; padding: 30px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e4e8;">ไม่มีงานที่ค้างอยู่ หรือระบบยังไม่ได้ประมวลผล Priority ให้ครับ 🎉</div>';
        return;
    }

    tasks.forEach(task => {
        const badge = getStatusBadge(task.status_id);
        const card = document.createElement('div');
        
        // แบ่งสีตามความด่วน (Top 3 สีแดง, 4-6 สีเหลือง, ที่เหลือสีเทา)
        let type = 'later';
        if (task.priority <= 3) type = 'urgent';
        else if (task.priority <= 6) type = 'soon';

        card.className = `noti-card noti-card--${type}`;
        card.style.cursor = 'pointer';
        card.style.backgroundColor = '#ffffff';
        
        card.addEventListener('click', () => showTaskDetails(task));

        card.innerHTML = `
            <div class="noti-card__info" style="display: flex; align-items: center; gap: 20px;">
                <div style="font-size: 1.75rem; font-weight: 800; color: ${type === 'urgent' ? '#ff5c5c' : (type === 'soon' ? '#ffb84d' : '#9e9e9e')}; width: 50px; text-align: center;">
                    #${task.priority}
                </div>
                <div>
                    <div class="noti-card__title" style="color: #333333; font-size: 1.1rem; margin-bottom: 5px;">${task.title}</div>
                    <div class="noti-card__date" style="color: #666666; font-size: 0.85rem;">
                        Due: ${formatDate(task.deadline)} ${task.deadline ? new Date(task.deadline).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) + ' น.' : ''}
                        <span style="margin-left: 10px; color: #3b82f6; font-weight: bold;">(คืบหน้า ${task.percentage || 0}%)</span>
                    </div>
                </div>
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

function formatDate(dateString) {
    if (!dateString) return '';
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
                
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <span style="background: #ff5c5c; color: white; padding: 4px 12px; border-radius: 8px; font-weight: bold; font-size: 1.2rem;">#${task.priority || '-'}</span>
                    <h2 style="margin: 0; color: #585191; font-size: 1.5rem; padding-right: 30px;">${task.title}</h2>
                </div>
                
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px; margin-bottom: 20px; font-size: 0.95rem;">
                    <div style="color: #666; font-weight: 600;">กำหนดส่ง:</div>
                    <div>${formatDate(task.deadline)} ${task.deadline ? new Date(task.deadline).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) + ' น.' : ''}</div>
                    
                    <div style="color: #666; font-weight: 600;">สถานะ:</div>
                    <div><span class="noti-badge ${badge.cls}" style="display: inline-block;">${badge.label}</span></div>
                    
                    <div style="color: #666; font-weight: 600;">หมวดหมู่:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">${tagsHtml}</div>
                    
                    <div style="color: #666; font-weight: 600;">เวลาประเมิน:</div>
                    <div>${task.estimated_time ? task.estimated_time + ' ชั่วโมง' : 'ไม่ได้ระบุ'}</div>
                    
                    <div style="color: #666; font-weight: 600;">ความคืบหน้า:</div>
                    <div><span style="font-weight: bold; color: #3b82f6;">${task.percentage || 0}%</span></div>
                </div>
                
                <div style="background: #f4f5f9; padding: 15px; border-radius: 8px;">
                    <div style="color: #666; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem;">รายละเอียดงาน:</div>
                    <div style="white-space: pre-wrap; font-size: 0.9rem; line-height: 1.6; max-height: 200px; overflow-y: auto;">${task.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</div>
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
}