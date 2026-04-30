/**
 * Smart Academic Planner - Notification Page (Integrated)
 */

import { loadSidebar } from './sidebar.js';

// Apply saved theme immediately on load
(function () {
    const saved = localStorage.getItem('theme') || 'light';
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(saved + '-theme');
})();

const API_CONFIG = {
    DASHBOARD: 'http://localhost:8080/assignment/get/all',
    USER: 'http://localhost:8080/auth/me'
};

let allTasks = [];
const token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', async () => {
    // Redirect if no token
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    await loadSidebar('notification');
    await loadData();
    initFilter();
});

async function authFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
}

async function loadData() {
    try {
        const [dataRes, userRes] = await Promise.all([
            authFetch(API_CONFIG.DASHBOARD),
            authFetch(API_CONFIG.USER)
        ]);

        if (dataRes.ok) {
            const rawTasks = await dataRes.json();
            // Map backend tasks to frontend format
            allTasks = rawTasks.map(t => ({
                id: t.task_id,
                title: t.title,
                deadline: t.deadline,
                status_id: mapStatusToId(t.status)
            }));
        }

        if (userRes.ok) {
            const user = await userRes.json();
            renderUser(user);
        }

        renderNotifications('all');
    } catch (err) {
        console.error('Load error:', err);
    }
}

function mapStatusToId(status) {
    const s = status ? status.toLowerCase() : '';
    if (s === 'doing') return 1;
    if (s === 'done' || s === 'completed') return 2;
    return 0; // backlog/pending
}

function renderUser(user) {
    const displayName = user.name || user.username || 'User';
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
    return new Date(dateString).toLocaleDateString('th-TH', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}
