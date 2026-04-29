/**
 * Smart Academic Planner - Integrated Version
 */

const API_BASE_URL = 'http://localhost:8080';
const API_CONFIG = {
    DASHBOARD: `${API_BASE_URL}/assignment/get/all`,
    SETTINGS: './test/settings.json',
    USER: `${API_BASE_URL}/auth/me`,
    CATEGORIES: `${API_BASE_URL}/category/get`,
    UPLOAD: `${API_BASE_URL}/assignment/upload`,
    UPDATE_TASK: (id) => `${API_BASE_URL}/assignment/update/${id}`,
    CREATE_TASK: `${API_BASE_URL}/assignment/post`
};

let appState = {
    tasks: [],
    settings: {},
    user: {},
    categories: []
};

// Helper for authenticated requests
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type if it's FormData (let browser handle it)
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        console.warn('Unauthorized: Redirecting to login or showing alert.');
        // Optional: window.location.href = '/login'; 
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || response.statusText);
    }

    return response.json();
}

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
        btnNewTag.addEventListener('click', async () => {
            const tagName = prompt("Enter new tag name:");
            if (tagName && tagName.trim() !== '') {
                try {
                    const newCat = await apiFetch(API_CONFIG.CATEGORIES.replace('/get', '/post'), {
                        method: 'POST',
                        body: JSON.stringify({ category_name: tagName.trim(), color_code: '#888888' })
                    });
                    appState.categories.push(newCat);
                    renderCategories();
                } catch (error) {
                    alert('Error creating tag: ' + error.message);
                }
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
        btnSubmitTask.addEventListener('click', async () => {
            const name = document.getElementById('inputTaskName').value;
            const date = document.getElementById('inputTaskDate').value;
            const note = document.getElementById('inputTaskNote').value;
            
            if (!name) {
                alert("Please enter a task name.");
                return;
            }

            const selectedTagNames = Array.from(document.querySelectorAll('.tag-selector .tag--selectable.selected'))
                .map(tag => tag.textContent.trim());
            
            const category_ids = appState.categories
                .filter(cat => selectedTagNames.includes(cat.category_name))
                .map(cat => cat.category_id);

            // Backend expects status as string
            const newTaskData = {
                title: name,
                description: note,
                deadline: date ? `${date}T23:59:59Z` : new Date().toISOString(),
                status: 'pending',
                priority: 1,
                category_ids: category_ids
            };

            try {
                const createdTask = await apiFetch(API_CONFIG.CREATE_TASK, {
                    method: 'POST',
                    body: JSON.stringify(newTaskData)
                });

                // Handle file upload if present
                if (fileInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append('task_id', createdTask.task_id.toString());
                    formData.append('file', fileInput.files[0]);

                    await apiFetch(API_CONFIG.UPLOAD, {
                        method: 'POST',
                        body: formData
                    });
                }

                // Refresh app state
                await loadApp();

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
            } catch (error) {
                alert('Failed to create task: ' + error.message);
            }
        });
    }

    // Setup Collapsible Sections for ALL categories
    setupCollapsible('toggleBacklog', 'listBacklog');
    setupCollapsible('toggleDoing', 'listDoing');
    setupCollapsible('toggleCompleted', 'listCompleted');

    // Logout logic
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.reload(); // Or redirect to login
        });
    }
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
        // Fetch settings locally, but user/tasks from API
        const settingsRes = await fetch(API_CONFIG.SETTINGS);
        appState.settings = await settingsRes.json();

        const [user, tasks, categories] = await Promise.all([
            apiFetch(API_CONFIG.USER),
            apiFetch(API_CONFIG.DASHBOARD),
            apiFetch(API_CONFIG.CATEGORIES)
        ]);

        appState.user = user;
        // Map backend tasks to frontend expectations
        appState.tasks = tasks.map(t => ({
            id: t.task_id,
            title: t.title,
            description: t.description,
            deadline: t.deadline,
            status_id: t.status === 'completed' ? 2 : (t.status === 'doing' ? 1 : 0),
            tags: t.categories.map(c => c.category_name)
        }));
        appState.categories = categories;

        renderUI();
        renderCategories();
        updateStats();
        renderTasks();
    } catch (error) {
        console.error('Initialization error:', error);
        if (error.message.includes('Not authenticated')) {
            alert('Please login first! (Set "token" in localStorage)');
        }
    }
}

function renderUI() {
    const { ui } = appState.settings;
    const { user } = appState;
    document.title = ui.title;
    document.getElementById('pageTitle').textContent = ui.dashboard_header;
    document.getElementById('boardHeader').textContent = ui.dashboard_header;
    
    // Greeting
    document.getElementById('userName').textContent = `${ui.welcome_prefix} ${user.name || user.username}!`;
    
    // Avatar handling
    const imgAvatar = document.getElementById('imgAvatar');
    const textAvatar = document.getElementById('textAvatar');
    
    if (user.avatar_url && imgAvatar && textAvatar) {
        imgAvatar.src = user.avatar_url;
        imgAvatar.style.display = 'block';
        textAvatar.style.display = 'none';
    } else if (textAvatar) {
        textAvatar.textContent = (user.name || user.username || "??").substring(0, 2).toUpperCase();
        if (imgAvatar) imgAvatar.style.display = 'none';
        textAvatar.style.display = 'block';
    }
}

function renderCategories() {
    const tagSelector = document.getElementById('tagSelector');
    if (!tagSelector) return;

    tagSelector.innerHTML = '';
    appState.categories.forEach(cat => {
        const span = document.createElement('span');
        span.className = 'tag tag--selectable';
        span.textContent = cat.category_name;
        span.addEventListener('click', () => {
            span.classList.toggle('selected');
        });
        tagSelector.appendChild(span);
    });
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
    
    // Status Circle
    const select = card.querySelector('.status-dropdown');
    select.value = task.status_id;
    select.setAttribute('data-status', task.status_id); 
    select.addEventListener('change', (e) => {
        handleStatusChange(task.id, parseInt(e.target.value));
    });

    // Content
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

async function handleStatusChange(taskId, newStatusId) {
    const statusMap = {
        0: 'pending',
        1: 'doing',
        2: 'completed'
    };

    try {
        await apiFetch(API_CONFIG.UPDATE_TASK(taskId), {
            method: 'PATCH',
            body: JSON.stringify({ status: statusMap[newStatusId] })
        });

        // Update local state and re-render
        const taskIndex = appState.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            appState.tasks[taskIndex].status_id = newStatusId;
            updateStats();
            renderTasks();
        }
    } catch (error) {
        alert('Failed to update status: ' + error.message);
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('th-TH', options);
}

