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
    USER: './test/user.json'
};

let allTasks = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadSidebar('notification');
    await loadData();
    initFilter();
});

async function loadData() {
    try {
        const [dataRes, userRes] = await Promise.all([
            fetch(API_CONFIG.DASHBOARD),
            fetch(API_CONFIG.USER)
        ]);
        const data = await dataRes.json();
        const user = await userRes.json();
        allTasks = data.tasks;
        renderUser(user);
        renderNotifications('all');
    } catch (err) {
        console.error('Load error:', err);
    }
}

function renderUser(user) {
    document.getElementById('userName').textContent = `Hello, ${user.name}!`;

    const imgAvatar = document.getElementById('imgAvatar');
    const textAvatar = document.getElementById('textAvatar');
    if (user.avatar_url && imgAvatar) {
        imgAvatar.src = user.avatar_url;
        imgAvatar.style.display = 'block';
        if (textAvatar) textAvatar.style.display = 'none';
    } else if (textAvatar) {
        textAvatar.textContent = user.initials || 'U';
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
        card.innerHTML = `
            <div class="noti-card__info">
                <div class="noti-card__title">${task.title}</div>
                <div class="noti-card__date">Due: ${formatDate(task.deadline)}</div>
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
