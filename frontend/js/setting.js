import { loadSidebar } from './sidebar.js';

// Apply saved theme immediately on load
(function () {
    const saved = localStorage.getItem('theme') || 'light';
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(saved + '-theme');
})();

// ---- STATE & CONFIG ----
const API_CONFIG = {
    USER: 'http://localhost:8080/auth/me'
};

let userState = {
    token: localStorage.getItem('token'),
    data: null
};

// ---- INITIALIZATION ----
document.addEventListener('DOMContentLoaded', async () => {
    // Redirect if no token
    if (!userState.token) {
        window.location.href = 'login.html';
        return;
    }

    // Load dynamic sidebar
    await loadSidebar('settings');
    
    // Initialize UI Components
    initTabs();
    initThemeSelector();
    initModals();
    initUserDropdown();
    
    // Load and Render User Data
    await loadUserData();
    renderProfileTab();
    renderHeader();
});

// ---- UI COMPONENTS ----

function initTabs() {
    const tabBtnProfile = document.getElementById('tabBtnProfile');
    const tabBtnTheme = document.getElementById('tabBtnTheme');

    tabBtnProfile?.addEventListener('click', () => showTab('profile', tabBtnProfile));
    tabBtnTheme?.addEventListener('click', () => showTab('theme', tabBtnTheme));
}

function showTab(tabName, clickedBtn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`${tabName}-tab`)?.classList.add('active');
    clickedBtn?.classList.add('active');
}

function initThemeSelector() {
    const boxLight = document.getElementById('themeBoxLight');
    const boxDark = document.getElementById('themeBoxDark');
    const saved = localStorage.getItem('theme') || 'light';

    // Highlight active box
    if (saved === 'light') boxLight?.classList.add('active');
    else boxDark?.classList.add('active');

    boxLight?.addEventListener('click', () => setTheme('light'));
    boxDark?.addEventListener('click', () => setTheme('dark'));
}

function setTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    
    document.querySelectorAll('.theme-box').forEach(box => box.classList.remove('active'));
    document.getElementById(`themeBox${theme.charAt(0).toUpperCase() + theme.slice(1)}`)?.classList.add('active');

    localStorage.setItem('theme', theme);
}

function initModals() {
    const modal = document.getElementById('deleteModal');
    const btnCancel = document.getElementById('btnCancelDelete');
    const btnConfirm = document.getElementById('btnConfirmDelete');

    btnCancel?.addEventListener('click', closeDeleteModal);
    btnConfirm?.addEventListener('click', confirmDelete);

    window.addEventListener('click', (event) => {
        if (event.target === modal) closeDeleteModal();
    });
}

function openDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('overlay--active');
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('overlay--active');
    }
}

function confirmDelete() {
    alert("ระบบกำลังลบข้อมูลและออกจากระบบ...");
    localStorage.removeItem('token');
    window.location.href = "login.html";
}

function initUserDropdown() {
    const btn = document.getElementById('userDropdownBtn');
    const menu = document.getElementById('userDropdownMenu');

    btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        menu?.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!btn?.contains(e.target)) {
            menu?.classList.remove('show');
        }
    });
}

// ---- DATA LOADING & RENDERING ----

async function loadUserData() {
    if (!userState.token) return;

    try {
        const res = await fetch(API_CONFIG.USER, {
            headers: { 'Authorization': `Bearer ${userState.token}` }
        });
        
        if (res.ok) {
            userState.data = await res.json();
        } else if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.warn('User data fetch failed');
    }
}

function renderHeader() {
    const userNameEl = document.getElementById('userName');
    const textAvatar = document.getElementById('textAvatar');
    const imgAvatar = document.getElementById('imgAvatar');
    const dropdownMenu = document.getElementById('userDropdownMenu');

    if (!userState.token || !userState.data) {
        if (userNameEl) userNameEl.textContent = 'Guest';
        if (textAvatar) textAvatar.textContent = 'G';
        return;
    }

    const { data } = userState;
    const displayName = data.name || data.username || 'User';
    
    if (userNameEl) userNameEl.textContent = `Welcome, ${displayName}!`;
    
    if (data.avatar_url) {
        if (imgAvatar) {
            imgAvatar.src = data.avatar_url;
            imgAvatar.style.display = 'block';
        }
        if (textAvatar) textAvatar.style.display = 'none';
    } else {
        if (textAvatar) {
            textAvatar.textContent = displayName.substring(0, 2).toUpperCase();
            textAvatar.style.display = 'block';
        }
        if (imgAvatar) imgAvatar.style.display = 'none';
    }

    if (dropdownMenu) renderUserDropdown(dropdownMenu, data);
}

function renderUserDropdown(menu, user) {
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
        <button class="user-dropdown-item" onclick="window.location.href='index.html'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Dashboard
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
        setTheme(current);
    });

    document.getElementById('btnSignOut')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
}

function renderProfileTab() {
    const board = document.getElementById('profileBoard');
    if (!board) return;

    if (!userState.token || !userState.data) {
        board.innerHTML = `<div style="text-align:center; padding: 48px 24px;">Loading...</div>`;
        return;
    }

    const user = userState.data;
    const displayName = user.name || user.username || 'User';
    const avatarUrl = user.avatar_url ? user.avatar_url : '';
    
    board.innerHTML = `
        <div class="profile-header">
            <div class="avatar-large" id="profileTabAvatar">
                ${avatarUrl ? `<img src="${avatarUrl}" id="profileTabImg" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : 
                `<span id="profileTabText">${displayName.substring(0, 2).toUpperCase()}</span>`}
            </div>
            <input type="file" id="inputAvatarFile" accept="image/*" style="display: none;">
            <button class="btn-dashed" id="btnEditPicture">Edit picture</button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">ชื่อ</label>
                <input type="text" class="form-input" id="fieldName" value="${user.name || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" class="form-input" id="fieldUsername" value="${user.username || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <div class="input-with-btn">
                    <input type="email" class="form-input" id="fieldEmail" value="${user.email || ''}">
                    <button class="btn-primary btn-sm">เปลี่ยน</button>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Password</label>
                <div class="input-with-btn">
                    <input type="password" class="form-input" value="******" disabled>
                    <button class="btn-primary btn-sm">เปลี่ยน</button>
                </div>
            </div>
        </div>
        <div class="actions">
            <button class="btn-primary" id="btnSaveProfile">บันทึก</button>
            <button class="btn-danger" id="btnOpenDelete">Delete profile and log out</button>
        </div>
    `;

    // Profile Picture Logic
    const btnEditPicture = document.getElementById('btnEditPicture');
    const inputAvatarFile = document.getElementById('inputAvatarFile');
    const profileTabAvatar = document.getElementById('profileTabAvatar');

    btnEditPicture?.addEventListener('click', () => inputAvatarFile?.click());

    inputAvatarFile?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target.result;
                profileTabAvatar.innerHTML = `<img src="${result}" id="profileTabImg" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                
                // Update header avatar too
                const imgHeader = document.getElementById('imgAvatar');
                const textHeader = document.getElementById('textAvatar');
                if (imgHeader) {
                    imgHeader.src = result;
                    imgHeader.style.display = 'block';
                }
                if (textAvatar) textAvatar.style.display = 'none';
                
                // Update state (simulation)
                if (userState.data) userState.data.avatar_url = result;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('btnSaveProfile')?.addEventListener('click', () => {
        alert("บันทึกข้อมูลเรียบร้อยแล้ว! (จำลองการทำงาน)");
    });

    document.getElementById('btnOpenDelete')?.addEventListener('click', openDeleteModal);
}
