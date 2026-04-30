export async function loadSidebar(activePage) {
    const res = await fetch('./components/sidebar.html');
    const html = await res.text();
    document.getElementById('sidebar-placeholder').outerHTML = html;

    const link = document.querySelector(`.sidebar__link[data-page="${activePage}"]`);
    if (link) link.classList.add('sidebar__link--active');

    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('overlay');

    toggle.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('sidebar--active');
            overlay?.classList.toggle('overlay--active');
        } else {
            sidebar.classList.toggle('sidebar--expanded');
        }
    });

    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('sidebar--active');
        overlay.classList.remove('overlay--active');
    });

    // Add Logout Listener
    const logoutLink = document.querySelector('.sidebar__link[data-page="logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', () => {
            localStorage.removeItem('token');
        });
    }
}
