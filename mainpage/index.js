/**
 * Smart Academic Planner - Final Polish
 */

const API_CONFIG = {
    DASHBOARD: './test/data.json',
    SETTINGS: './test/settings.json'
};

let appState = {
    tasks: [],
    settings: {}
};

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    loadApp();
});

function initUI() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('overlay');

    // Sidebar Toggle
    toggleBtn.addEventListener('click', () => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            sidebar.classList.toggle('sidebar--active');
            overlay.classList.toggle('overlay--active');
        } else {
            sidebar.classList.toggle('sidebar--expanded');
        }
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('sidebar--active');
        overlay.classList.remove('overlay--active');
    });

    // Setup Collapsible Sections for ALL categories
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

        renderUI();
        updateStats();
        renderTasks();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

function renderUI() {
    const { ui, user } = appState.settings;
    document.title = ui.title;
    document.getElementById('pageTitle').textContent = ui.dashboard_header;
    document.getElementById('boardHeader').textContent = ui.dashboard_header;
    
    // Greeting - Enforcing "Hello, Rin!" as requested
    document.getElementById('userName').textContent = `Hello, Rin!`;
    document.querySelector('.user-avatar').textContent = "RN";
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
    
    // Status Circle (Select with no visible text)
    const select = card.querySelector('.status-dropdown');
    select.value = task.status_id;
    select.setAttribute('data-status', task.status_id); 
    select.addEventListener('change', (e) => {
        handleStatusChange(task.id, parseInt(e.target.value));
    });

    // Horizontal Layout matching image 7.png
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
