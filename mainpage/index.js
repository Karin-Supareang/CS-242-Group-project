/**
 * Smart Academic Planner - Final Polish
 */

import { loadSidebar } from './sidebar.js';

const API_BASE_URL = 'http://localhost:8080'; // URL ของ FastAPI Backend

let appState = {
    tasks: [],
    settings: {},
    user: {}
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadSidebar('home');
    initUI();
    loadApp();
});

function initUI() {
    const overlay = document.getElementById('overlay');

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
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("No token found. Redirecting to login page.");
        // ถ้าไม่มี token ให้กลับไปหน้า login
        window.location.href = 'login.html';
        return;
    }

    try {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // ดึงข้อมูล User และ Tasks จาก Backend จริง
        const [userRes, tasksRes] = await Promise.all([
            fetch(`${API_BASE_URL}/auth/me`, { headers }),
            fetch(`${API_BASE_URL}/assignment/get/all`, { headers })
        ]);

        // หาก Token ไม่ถูกต้อง (401) ให้ลบ Token ทิ้งแล้วกลับไปหน้า Login
        if (userRes.status === 401 || tasksRes.status === 401) {
            console.error("Authentication failed. Invalid token.");
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        if (!userRes.ok || !tasksRes.ok) {
            throw new Error(`Failed to fetch data: ${userRes.statusText} & ${tasksRes.statusText}`);
        }

        appState.user = await userRes.json();
        appState.tasks = await tasksRes.json();
        // ใช้ข้อมูล settings แบบ static ไปก่อน
        appState.settings = { ui: { title: "Smart Planner", dashboard_header: "Dashboard" } };

        renderUI();
        updateStats();
        renderTasks();
    } catch (error) {
        console.error('Initialization error:', error);
        // อาจจะแสดงข้อความ Error บนหน้าจอ
        document.getElementById('boardHeader').textContent = "Error loading data from server.";
    }
}

function renderUI() {
    const { ui } = appState.settings;
    const { user } = appState;
    document.title = ui.title;
    document.getElementById('pageTitle').textContent = ui.dashboard_header;
    document.getElementById('boardHeader').textContent = ui.dashboard_header;
    
    // Greeting
    const displayName = user.name || user.username || user.email.split('@')[0];
    document.getElementById('userName').textContent = `Hello, ${displayName}!`;
    
    // Avatar handling
    const imgAvatar = document.getElementById('imgAvatar');
    const textAvatar = document.getElementById('textAvatar');
    
    if (user.avatar_url && imgAvatar && textAvatar) {
        imgAvatar.src = user.avatar_url;
        imgAvatar.style.display = 'block';
        textAvatar.style.display = 'none';
    } else if (textAvatar) {
        textAvatar.textContent = user.initials || "RN";
        if (imgAvatar) imgAvatar.style.display = 'none';
        textAvatar.style.display = 'block';
    }
}

function updateStats() {
    const total = appState.tasks.length;
    const completed = appState.tasks.filter(t => t.status === 'completed').length;
    
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    const upcoming = appState.tasks.filter(t => {
        const d = new Date(t.deadline);
        return t.status !== 'completed' && d >= now && d <= nextWeek;
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
        // Backend มีแค่ 'pending' กับ 'completed'
        // เราจะจัดให้ 'pending' อยู่ใน 'Doing' และ 'completed' อยู่ใน 'Completed'
        if (task.status === 'completed') {
            listCompleted.appendChild(card);
            completedCount++;
        } else { // 'pending' or other statuses
            listDoing.appendChild(card);
        }
    });

    countCompleted.textContent = completedCount;
}

function createTaskCard(task) {
    const template = document.getElementById('taskTemplate');
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.task-card');
    
    // แปลง status string เป็น number สำหรับ dropdown
    const statusMap = { 'pending': 1, 'completed': 2 };
    const statusId = statusMap[task.status] || 0; // 0 for backlog/unknown

    // Status Circle (Select with no visible text)
    const select = card.querySelector('.status-dropdown');
    select.value = statusId;
    select.setAttribute('data-status', statusId); 
    select.addEventListener('change', (e) => {
        // แปลงค่ากลับเป็น string เพื่อส่งไปหา Backend
        const newStatusString = parseInt(e.target.value) === 2 ? 'completed' : 'pending';
        handleStatusChange(task.task_id, newStatusString);
    });

    // Horizontal Layout matching image 7.png
    const content = card.querySelector('.task-card__content');
    content.innerHTML = `
        <div class="task-card__info">
            <div class="task-card__header">
                <h4 class="task-card__title">${task.title}</h4>
            </div>
            <div class="task-card__tags">
                ${task.categories.map(cat => `<span class="tag" style="background-color: ${cat.color_code}20; color: ${cat.color_code};">${cat.category_name}</span>`).join('')}
            </div>
        </div>
        <span class="task-card__date">${formatDate(task.deadline)}</span>
    `;

    return card;
}

async function handleStatusChange(taskId, newStatusString) {
    const token = localStorage.getItem('token');
    const taskIndex = appState.tasks.findIndex(t => t.task_id === taskId);
    if (taskIndex !== -1) {
        try {
            const response = await fetch(`${API_BASE_URL}/assignment/update/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatusString })
            });
            if (!response.ok) throw new Error('Failed to update status');
            
            // อัปเดต state และ re-render
            appState.tasks[taskIndex].status = newStatusString;
            renderTasks();
            updateStats();
        } catch (error) {
            console.error("Error updating task status:", error);
            alert("Failed to update task status.");
            renderTasks(); // Re-render to revert the change in UI
        }
    }
}

function formatDate(dateString) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('th-TH', options);
}
