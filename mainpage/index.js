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
    
    // Add Task Sidebar Elements
    const btnOpenAddTask = document.getElementById('btnOpenAddTask');
    const btnCloseAddTask = document.getElementById('btnCloseAddTask');
    const addTaskSidebar = document.getElementById('addTaskSidebar');

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
        sidebar.classList.remove('sidebar--active');
        if (addTaskSidebar) addTaskSidebar.classList.remove('add-task-sidebar--open');
        overlay.classList.remove('overlay--active');
    });

    // Tag Selection Logic
    function bindTagClick(tag) {
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
        });
    }

    const selectableTags = document.querySelectorAll('.tag--selectable');
    selectableTags.forEach(bindTagClick);

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
                
                // Generate a random pastel color for the tag
                const hue = Math.floor(Math.random() * 360);
                newTag.style.backgroundColor = `hsla(${hue}, 80%, 60%, 0.15)`; // Slight transparent background
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
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                uploadText.textContent = fileInput.files[0].name;
            } else {
                uploadText.textContent = 'อัปโหลดไฟล์';
            }
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
            document.querySelectorAll('.tag-selector .tag--selectable.selected').forEach(tag => {
                tag.classList.remove('selected');
            });
            
            // Close sidebar
            if (addTaskSidebar) addTaskSidebar.classList.remove('add-task-sidebar--open');
            overlay.classList.remove('overlay--active');
        });
    }

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
