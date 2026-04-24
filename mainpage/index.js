/**
 * Smart Academic Planner - Task Board Logic
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
    const toggleCompleted = document.getElementById('toggleCompleted');
    const listCompleted = document.getElementById('listCompleted');

    // Sidebar Toggle
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar--active');
        overlay.classList.toggle('overlay--active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('sidebar--active');
        overlay.classList.remove('overlay--active');
    });

    // Completed Section Collapse
    toggleCompleted.addEventListener('click', () => {
        toggleCompleted.classList.toggle('section-header--collapsed');
        listCompleted.classList.toggle('task-list--hidden');
    });
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
    
    // Restore Hello message
    document.getElementById('userName').textContent = `${ui.welcome_prefix} ${user.name}!`;
    document.querySelector('.user-avatar').textContent = user.name.substring(0, 2).toUpperCase();
}

function updateStats() {
    const total = appState.tasks.length;
    const completed = appState.tasks.filter(t => t.status_id === 2).length;
    
    // Simple logic for "upcoming": tasks due within next 7 days that aren't completed
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
        
        if (task.status_id === 0) {
            listBacklog.appendChild(card);
        } else if (task.status_id === 1) {
            listDoing.appendChild(card);
        } else if (task.status_id === 2) {
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
    
    card.querySelector('.task-card__title').textContent = task.title;
    card.querySelector('.task-card__date').textContent = formatDate(task.deadline);
    
    const select = card.querySelector('.status-dropdown');
    select.value = task.status_id;
    select.setAttribute('data-status', task.status_id); // For CSS coloring
    
    select.addEventListener('change', (e) => {
        handleStatusChange(task.id, parseInt(e.target.value));
    });

    const tagsContainer = card.querySelector('.task-card__tags');
    task.tags.forEach(tagName => {
        const tag = document.createElement('span');
        tag.className = `tag tag--${tagName.toLowerCase()}`;
        tag.textContent = tagName;
        tagsContainer.appendChild(tag);
    });

    return card;
}

function handleStatusChange(taskId, newStatusId) {
    const taskIndex = appState.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        appState.tasks[taskIndex].status_id = newStatusId;
        console.log(`Task ${taskId} moved to status ${newStatusId}.`);
        updateStats(); // Recalculate stats
        renderTasks(); // Re-sort tasks into sections
    }
}

function formatDate(dateString) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('th-TH', options);
}
