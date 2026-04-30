import { loadSidebar } from './sidebar.js';

// Apply saved theme immediately on load
(function () {
    const saved = localStorage.getItem('theme') || 'light';
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(saved + '-theme');
})();

// ---- STATE & CONFIG ----
const API_CONFIG = {
    USER: './test/user.json',
    AUTH_ME: 'http://localhost:8080/auth/me'
};

let userState = {
    token: localStorage.getItem('token'),
    data: null
};

// ---- INITIALIZATION ----
document.addEventListener('DOMContentLoaded', async () => {
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
        // Try real API first
        const res = await fetch(API_CONFIG.AUTH_ME, {
            headers: { 'Authorization': `Bearer ${userState.token}` }
        });
        
        if (res.ok) {
            userState.data = await res.json();
        } else {
            // Fallback to local test data
            const testRes = await fetch(API_CONFIG.USER);
            if (testRes.ok) userState.data = await testRes.json();
        }
    } catch (error) {
        console.warn('User data fetch failed, using defaults');
        try {
            const testRes = await fetch(API_CONFIG.USER);
            if (testRes.ok) userState.data = await testRes.json();
        } catch (e) {}
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
        if (dropdownMenu) renderGuestDropdown(dropdownMenu);
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

function renderGuestDropdown(menu) {
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

    if (!userState.token) {
        board.innerHTML = `
            <div style="text-align:center; padding: 48px 24px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
                <h3 style="margin-bottom: 8px; color: var(--text-main);">คุณยังไม่ได้เข้าสู่ระบบ</h3>
                <p style="color: var(--text-muted); margin-bottom: 24px; line-height: 1.6;">
                    กรุณาเข้าสู่ระบบก่อนเพื่อดูและแก้ไขข้อมูลโปรไฟล์ของคุณ
                </p>
                <a href="login.html" class="btn-primary" style="text-decoration:none; padding: 10px 28px; border-radius: 8px; display:inline-block;">
                    เข้าสู่ระบบ / สมัครสมาชิก
                </a>
            </div>
        `;
    } else {
        const user = userState.data || { name: '', username: '', email: '' };
        const displayName = user.name || user.username || 'US';
        
        board.innerHTML = `
            <div class="profile-header">
                <div class="avatar-large">${displayName.substring(0, 2).toUpperCase()}</div>
                <button class="btn-dashed">Edit picture</button>
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

        document.getElementById('btnSaveProfile')?.addEventListener('click', () => {
            alert("บันทึกข้อมูลเรียบร้อยแล้ว! (จำลองการทำงาน)");
        });

        document.getElementById('btnOpenDelete')?.addEventListener('click', openDeleteModal);
    }
}
