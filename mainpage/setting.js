//swap to profile/theme
function showTab(tabName) {
    //hide content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });

    //display only chosen tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.currentTarget.classList.add('active');
}

//change Theme
function setTheme(theme) {
    const body = document.body;
    const boxes = document.querySelectorAll('.theme-box');
    
    boxes.forEach(box => box.classList.remove('active'));
    
    if (theme === 'dark') {
        body.classList.replace('light-theme', 'dark-theme');
        document.querySelector('.theme-box.dark').classList.add('active');
    } else {
        body.classList.replace('dark-theme', 'light-theme');
        document.querySelector('.theme-box.light').classList.add('active');
    }
}

//==== Modal appear ("delete the profile and log out" button)
function openDeleteModal() {
    document.getElementById('deleteModal').style.display = 'flex';
}

//close modal when click "cancel" button
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

//confirm delete
function confirmDelete() {
    alert("ระบบกำลังลบข้อมูลและออกจากระบบ...");
    
    //back to Login
    window.location.href = "login.html";
}

//close modal when click other space
window.onclick = function(event) {
    const modal = document.getElementById('deleteModal');
    if (event.target == modal) {
        closeDeleteModal();
    }
}