/**
 * Smart Academic Planner - Final Polish
 */

import { loadSidebar } from './sidebar.js';

// Apply saved theme immediately on load to prevent flash
(function () {
    const saved = localStorage.getItem('theme') || 'light';
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(saved + '-theme');
})();

const API_CONFIG = {
    DASHBOARD: './test/data.json',
    SETTINGS: './test/settings.json',
    USER: './test/user.json',
    AUTH_ME: 'http://localhost:8080/auth/me'
};

let appState = {
    tasks: [],
    settings: {},
    user: {},
    token: localStorage.getItem('token')
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadSidebar('home');
    initUI();
    await loadApp();
});

function initUI() {
    const overlay = document.getElementById('overlay');
    const userDropdownBtn = document.getElementById('userDropdownBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');

    // Dropdown Logic
    if (userDropdownBtn && userDropdownMenu) {
        userDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('show');
            renderDropdown();
        });

        document.addEventListener('click', (e) => {
            if (!userDropdownBtn.contains(e.target)) {
                userDropdownMenu.classList.remove('show');
            }
        });
    }

    // Add Task Sidebar Elements
    const btnOpenAddTask = document.getElementById('btnOpenAddTask');
    const btnCloseAddTask = document.getElementById('btnCloseAddTask');
    const addTaskSidebar = document.getElementById('addTaskSidebar');

    // Add Task Sidebar Toggle
    if (btnOpenAddTask) {
        btnOpenAddTask.addEventListener('click', () => {
            const dateText = document.getElementById('sidebarDateText');
            if (dateText) {
                const now = new Date();
                const options = { day: 'numeric', month: 'short', year: 'numeric' };
                dateText.textContent = `สร้างวันที่ ${now.toLocaleDateString('en-GB', options)}`;
            }
            addTaskSidebar.classList.add('add-task-sidebar--open');
            overlay.classList.add('overlay--active');
        });
    }

    if (btnCloseAddTask) {
        btnCloseAddTask.addEventListener('click', () => {
            addTaskSidebar.classList.remove('add-task-sidebar--open');
            overlay.classList.remove('overlay--active');
        });
    }

    overlay.addEventListener('click', () => {
        if (addTaskSidebar) addTaskSidebar.classList.remove('add-task-sidebar--open');
        overlay.classList.remove('overlay--active');
    });

    // Tag Selection Logic
    const bindTagClick = (tag) => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
        });
    };

    document.querySelectorAll('.tag--selectable').forEach(bindTagClick);

    // New Tag Logic
    const btnNewTag = document.getElementById('btnNewTag');
    const tagSelector = document.getElementById('tagSelector');
    if (btnNewTag && tagSelector) {
        btnNewTag.addEventListener('click', () => {
            const tagName = prompt("Enter new tag name:");
            if (tagName && tagName.trim() !== '') {
                const newTag = document.createElement('span');
                newTag.className = `tag tag--custom tag--selectable selected`;
                newTag.textContent = tagName.trim();
                
                const hue = Math.floor(Math.random() * 360);
                newTag.style.backgroundColor = `hsla(${hue}, 80%, 60%, 0.15)`;
                newTag.style.color = `hsl(${hue}, 70%, 40%)`;
                
                tagSelector.appendChild(newTag);
                bindTagClick(newTag);
            }
        });
    }

    // File Upload Logic
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadText = document.getElementById('uploadText');
    if (uploadArea && fileInput && uploadText) {
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            uploadText.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : 'อัปโหลดไฟล์';
        });
    }

    // Submit New Task Logic
    const btnSubmitTask = document.getElementById('btnSubmitTask');
    if (btnSubmitTask) {
        btnSubmitTask.addEventListener('click', () => {
            const name = document.getElementById('inputTaskName').value;
            const date = document.getElementById('inputTaskDate').value;
            const note = document.getElementById('inputTaskNote').value;
            
            if (!name) {
                alert("Please enter a task name.");
                return;
            }

            const selectedTags = Array.from(document.querySelectorAll('.tag-selector .tag--selectable.selected'))
                .map(tag => tag.textContent.trim());
            
            const newTask = {
                id: Date.now(),
                title: name,
                description: note,
                deadline: date || new Date().toISOString().split('T')[0],
                status_id: 0,
                tags: selectedTags
            };

            appState.tasks.push(newTask);
            renderTasks();
            updateStats();

            // Reset form
            document.getElementById('inputTaskName').value = '';
            document.getElementById('inputTaskDate').value = '';
            document.getElementById('inputTaskNote').value = '';
            if (fileInput) fileInput.value = '';
            if (uploadText) uploadText.textContent = 'อัปโหลดไฟล์';
            document.querySelectorAll('.tag-selector .tag--selectable.selected').forEach(tag => tag.classList.remove('selected'));
            
            if (addTaskSidebar) addTaskSidebar.classList.remove('add-task-sidebar--open');
            overlay.classList.remove('overlay--active');
        });
    }

    setupCollapsible('toggleBacklog', 'listBacklog');
    setupCollapsible('toggleDoing', 'listDoing');
    setupCollapsible('toggleCompleted', 'listCompleted');
}

function setupCollapsible(headerId, listId) {
    const header = document.getElementById(headerId);
    const list = document.getElementById(listId);
    if (header && list) {
        header.addEventListener('click', () => {
            header.classList.toggle('section-header--collapsed');
            list.classList.toggle('task-list--hidden');
        });
    }
}

async function loadApp() {
    try {
        const [settingsRes, dataRes] = await Promise.all([
            fetch(API_CONFIG.SETTINGS),
            fetch(API_CONFIG.DASHBOARD)
        ]);

        appState.settings = await settingsRes.json();
        const data = await dataRes.json();
        appState.tasks = data.tasks;

        // User Loading
        if (appState.token) {
            try {
                const res = await fetch(API_CONFIG.AUTH_ME, {
                    headers: { 'Authorization': `Bearer ${appState.token}` }
                });
                if (res.ok) appState.user = await res.json();
                else appState.user = await (await fetch(API_CONFIG.USER)).json();
            } catch (e) {
                appState.user = await (await fetch(API_CONFIG.USER)).json();
            }
        } else {
            appState.user = { name: 'Guest', initials: 'G' };
        }

        renderUI();
        updateStats();
        renderTasks();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

function renderUI() {
    const { ui } = appState.settings;
    const { user } = appState;
    document.title = ui.title;
    document.getElementById('pageTitle').textContent = ui.dashboard_header;
    document.getElementById('boardHeader').textContent = ui.dashboard_header;
    
    const displayName = user.name || user.username || 'Guest';
    document.getElementById('userName').textContent = appState.token ? `Hello, ${displayName}!` : 'Hello, Guest!';
    
    const imgAvatar = document.getElementById('imgAvatar');
    const textAvatar = document.getElementById('textAvatar');
    
    if (user.avatar_url && imgAvatar && textAvatar) {
        imgAvatar.src = user.avatar_url;
        imgAvatar.style.display = 'block';
        textAvatar.style.display = 'none';
    } else if (textAvatar) {
        textAvatar.textContent = (user.initials || displayName.substring(0, 2)).toUpperCase();
        if (imgAvatar) imgAvatar.style.display = 'none';
        textAvatar.style.display = 'block';
    }
}

function updateStats() {
    const total = appState.tasks.length;
    const completed = appState.tasks.filter(t => t.status_id === 2).length;
    
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    const upcoming = appState.tasks.filter(t => {
        const d = new Date(t.deadline);
        return t.status_id !== 2 && d >= now && d <= nextWeek;
    }).length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statUpcoming').textContent = upcoming;
    document.getElementById('statCompleted').textContent = completed;
}

function renderTasks() {
    const listBacklog = document.getElementById('listBacklog');
    const listDoing = document.getElementById('listDoing');
    const listCompleted = document.getElementById('listCompleted');
    const countCompleted = document.getElementById('countCompleted');

    listBacklog.innerHTML = '';
    listDoing.innerHTML = '';
    listCompleted.innerHTML = '';

    let completedCount = 0;
    appState.tasks.forEach(task => {
        const card = createTaskCard(task);
        if (task.status_id === 0) listBacklog.appendChild(card);
        else if (task.status_id === 1) listDoing.appendChild(card);
        else if (task.status_id === 2) {
            listCompleted.appendChild(card);
            completedCount++;
        }
    });
    countCompleted.textContent = completedCount;
}

function createTaskCard(task) {
    const template = document.getElementById('taskTemplate');
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.task-card');
    
    const select = card.querySelector('.status-dropdown');
    select.value = task.status_id;
    select.setAttribute('data-status', task.status_id); 
    select.addEventListener('change', (e) => handleStatusChange(task.id, parseInt(e.target.value)));

    const content = card.querySelector('.task-card__content');
    content.innerHTML = `
        <div class="task-card__info">
            <div class="task-card__header">
                <h4 class="task-card__title">${task.title}</h4>
            </div>
            <div class="task-card__tags">
                ${task.tags.map(tagName => `<span class="tag tag--${tagName.toLowerCase()}">${tagName}</span>`).join('')}
            </div>
        </div>
        <span class="task-card__date">${formatDate(task.deadline)}</span>
    `;
    return card;
}

function handleStatusChange(taskId, newStatusId) {
    const taskIndex = appState.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        appState.tasks[taskIndex].status_id = newStatusId;
        updateStats();
        renderTasks();
    }
}

function formatDate(dateString) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('th-TH', options);
}

function renderDropdown() {
    const menu = document.getElementById('userDropdownMenu');
    if (!menu) return;

    if (!appState.token) {
        menu.innerHTML = `
            <div class="user-dropdown-header">
                <div class="avatar">G</div>
                <div class="user-dropdown-header-info">
                    <div class="user-dropdown-name">Guest User</div>
                    <div class="user-dropdown-email">Not logged in</div>
                </div>
            </div>
            <div class="user-dropdown-divider"></div>
            <button class="user-dropdown-item login-btn" onclick="window.location.href='login.html'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                Log in / Sign up
            </button>
        `;
    } else {
        const { user } = appState;
        const displayName = user.name || user.username || 'User';
        menu.innerHTML = `
            <div class="user-dropdown-header">
                <div class="avatar">${displayName.substring(0, 2).toUpperCase()}</div>
                <div class="user-dropdown-header-info">
                    <div class="user-dropdown-name">
                        ${displayName} <span class="user-dropdown-badge">PRO</span>
                    </div>
                    <div class="user-dropdown-email">${user.email || 'user@example.com'}</div>
                </div>
            </div>
            <div class="user-dropdown-divider"></div>
            <button class="user-dropdown-item" onclick="window.location.href='setting.html'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Settings
            </button>
            <button class="user-dropdown-item" id="btnToggleTheme">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                Toggle Theme
            </button>
            <div class="user-dropdown-divider"></div>
            <button class="user-dropdown-item" id="btnSignOut">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sign Out
            </button>
        `;

        document.getElementById('btnToggleTheme')?.addEventListener('click', () => {
            const current = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
            applyTheme(current);
        });

        document.getElementById('btnSignOut')?.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }
}

function applyTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('theme', theme);
}
