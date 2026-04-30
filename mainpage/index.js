/**
 * Smart Academic Planner - Final Polish
 */

import { loadSidebar } from './sidebar.js';

const API_BASE_URL = 'http://localhost:8080'; // URL ของ FastAPI Backend
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
    categories: [], // State for all available categories
    user: {},
    token: localStorage.getItem('token')
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. ดักจับ Token จาก URL (กรณี Redirect กลับมาจาก Google)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
        localStorage.setItem('token', urlToken);
        appState.token = urlToken;
        // เคลียร์ Token ออกจาก URL เพื่อไม่ให้รกและป้องกันคนอื่นก๊อปปี้ไป
        window.history.replaceState({}, document.title, window.location.pathname);
    }

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
            
            // สร้างปุ่ม Tag ใหม่โดยดึงข้อมูลจาก Categories ที่มีอยู่จริง
            const tagSelector = document.getElementById('tagSelector');
            if (tagSelector) {
                const cats = appState.categories || [];
                const existingTags = Array.from(tagSelector.querySelectorAll('.tag--selectable'));
                
                // 1. ตรวจสอบ Tag เดิมใน HTML ว่ามีในฐานข้อมูลหรือยัง ถ้ามีให้ฝัง ID เอาไว้
                existingTags.forEach(tagEl => {
                    const tagName = tagEl.textContent.trim().toLowerCase();
                    const matchedCat = cats.find(c => c.category_name.toLowerCase() === tagName);
                    if (matchedCat) {
                        tagEl.dataset.categoryId = matchedCat.category_id;
                    }
                });
                
                // 2. ดึง Category อื่นๆ จากฐานข้อมูลที่ยังไม่มีบนหน้าจอมาแสดงเพิ่ม
                cats.forEach(cat => {
                    const exists = existingTags.some(tagEl => tagEl.textContent.trim().toLowerCase() === cat.category_name.toLowerCase());
                    if (!exists) {
                        const span = document.createElement('span');
                        span.className = 'tag tag--selectable';
                        span.textContent = cat.category_name;
                        span.dataset.categoryId = cat.category_id; // ฝัง ID ลงไปในปุ่ม
                        span.style.backgroundColor = `${cat.color_code}20`;
                        span.style.color = cat.color_code;
                        span.addEventListener('click', () => span.classList.toggle('selected'));
                        tagSelector.appendChild(span);
                    }
                });
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
        btnNewTag.addEventListener('click', async () => {
            const tagName = prompt("Enter new tag name:");
            if (tagName && tagName.trim() !== '') {
                // สุ่มสี Hex Code (เช่น #FF5733) ให้ตรงกับรูปแบบในฐานข้อมูล
                const randomHexColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                
                try {
                    // ยิง API ไปสร้าง Category ใหม่ (คุณอาจจะต้องเช็กว่า Endpoint เป็น /category/post หรือ /category)
                    const response = await fetch(`${API_BASE_URL}/category/post`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${appState.token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            category_name: tagName.trim(),
                            color_code: randomHexColor
                        })
                    });

                    if (!response.ok) throw new Error('ไม่สามารถสร้างหมวดหมู่ใหม่ในระบบได้');
                    const newCategory = await response.json();

                    // สร้างปุ่ม Tag ใหม่และฝัง category_id ที่ได้จาก Backend
                    const newTag = document.createElement('span');
                    newTag.className = `tag tag--selectable selected`;
                    newTag.textContent = newCategory.category_name;
                    newTag.dataset.categoryId = newCategory.category_id || newCategory.id;
                    newTag.style.backgroundColor = `${newCategory.color_code || randomHexColor}20`;
                    newTag.style.color = newCategory.color_code || randomHexColor;
                    
                    tagSelector.appendChild(newTag);
                    bindTagClick(newTag);
                    
                    // เก็บลง State ป้องกันการสับสน
                    if (!appState.categories) appState.categories = [];
                    appState.categories.push(newCategory);
                } catch (error) {
                    alert("เกิดข้อผิดพลาด: " + error.message);
                }
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
        btnSubmitTask.addEventListener('click', async () => {
            const name = document.getElementById('inputTaskName').value;
            const date = document.getElementById('inputTaskDate').value;
            const estTime = document.getElementById('inputTaskEstTime')?.value;
            const note = document.getElementById('inputTaskNote').value;
            
            if (!name) {
                alert("Please enter a task name.");
                return;
            }

            // ดึง ID ออกมาจากปุ่ม Tag ที่ผู้ใช้เลือกตรงๆ
            const selectedTagElements = document.querySelectorAll('.tag-selector .tag--selectable.selected');
            const categoryIds = [];
            
            for (const tagEl of selectedTagElements) {
                let catId = parseInt(tagEl.dataset.categoryId);
                
                // ถ้าเป็น Tag ปลอมใน HTML ที่ยังไม่มี ID ในฐานข้อมูล ให้สร้าง Category ใหม่ให้อัตโนมัติ
                if (isNaN(catId)) {
                    const tagName = tagEl.textContent.trim();
                    const randomHexColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                    try {
                        const catRes = await fetch(`${API_BASE_URL}/category/post`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${appState.token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ category_name: tagName, color_code: randomHexColor })
                        });
                        if (catRes.ok) {
                            const newCat = await catRes.json();
                            catId = newCat.category_id || newCat.id;
                            tagEl.dataset.categoryId = catId; // เซฟ ID เก็บไว้ใช้ครั้งต่อไป
                            appState.categories.push(newCat);
                        }
                    } catch (e) {
                        console.error("Failed to auto-create category for hardcoded tag:", e);
                    }
                }
                if (!isNaN(catId)) {
                    categoryIds.push(catId);
                }
            }

            const newTaskData = {
                title: name,
                description: note,
                deadline: date ? new Date(new Date(date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19),
                status: "pending",
                priority: 1,
                estimated_time: estTime ? parseInt(estTime) : null,
                percentage: 0,
                category_ids: categoryIds
            };

            const submitBtn = document.getElementById('btnSubmitTask');
            submitBtn.disabled = true;
            submitBtn.textContent = 'กำลังบันทึก...';

            try {
                const response = await fetch(`${API_BASE_URL}/assignment/post`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${appState.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newTaskData)
                });

                if (!response.ok) throw new Error('Failed to create task');
                const createdTask = await response.json();
                
                // อัปโหลดไฟล์ (ถ้ามีการแนบไฟล์มาด้วย)
                const fileInput = document.getElementById('fileInput');
                if (fileInput && fileInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append('task_id', createdTask.task_id);
                    formData.append('file', fileInput.files[0]);
                    
                    submitBtn.textContent = 'AI กำลังวิเคราะห์...';
                    await fetch(`${API_BASE_URL}/assignment/upload`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${appState.token}` },
                        body: formData
                    });
                }

                alert("สร้างงานสำเร็จ!");
                await loadApp(); // โหลดข้อมูลใหม่ทั้งหมดจาก Backend เพื่อรีเฟรชตาราง

            // Reset form
            document.getElementById('inputTaskName').value = '';
            document.getElementById('inputTaskDate').value = '';
            if (document.getElementById('inputTaskEstTime')) document.getElementById('inputTaskEstTime').value = '';
            document.getElementById('inputTaskNote').value = '';
            if (fileInput) fileInput.value = '';
            if (uploadText) uploadText.textContent = 'อัปโหลดไฟล์';
            document.querySelectorAll('.tag-selector .tag--selectable.selected').forEach(tag => tag.classList.remove('selected'));
            
            if (addTaskSidebar) addTaskSidebar.classList.remove('add-task-sidebar--open');
            overlay.classList.remove('overlay--active');
            } catch (error) {
                console.error("Error creating task:", error);
                alert("เกิดข้อผิดพลาด: " + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'เพิ่มงาน';
            }
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
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("No token found. Redirecting to login page.");
        // ถ้าไม่มี token ให้กลับไปหน้า login
        window.location.href = 'login.html';
        return;
    }

    // อัปเดตตัวแปรใน State ให้เป็นค่าล่าสุดเสมอ ป้องกันกรณี Token เพิ่งถูกเซ็ตใหม่จาก URL
    appState.token = token;

    try {
        const settingsRes = await fetch(API_CONFIG.SETTINGS);
        appState.settings = await settingsRes.json();

        // User Loading
        if (appState.token) {
            try {
                // Fetch all user categories first to populate the tag selector
                const catRes = await fetch(`${API_BASE_URL}/category/get/all`, {
                    headers: { 'Authorization': `Bearer ${appState.token}` }
                });
                if (catRes.ok) {
                    appState.categories = await catRes.json();
                } else {
                    appState.categories = [];
                }
            } catch (e) {
                console.warn("Could not fetch categories, tag selection might be limited.");
                appState.categories = [];
            }
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

        // Tasks Loading จาก Backend จริงๆ
        if (appState.token) {
            try {
                const tasksRes = await fetch(`${API_BASE_URL}/assignment/get/all`, {
                    headers: { 'Authorization': `Bearer ${appState.token}` }
                });
                if (tasksRes.ok) {
                    appState.tasks = await tasksRes.json();
                } else {
                    const data = await (await fetch(API_CONFIG.DASHBOARD)).json();
                    appState.tasks = data.tasks;
                }
            } catch (e) {
                const data = await (await fetch(API_CONFIG.DASHBOARD)).json();
                appState.tasks = data.tasks;
            }
        } else {
            const data = await (await fetch(API_CONFIG.DASHBOARD)).json();
            appState.tasks = data.tasks;
        }

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
    
    // ยึดตาม name (ชื่อ-นามสกุล) ก่อน ถ้าไม่มีค่อยใช้ username หรือคำหน้า @ ของอีเมล
    const displayName = user.name || user.username || (user.email ? user.email.split('@')[0] : 'Guest');
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
        if (task.status === 'completed') {
            listCompleted.appendChild(card);
            completedCount++;
        } else if (task.status === 'doing') {
            listDoing.appendChild(card);
        } else {
            listBacklog.appendChild(card);
        }
    });
    countCompleted.textContent = completedCount;
}

function createTaskCard(task) {
    const template = document.getElementById('taskTemplate');
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.task-card');
    
    const taskId = task.task_id || task.id;
    const statusId = task.status === 'completed' ? 2 : (task.status === 'doing' ? 1 : 0);
    
    const select = card.querySelector('.status-dropdown');
    select.value = statusId;
    select.setAttribute('data-status', statusId); 
    select.addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        const statusStr = val === 2 ? 'completed' : (val === 1 ? 'doing' : 'pending');
        handleStatusChange(taskId, statusStr);
    });

    let tagsHtml = '';
    if (task.categories && task.categories.length > 0) {
        tagsHtml = task.categories.map(cat => `<span class="tag" style="background-color: ${cat.color_code}20; color: ${cat.color_code};">${cat.category_name}</span>`).join('');
    } else if (task.tags && task.tags.length > 0) {
        tagsHtml = task.tags.map(t => `<span class="tag tag--${t.toLowerCase()}">${t}</span>`).join('');
    }

    const content = card.querySelector('.task-card__content');
    content.innerHTML = `
        <div class="task-card__info" style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
            <div class="task-card__header" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; gap: 12px;">
                <h4 class="task-card__title" style="margin: 0; word-break: break-word; line-height: 1.4;">${task.title}</h4>
            </div>
            <div class="task-card__tags">
                ${tagsHtml}
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <span class="task-card__date">${formatDate(task.deadline)} ${task.deadline ? new Date(task.deadline).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) + ' น.' : ''}</span>
            <div class="task-card__percentage" style="display: flex; align-items: center; gap: 4px;" title="แก้ไขความคืบหน้า (%)">
                <input type="number" class="pct-input" value="${task.percentage || 0}" min="0" max="100" style="width: 50px; padding: 2px 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.75rem; text-align: center; font-family: inherit; outline: none; transition: border-color 0.2s;">
                <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">%</span>
            </div>
        </div>
    `;

    // ทำให้เนื้อหาของการ์ดกดคลิกได้เพื่อเปิดดูรายละเอียด
    content.style.cursor = 'pointer';
    content.addEventListener('click', (e) => {
        // ป้องกันไม่ให้เด้ง Modal ตอนที่ผู้ใช้แค่จะกดพิมพ์เปอร์เซ็นต์
        if (e.target.classList.contains('pct-input')) return;
        showTaskDetails(task);
    });
    
    // ป้องกันการคลิก dropdown แล้วดันไปเปิด modal ให้หยุดแค่ตรง dropdown
    select.addEventListener('click', (e) => e.stopPropagation());

    const pctInput = card.querySelector('.pct-input');
    if (pctInput) {
        pctInput.addEventListener('change', async (e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val)) val = 0;
            if (val > 100) val = 100;
            if (val < 0) val = 0;
            e.target.value = val;
            await handlePercentageChange(taskId, val);
        });
        pctInput.addEventListener('focus', () => pctInput.style.borderColor = '#3b82f6');
        pctInput.addEventListener('blur', () => pctInput.style.borderColor = '#cbd5e1');
    }

    return card;
}

async function handlePercentageChange(taskId, newPercentage) {
    const token = localStorage.getItem('token');
    const taskIndex = appState.tasks.findIndex(t => (t.task_id || t.id) === taskId);
    if (taskIndex !== -1) {
        try {
            let payload = { percentage: newPercentage };
            // ทำให้ฉลาดขึ้น: ถ้าปรับเป็น 100% ให้ปรับ status เป็นเสร็จสิ้นด้วย
            if (newPercentage >= 100) {
                payload.status = 'completed';
            } else if (appState.tasks[taskIndex].status === 'completed' && newPercentage < 100) {
                payload.status = 'doing'; // ถ้าดึงกลับลงมาจาก 100 ให้เด้งกลับมากำลังทำ
            }

            const response = await fetch(`${API_BASE_URL}/assignment/update/${taskId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to update percentage');
            
            const updatedTask = await response.json();
            appState.tasks[taskIndex] = updatedTask;
            renderTasks();
            updateStats();
        } catch (error) {
            console.error("Error updating percentage:", error);
            alert("Failed to update percentage.");
            renderTasks(); // Re-render to revert the change in UI if failed
        }
    }
}

async function handleStatusChange(taskId, newStatusString) {
    const token = localStorage.getItem('token');
    const taskIndex = appState.tasks.findIndex(t => t.task_id === taskId);
    if (taskIndex !== -1) {
        try {
            let payload = { status: newStatusString };
            // ถ้าเปลี่ยนจาก Dropdown เป็น Completed ก็ดันให้ Percent เต็ม 100 เลย
            if (newStatusString === 'completed') {
                payload.percentage = 100;
            }

            const response = await fetch(`${API_BASE_URL}/assignment/update/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to update status');
            
            // อัปเดต state และ re-render
            const updatedTask = await response.json();
            appState.tasks[taskIndex] = updatedTask;
            renderTasks();
            updateStats();
        } catch (error) {
            console.error("Error updating task status:", error);
            alert("Failed to update task status.");
            renderTasks(); // Re-render to revert the change in UI
        }
    }
}

function showTaskDetails(task) {
    const existing = document.getElementById('taskDetailModal');
    if (existing) existing.remove();

    const statusId = task.status === 'completed' ? 2 : (task.status === 'doing' ? 1 : 0);
    let badgeLabel = 'ยังไม่ส่ง';
    let badgeBg = '#ffebeb';
    let badgeColor = '#ff5c5c';
    if (statusId === 2) { badgeLabel = 'ส่งแล้ว'; badgeBg = '#e8f8f0'; badgeColor = '#27ae60'; }
    else if (statusId === 1) { badgeLabel = 'กำลังทำ'; badgeBg = '#eff6ff'; badgeColor = '#3b82f6'; }

    let tagsHtml = '-';
    if (task.categories && task.categories.length > 0) {
        tagsHtml = task.categories.map(cat => `<span style="background-color: ${cat.color_code}20; color: ${cat.color_code}; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; margin-right: 5px; font-weight: 600;">${cat.category_name}</span>`).join('');
    } else if (task.tags && task.tags.length > 0) {
        tagsHtml = task.tags.map(t => `<span style="background-color: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; margin-right: 5px; font-weight: 600;">${t}</span>`).join('');
    }

    const modalHtml = `
        <div id="taskDetailModal" class="overlay overlay--active" style="display: flex; justify-content: center; align-items: center; z-index: 3000; background-color: rgba(0,0,0,0.5);">
            <div style="background: #ffffff; padding: 30px; border-radius: 16px; width: 90%; max-width: 500px; color: #333333; box-shadow: 0 10px 25px rgba(0,0,0,0.2); position: relative;">
                <button id="btnCloseModal" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #888;">&times;</button>
                
                <h2 style="margin: 0 0 20px 0; color: #585191; font-size: 1.5rem; padding-right: 30px;">${task.title}</h2>
                
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px; margin-bottom: 20px; font-size: 0.95rem;">
                    <div style="color: #666; font-weight: 600;">กำหนดส่ง:</div>
                    <div>${formatDate(task.deadline)} ${task.deadline ? new Date(task.deadline).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) + ' น.' : ''}</div>
                    
                    <div style="color: #666; font-weight: 600;">สถานะ:</div>
                    <div><span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: ${badgeColor}; background: ${badgeBg};">${badgeLabel}</span></div>
                    
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
                    const res = await fetch(`${API_BASE_URL}/assignment/delete/${taskId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) throw new Error('ไม่สามารถลบงานได้');
                    
                    const taskIndex = appState.tasks.findIndex(t => (t.task_id || t.id) === taskId);
                    if (taskIndex > -1) {
                        appState.tasks.splice(taskIndex, 1);
                    }
                    renderTasks();
                    updateStats();
                    closeModal();
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            }
        });
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
