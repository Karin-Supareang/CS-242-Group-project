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

let isChanged = false; //is there any changes that you didn't save?
let pendingTab = '';

// 1. Click on  "เปลี่ยน"  to edit text
function enableEdit(inputId) {
    const input = document.getElementById(inputId);
    const warn = document.getElementById('warn-' + inputId);
    
    input.removeAttribute('readonly'); //you can edit the text now
    input.focus();
    input.classList.add('editing'); //red border
    warn.style.display = 'block'; //warning text
    isChanged = true; //change status
}

// 2.ปุ่ม บันทึก
function saveData() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
        input.classList.remove('editing');
    });
    
    document.querySelectorAll('.unsaved-warn').forEach(w => w.style.display = 'none');

    //show Success Bubble
    const bubble = document.getElementById('successBubble');
    bubble.style.display = 'block';
    setTimeout(() => { bubble.style.display = 'none'; }, 2000);

    isChanged = false; //reset status
}

// 3.check that we save before proceed to other tab/page
function checkNavigation(tabName) {
    if (isChanged) {
        pendingTab = tabName;
        document.getElementById('unsavedOverlay').style.display = 'flex';
    } else {
        showTab(tabName);
    }
}

function saveAndLeave() {
    saveData();
    document.getElementById('unsavedOverlay').style.display = 'none';
    if (pendingTab) showTab(pendingTab);
}

function closeUnsavedModal() {
    document.getElementById('unsavedOverlay').style.display = 'none';
}