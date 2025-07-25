// Main application logic
import { 
    loginUser, 
    registerUser, 
    logoutUser, 
    getCurrentUser,
    getTeachers,
    getStudents,
    bookAppointment,
    getAppointments,
    updateAppointmentStatus,
    sendMessage,
    getMessages,
    approveUser,
    deleteUser
} from './auth.js';

// Demo users for presentation (will be created in Firebase on first run)
const DEMO_USERS = {
    'admin@edubook.com': {
        password: 'admin123',
        userType: 'admin',
        name: 'Admin User',
        uid: 'demo-admin-uid'
    },
    'teacher@edubook.com': {
        password: 'teacher123',
        userType: 'teacher',
        name: 'Dr. John Smith',
        department: 'Computer Science',
        subject: 'Data Structures',
        uid: 'demo-teacher-uid'
    },
    'student@edubook.com': {
        password: 'student123',
        userType: 'student',
        name: 'Alice Johnson',
        uid: 'demo-student-uid'
    }
};

// Mock authentication functions
async function loginUser(email, password, userType) {
    logger.info('LOGIN_ATTEMPT', { email, userType });
    
    if (DEMO_USERS[email] && DEMO_USERS[email].password === password) {
        const user = DEMO_USERS[email];
        
        if (userType && user.userType !== userType) {
            throw new Error('Invalid user type for this account');
        }
        
        const mockUser = {
            uid: user.uid,
            email: email,
            userType: user.userType,
            name: user.name,
            department: user.department || null,
            subject: user.subject || null
        };
        
        localStorage.setItem('currentUser', JSON.stringify(mockUser));
        logger.success('LOGIN_SUCCESS', { userId: user.uid, userType: user.userType });
        
        return mockUser;
    } else {
        throw new Error('Invalid email or password');
    }
}

async function logoutUser() {
    try {
        const currentUser = getCurrentUser();
        localStorage.removeItem('currentUser');
        logger.success('LOGOUT_SUCCESS', { userId: currentUser?.uid });
    } catch (error) {
        logger.error('LOGOUT_FAILED', { error: error.message });
        throw error;
    }
}

function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Global variables
let currentUser = null;
let currentUserType = null;

// DOM elements
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const userTypeSelect = document.getElementById('userType');
const teacherFields = document.getElementById('teacherFields');

// Modal functions
window.showLoginModal = function(userType) {
    logger.trackUserAction('SHOW_LOGIN_MODAL', 'login_button', { userType });
    currentUserType = userType;
    document.getElementById('modalTitle').textContent = `${userType.charAt(0).toUpperCase() + userType.slice(1)} Login`;
    loginModal.style.display = 'block';
}

window.closeModal = function() {
    logger.trackUserAction('CLOSE_LOGIN_MODAL', 'close_button');
    loginModal.style.display = 'none';
}

window.showRegisterModal = function() {
    logger.trackUserAction('SHOW_REGISTER_MODAL', 'register_link');
    loginModal.style.display = 'none';
    registerModal.style.display = 'block';
}

window.closeRegisterModal = function() {
    logger.trackUserAction('CLOSE_REGISTER_MODAL', 'close_button');
    registerModal.style.display = 'none';
}

window.showLoginModalFromRegister = function() {
    logger.trackUserAction('SHOW_LOGIN_FROM_REGISTER', 'login_link');
    registerModal.style.display = 'none';
    loginModal.style.display = 'block';
}

// Show/hide teacher fields in registration
userTypeSelect?.addEventListener('change', function() {
    if (this.value === 'teacher') {
        teacherFields.style.display = 'block';
    } else {
        teacherFields.style.display = 'none';
    }
});

// Login form submission
loginForm?.addEventListener('submit', async function(e) {
    e.preventDefault();
    logger.trackUserAction('LOGIN_FORM_SUBMIT', 'login_form');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const user = await loginUser(email, password, currentUserType);
        currentUser = user;
        
        // Hide modal and show dashboard
        closeModal();
        showDashboard(user);
        
        showNotification('Login successful!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// Register form submission
registerForm?.addEventListener('submit', async function(e) {
    e.preventDefault();
    logger.trackUserAction('REGISTER_FORM_SUBMIT', 'register_form');
    
    const formData = new FormData(this);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        userType: formData.get('userType'),
        department: formData.get('department'),
        subject: formData.get('subject')
    };
    
    try {
        await registerUser(userData);
        closeRegisterModal();
        
        if (userData.userType === 'teacher') {
            showNotification('Registration successful! Please wait for admin approval.', 'success');
        } else {
            showNotification('Registration successful! You can now login.', 'success');
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// Dashboard functions
function showDashboard(user) {
    logger.trackPageView(`${user.userType}_dashboard`);
    
    // Hide home page
    document.querySelector('.container').style.display = 'none';
    
    // Create and show dashboard
    const dashboardHTML = getDashboardHTML(user);
    document.body.insertAdjacentHTML('beforeend', dashboardHTML);
    
    // Initialize dashboard functionality
    initializeDashboard(user);
}

function getDashboardHTML(user) {
    const dashboardBase = `
        <div id="dashboard" class="dashboard active">
            <div class="dashboard-header">
                <div class="user-info">
                    <i class="fas fa-user-circle" style="font-size: 2rem; margin-right: 0.5rem;"></i>
                    <div>
                        <h3>${user.name}</h3>
                        <p>${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}${user.department ? ` - ${user.department}` : ''}</p>
                    </div>
                </div>
                <button class="logout-btn" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
            <div class="dashboard-content">
                ${getSidebarHTML(user.userType)}
                <div class="content-area">
                    ${getContentAreaHTML(user.userType)}
                </div>
            </div>
        </div>
    `;
    return dashboardBase;
}

function getSidebarHTML(userType) {
    const sidebarItems = {
        admin: [
            { id: 'dashboard', icon: 'fas fa-tachometer-alt', text: 'Dashboard' },
            { id: 'manage-teachers', icon: 'fas fa-chalkboard-teacher', text: 'Manage Teachers' },
            { id: 'manage-students', icon: 'fas fa-user-graduate', text: 'Manage Students' },
            { id: 'all-appointments', icon: 'fas fa-calendar-alt', text: 'All Appointments' },
            { id: 'system-logs', icon: 'fas fa-list-alt', text: 'System Logs' }
        ],
        teacher: [
            { id: 'dashboard', icon: 'fas fa-tachometer-alt', text: 'Dashboard' },
            { id: 'appointments', icon: 'fas fa-calendar-alt', text: 'My Appointments' },
            { id: 'messages', icon: 'fas fa-envelope', text: 'Messages' },
            { id: 'schedule', icon: 'fas fa-clock', text: 'Schedule' }
        ],
        student: [
            { id: 'dashboard', icon: 'fas fa-tachometer-alt', text: 'Dashboard' },
            { id: 'book-appointment', icon: 'fas fa-calendar-plus', text: 'Book Appointment' },
            { id: 'my-appointments', icon: 'fas fa-calendar-alt', text: 'My Appointments' },
            { id: 'messages', icon: 'fas fa-envelope', text: 'Messages' },
            { id: 'search-teachers', icon: 'fas fa-search', text: 'Search Teachers' }
        ]
    };
    
    const items = sidebarItems[userType] || [];
    const itemsHTML = items.map(item => 
        `<li><a href="#" onclick="showSection('${item.id}')" class="${item.id === 'dashboard' ? 'active' : ''}">
            <i class="${item.icon}"></i> ${item.text}
        </a></li>`
    ).join('');
    
    return `
        <div class="sidebar">
            <ul>
                ${itemsHTML}
            </ul>
        </div>
    `;
}

function getContentAreaHTML(userType) {
    switch (userType) {
        case 'admin':
            return getAdminContentHTML();
        case 'teacher':
            return getTeacherContentHTML();
        case 'student':
            return getStudentContentHTML();
        default:
            return '<div class="content-section active"><h2>Welcome!</h2></div>';
    }
}

function getAdminContentHTML() {
    return `
        <div id="dashboard" class="content-section active">
            <h2>Admin Dashboard</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4 id="totalTeachers">0</h4>
                    <p>Total Teachers</p>
                </div>
                <div class="stat-card">
                    <h4 id="totalStudents">0</h4>
                    <p>Total Students</p>
                </div>
                <div class="stat-card">
                    <h4 id="totalAppointments">0</h4>
                    <p>Total Appointments</p>
                </div>
                <div class="stat-card">
                    <h4 id="pendingApprovals">0</h4>
                    <p>Pending Approvals</p>
                </div>
            </div>
            <div class="card">
                <h3>Recent Activities</h3>
                <div id="recentActivities">Loading...</div>
            </div>
        </div>
        
        <div id="manage-teachers" class="content-section">
            <h2>Manage Teachers</h2>
            <div class="card">
                <h3>Teacher Management</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="teachersTable">
                        <tr><td colspan="6">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="manage-students" class="content-section">
            <h2>Manage Students</h2>
            <div class="card">
                <h3>Student Management</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTable">
                        <tr><td colspan="4">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="all-appointments" class="content-section">
            <h2>All Appointments</h2>
            <div class="card">
                <h3>Appointment Management</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Teacher</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="allAppointmentsTable">
                        <tr><td colspan="7">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="system-logs" class="content-section">
            <h2>System Logs</h2>
            <div class="card">
                <h3>Application Logs</h3>
                <div class="action-btns" style="margin-bottom: 1rem;">
                    <button class="btn btn-primary" onclick="refreshLogs()">Refresh</button>
                    <button class="btn btn-secondary" onclick="exportLogs()">Export</button>
                    <button class="btn btn-warning" onclick="clearLogs()">Clear Logs</button>
                </div>
                <div id="logsContainer" style="max-height: 400px; overflow-y: auto; background: #f8f9fa; padding: 1rem; border-radius: 4px;">
                    Loading logs...
                </div>
            </div>
        </div>
    `;
}

function getTeacherContentHTML() {
    return `
        <div id="dashboard" class="content-section active">
            <h2>Teacher Dashboard</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4 id="myAppointments">0</h4>
                    <p>My Appointments</p>
                </div>
                <div class="stat-card">
                    <h4 id="pendingAppointments">0</h4>
                    <p>Pending Appointments</p>
                </div>
                <div class="stat-card">
                    <h4 id="unreadMessages">0</h4>
                    <p>Unread Messages</p>
                </div>
            </div>
        </div>
        
        <div id="appointments" class="content-section">
            <h2>My Appointments</h2>
            <div class="card">
                <h3>Appointment Requests</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="teacherAppointmentsTable">
                        <tr><td colspan="7">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="messages" class="content-section">
            <h2>Messages</h2>
            <div class="card">
                <h3>My Messages</h3>
                <div id="messagesContainer">
                    Loading messages...
                </div>
            </div>
        </div>
        
        <div id="schedule" class="content-section">
            <h2>My Schedule</h2>
            <div class="card">
                <h3>Weekly Schedule</h3>
                <p>Schedule management feature coming soon...</p>
            </div>
        </div>
    `;
}

function getStudentContentHTML() {
    return `
        <div id="dashboard" class="content-section active">
            <h2>Student Dashboard</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4 id="myAppointments">0</h4>
                    <p>My Appointments</p>
                </div>
                <div class="stat-card">
                    <h4 id="upcomingAppointments">0</h4>
                    <p>Upcoming</p>
                </div>
                <div class="stat-card">
                    <h4 id="unreadMessages">0</h4>
                    <p>Unread Messages</p>
                </div>
            </div>
        </div>
        
        <div id="book-appointment" class="content-section">
            <h2>Book Appointment</h2>
            <div class="card">
                <h3>Schedule a Meeting</h3>
                <form id="appointmentForm">
                    <div class="form-group">
                        <label for="teacherSelect">Select Teacher:</label>
                        <select id="teacherSelect" name="teacherId" required>
                            <option value="">Loading teachers...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="appointmentDate">Date:</label>
                        <input type="date" id="appointmentDate" name="date" required>
                    </div>
                    <div class="form-group">
                        <label for="appointmentTime">Time:</label>
                        <input type="time" id="appointmentTime" name="time" required>
                    </div>
                    <div class="form-group">
                        <label for="appointmentSubject">Subject:</label>
                        <input type="text" id="appointmentSubject" name="subject" required>
                    </div>
                    <div class="form-group">
                        <label for="appointmentMessage">Message:</label>
                        <textarea id="appointmentMessage" name="message" rows="4" placeholder="Describe the purpose of your appointment..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Book Appointment</button>
                </form>
            </div>
        </div>
        
        <div id="my-appointments" class="content-section">
            <h2>My Appointments</h2>
            <div class="card">
                <h3>Appointment History</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentAppointmentsTable">
                        <tr><td colspan="6">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="messages" class="content-section">
            <h2>Messages</h2>
            <div class="card">
                <h3>My Messages</h3>
                <div class="action-btns" style="margin-bottom: 1rem;">
                    <button class="btn btn-primary" onclick="showSendMessageModal()">Send New Message</button>
                </div>
                <div id="messagesContainer">
                    Loading messages...
                </div>
            </div>
        </div>
        
        <div id="search-teachers" class="content-section">
            <h2>Search Teachers</h2>
            <div class="card">
                <h3>Find Teachers</h3>
                <div class="form-group">
                    <input type="text" id="teacherSearch" placeholder="Search by name, department, or subject..." style="width: 100%; margin-bottom: 1rem;">
                </div>
                <div id="teachersGrid" class="features-grid">
                    Loading teachers...
                </div>
            </div>
        </div>
    `;
}

// Dashboard initialization
async function initializeDashboard(user) {
    currentUser = user;
    
    try {
        // Load appropriate data based on user type
        if (user.userType === 'admin') {
            await loadAdminData();
        } else if (user.userType === 'teacher') {
            await loadTeacherData();
        } else if (user.userType === 'student') {
            await loadStudentData();
        }
        
        // Set up event listeners
        setupDashboardEventListeners();
        
    } catch (error) {
        logger.error('DASHBOARD_INIT_FAILED', { error: error.message });
        showNotification('Failed to load dashboard data', 'error');
    }
}

// Section navigation
window.showSection = function(sectionId) {
    logger.trackPageView(sectionId);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.sidebar a[onclick="showSection('${sectionId}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load section-specific data
    loadSectionData(sectionId);
}

// Load data for specific sections
async function loadSectionData(sectionId) {
    try {
        switch (sectionId) {
            case 'manage-teachers':
                await loadTeachersTable();
                break;
            case 'manage-students':
                await loadStudentsTable();
                break;
            case 'all-appointments':
                await loadAllAppointmentsTable();
                break;
            case 'appointments':
                await loadTeacherAppointments();
                break;
            case 'my-appointments':
                await loadStudentAppointments();
                break;
            case 'book-appointment':
                await loadTeacherOptions();
                break;
            case 'search-teachers':
                await loadTeachersGrid();
                break;
            case 'messages':
                await loadMessages();
                break;
            case 'system-logs':
                await loadSystemLogs();
                break;
        }
    } catch (error) {
        logger.error('LOAD_SECTION_DATA_FAILED', { sectionId, error: error.message });
    }
}

// Data loading functions
async function loadAdminData() {
    const teachers = await getTeachers(false);
    const students = await getStudents(false);
    const appointments = await getAppointments();
    
    // Update stats
    document.getElementById('totalTeachers').textContent = teachers.length;
    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('totalAppointments').textContent = appointments.length;
    document.getElementById('pendingApprovals').textContent = 
        teachers.filter(t => !t.approved).length + students.filter(s => !s.approved).length;
    
    // Load recent activities
    const logs = logger.getLogs(null, 10);
    const activitiesHTML = logs.map(log => 
        `<div style="padding: 0.5rem; border-bottom: 1px solid #eee;">
            <strong>${log.action}</strong> - ${new Date(log.timestamp).toLocaleString()}
            <br><small>${JSON.stringify(log.details)}</small>
        </div>`
    ).join('');
    document.getElementById('recentActivities').innerHTML = activitiesHTML || 'No recent activities';
}

async function loadTeacherData() {
    const appointments = await getAppointments(currentUser.uid, 'teacher');
    const messages = await getMessages(currentUser.uid);
    
    document.getElementById('myAppointments').textContent = appointments.length;
    document.getElementById('pendingAppointments').textContent = 
        appointments.filter(apt => apt.status === 'pending').length;
    document.getElementById('unreadMessages').textContent = 
        messages.filter(msg => !msg.read && msg.to === currentUser.uid).length;
}

async function loadStudentData() {
    const appointments = await getAppointments(currentUser.uid, 'student');
    const messages = await getMessages(currentUser.uid);
    
    document.getElementById('myAppointments').textContent = appointments.length;
    document.getElementById('upcomingAppointments').textContent = 
        appointments.filter(apt => apt.status === 'approved' && new Date(apt.date) > new Date()).length;
    document.getElementById('unreadMessages').textContent = 
        messages.filter(msg => !msg.read && msg.to === currentUser.uid).length;
}

async function loadTeachersTable() {
    const teachers = await getTeachers(false);
    const tableBody = document.getElementById('teachersTable');
    
    if (teachers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No teachers found</td></tr>';
        return;
    }
    
    const rowsHTML = teachers.map(teacher => `
        <tr>
            <td>${teacher.name}</td>
            <td>${teacher.email}</td>
            <td>${teacher.department}</td>
            <td>${teacher.subject}</td>
            <td><span class="status ${teacher.approved ? 'approved' : 'pending'}">${teacher.approved ? 'Approved' : 'Pending'}</span></td>
            <td>
                <div class="action-btns">
                    ${!teacher.approved ? `<button class="btn btn-success btn-sm" onclick="approveTeacher('${teacher.id}')">Approve</button>` : ''}
                    <button class="btn btn-accent btn-sm" onclick="deleteTeacher('${teacher.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tableBody.innerHTML = rowsHTML;
}

async function loadStudentsTable() {
    const students = await getStudents(false);
    const tableBody = document.getElementById('studentsTable');
    
    if (students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No students found</td></tr>';
        return;
    }
    
    const rowsHTML = students.map(student => `
        <tr>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td><span class="status ${student.approved ? 'approved' : 'pending'}">${student.approved ? 'Approved' : 'Pending'}</span></td>
            <td>
                <div class="action-btns">
                    ${!student.approved ? `<button class="btn btn-success btn-sm" onclick="approveStudent('${student.id}')">Approve</button>` : ''}
                    <button class="btn btn-accent btn-sm" onclick="deleteStudent('${student.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tableBody.innerHTML = rowsHTML;
}

async function loadAllAppointmentsTable() {
    const appointments = await getAppointments();
    const tableBody = document.getElementById('allAppointmentsTable');
    
    if (appointments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No appointments found</td></tr>';
        return;
    }
    
    const rowsHTML = appointments.map(apt => `
        <tr>
            <td>${apt.studentName}</td>
            <td>${apt.teacherName}</td>
            <td>${apt.date}</td>
            <td>${apt.time}</td>
            <td>${apt.subject}</td>
            <td><span class="status ${apt.status}">${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span></td>
            <td>
                <div class="action-btns">
                    ${apt.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="approveAppointment('${apt.id}')">Approve</button>
                        <button class="btn btn-accent btn-sm" onclick="cancelAppointment('${apt.id}')">Cancel</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
    
    tableBody.innerHTML = rowsHTML;
}

async function loadTeacherAppointments() {
    const appointments = await getAppointments(currentUser.uid, 'teacher');
    const tableBody = document.getElementById('teacherAppointmentsTable');
    
    if (appointments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No appointments found</td></tr>';
        return;
    }
    
    const rowsHTML = appointments.map(apt => `
        <tr>
            <td>${apt.studentName}</td>
            <td>${apt.date}</td>
            <td>${apt.time}</td>
            <td>${apt.subject}</td>
            <td>${apt.message}</td>
            <td><span class="status ${apt.status}">${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span></td>
            <td>
                <div class="action-btns">
                    ${apt.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="approveAppointment('${apt.id}')">Approve</button>
                        <button class="btn btn-accent btn-sm" onclick="cancelAppointment('${apt.id}')">Cancel</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
    
    tableBody.innerHTML = rowsHTML;
}

async function loadStudentAppointments() {
    const appointments = await getAppointments(currentUser.uid, 'student');
    const tableBody = document.getElementById('studentAppointmentsTable');
    
    if (appointments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No appointments found</td></tr>';
        return;
    }
    
    const rowsHTML = appointments.map(apt => `
        <tr>
            <td>${apt.teacherName}</td>
            <td>${apt.date}</td>
            <td>${apt.time}</td>
            <td>${apt.subject}</td>
            <td><span class="status ${apt.status}">${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span></td>
            <td>
                <div class="action-btns">
                    ${apt.status === 'pending' ? `<button class="btn btn-accent btn-sm" onclick="cancelAppointment('${apt.id}')">Cancel</button>` : ''}
                    <button class="btn btn-primary btn-sm" onclick="sendMessageToTeacher('${apt.teacherId}', '${apt.teacherName}')">Message</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tableBody.innerHTML = rowsHTML;
}

async function loadTeacherOptions() {
    const teachers = await getTeachers(true);
    const select = document.getElementById('teacherSelect');
    
    const optionsHTML = teachers.map(teacher => 
        `<option value="${teacher.id}">${teacher.name} - ${teacher.department} (${teacher.subject})</option>`
    ).join('');
    
    select.innerHTML = '<option value="">Select a teacher...</option>' + optionsHTML;
}

async function loadTeachersGrid() {
    const teachers = await getTeachers(true);
    const grid = document.getElementById('teachersGrid');
    
    if (teachers.length === 0) {
        grid.innerHTML = '<p>No teachers found</p>';
        return;
    }
    
    const cardsHTML = teachers.map(teacher => `
        <div class="feature-card">
            <i class="fas fa-chalkboard-teacher"></i>
            <h3>${teacher.name}</h3>
            <p><strong>Department:</strong> ${teacher.department}</p>
            <p><strong>Subject:</strong> ${teacher.subject}</p>
            <div class="action-btns">
                <button class="btn btn-primary btn-sm" onclick="bookWithTeacher('${teacher.id}', '${teacher.name}')">Book Appointment</button>
                <button class="btn btn-secondary btn-sm" onclick="sendMessageToTeacher('${teacher.id}', '${teacher.name}')">Send Message</button>
            </div>
        </div>
    `).join('');
    
    grid.innerHTML = cardsHTML;
}

async function loadMessages() {
    const messages = await getMessages(currentUser.uid);
    const container = document.getElementById('messagesContainer');
    
    if (messages.length === 0) {
        container.innerHTML = '<p>No messages found</p>';
        return;
    }
    
    const messagesHTML = messages.map(msg => `
        <div class="card" style="margin-bottom: 1rem; ${!msg.read && msg.to === currentUser.uid ? 'border-left: 4px solid var(--primary-color);' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4>${msg.subject}</h4>
                <small>${new Date(msg.timestamp).toLocaleString()}</small>
            </div>
            <p><strong>From:</strong> ${msg.fromName}</p>
            <p><strong>To:</strong> ${msg.toName}</p>
            <p>${msg.message}</p>
            ${msg.to === currentUser.uid && !msg.read ? '<span class="status pending">New</span>' : ''}
        </div>
    `).join('');
    
    container.innerHTML = messagesHTML;
}

async function loadSystemLogs() {
    const logs = logger.getLogs(null, 50);
    const container = document.getElementById('logsContainer');
    
    if (logs.length === 0) {
        container.innerHTML = '<p>No logs found</p>';
        return;
    }
    
    const logsHTML = logs.map(log => `
        <div style="padding: 0.5rem; border-bottom: 1px solid #ddd; font-family: monospace; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                <span class="status ${log.level}">${log.level.toUpperCase()}</span>
                <small>${new Date(log.timestamp).toLocaleString()}</small>
            </div>
            <strong>${log.action}</strong>
            ${log.userId ? `<br><small>User: ${log.userId}</small>` : ''}
            <br><small>${JSON.stringify(log.details)}</small>
        </div>
    `).join('');
    
    container.innerHTML = logsHTML;
}

// Mock data functions for demo
async function getTeachers() {
    return [
        { id: 'teacher1', name: 'Dr. John Smith', department: 'Computer Science', subject: 'Data Structures', approved: true },
        { id: 'teacher2', name: 'Prof. Sarah Wilson', department: 'Mathematics', subject: 'Calculus', approved: true }
    ];
}

async function getStudents() {
    return [
        { id: 'student1', name: 'Alice Johnson', email: 'student@edubook.com', approved: true },
        { id: 'student2', name: 'Bob Davis', email: 'bob@student.edu', approved: true }
    ];
}

async function getAppointments() {
    return [
        {
            id: 'apt1',
            studentId: 'student1',
            teacherId: 'teacher1',
            studentName: 'Alice Johnson',
            teacherName: 'Dr. John Smith',
            date: '2025-07-25',
            time: '10:00',
            subject: 'Data Structures Doubt',
            status: 'pending'
        }
    ];
}

// Event listeners setup
function setupDashboardEventListeners() {
    // Appointment form submission
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            logger.trackUserAction('SUBMIT_APPOINTMENT_FORM', 'appointment_form');
            
            const formData = new FormData(this);
            const teacherSelect = document.getElementById('teacherSelect');
            const selectedTeacher = teacherSelect.options[teacherSelect.selectedIndex];
            
            const appointmentData = {
                studentId: currentUser.uid,
                teacherId: formData.get('teacherId'),
                studentName: currentUser.name,
                teacherName: selectedTeacher.text.split(' - ')[0],
                date: formData.get('date'),
                time: formData.get('time'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };
            
            try {
                await bookAppointment(appointmentData);
                showNotification('Appointment booked successfully!', 'success');
                appointmentForm.reset();
                
                // Refresh appointments if on that section
                if (document.getElementById('my-appointments').classList.contains('active')) {
                    await loadStudentAppointments();
                }
            } catch (error) {
                showNotification('Failed to book appointment: ' + error.message, 'error');
            }
        });
    }
    
    // Teacher search
    const teacherSearch = document.getElementById('teacherSearch');
    if (teacherSearch) {
        teacherSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const teacherCards = document.querySelectorAll('#teachersGrid .feature-card');
            
            teacherCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }
}

// Action functions
window.approveTeacher = async function(teacherId) {
    try {
        await approveUser(teacherId, 'teacher');
        showNotification('Teacher approved successfully!', 'success');
        await loadTeachersTable();
    } catch (error) {
        showNotification('Failed to approve teacher: ' + error.message, 'error');
    }
}

window.deleteTeacher = async function(teacherId) {
    if (confirm('Are you sure you want to delete this teacher?')) {
        try {
            await deleteUser(teacherId, 'teacher');
            showNotification('Teacher deleted successfully!', 'success');
            await loadTeachersTable();
        } catch (error) {
            showNotification('Failed to delete teacher: ' + error.message, 'error');
        }
    }
}

window.approveStudent = async function(studentId) {
    try {
        await approveUser(studentId, 'student');
        showNotification('Student approved successfully!', 'success');
        await loadStudentsTable();
    } catch (error) {
        showNotification('Failed to approve student: ' + error.message, 'error');
    }
}

window.deleteStudent = async function(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            await deleteUser(studentId, 'student');
            showNotification('Student deleted successfully!', 'success');
            await loadStudentsTable();
        } catch (error) {
            showNotification('Failed to delete student: ' + error.message, 'error');
        }
    }
}

window.approveAppointment = async function(appointmentId) {
    try {
        await updateAppointmentStatus(appointmentId, 'approved');
        showNotification('Appointment approved!', 'success');
        
        // Refresh appropriate table
        if (currentUser.userType === 'admin') {
            await loadAllAppointmentsTable();
        } else if (currentUser.userType === 'teacher') {
            await loadTeacherAppointments();
        }
    } catch (error) {
        showNotification('Failed to approve appointment: ' + error.message, 'error');
    }
}

window.cancelAppointment = async function(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
            await updateAppointmentStatus(appointmentId, 'cancelled');
            showNotification('Appointment cancelled!', 'success');
            
            // Refresh appropriate table
            if (currentUser.userType === 'admin') {
                await loadAllAppointmentsTable();
            } else if (currentUser.userType === 'teacher') {
                await loadTeacherAppointments();
            } else if (currentUser.userType === 'student') {
                await loadStudentAppointments();
            }
        } catch (error) {
            showNotification('Failed to cancel appointment: ' + error.message, 'error');
        }
    }
}

window.bookWithTeacher = function(teacherId, teacherName) {
    showSection('book-appointment');
    
    // Pre-select the teacher
    setTimeout(() => {
        const teacherSelect = document.getElementById('teacherSelect');
        if (teacherSelect) {
            teacherSelect.value = teacherId;
        }
    }, 100);
}

window.sendMessageToTeacher = function(teacherId, teacherName) {
    const subject = prompt('Enter message subject:');
    if (!subject) return;
    
    const message = prompt('Enter your message:');
    if (!message) return;
    
    const messageData = {
        from: currentUser.uid,
        to: teacherId,
        fromName: currentUser.name,
        toName: teacherName,
        subject: subject,
        message: message
    };
    
    sendMessage(messageData)
        .then(() => {
            showNotification('Message sent successfully!', 'success');
        })
        .catch(error => {
            showNotification('Failed to send message: ' + error.message, 'error');
        });
}

window.refreshLogs = async function() {
    await loadSystemLogs();
    showNotification('Logs refreshed!', 'success');
}

window.exportLogs = function() {
    logger.exportLogs();
    showNotification('Logs exported!', 'success');
}

window.clearLogs = function() {
    if (confirm('Are you sure you want to clear all logs?')) {
        logger.clearLogs();
        loadSystemLogs();
        showNotification('Logs cleared!', 'success');
    }
}

// Logout function
window.logout = async function() {
    logger.trackUserAction('LOGOUT_CLICK', 'logout_button');
    
    try {
        await logoutUser();
        
        // Remove dashboard and show home page
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.remove();
        }
        
        document.querySelector('.container').style.display = 'block';
        currentUser = null;
        currentUserType = null;
        
        showNotification('Logged out successfully!', 'success');
    } catch (error) {
        showNotification('Logout failed: ' + error.message, 'error');
    }
}

// Notification system
function showNotification(message, type = 'info') {
    logger.info('NOTIFICATION_SHOWN', { message, type });
    
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--accent-color)' : 'var(--primary-color)'};
        color: white;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    // Add CSS animation
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Click outside modal to close
window.addEventListener('click', function(event) {
    if (event.target === loginModal) {
        closeModal();
    }
    if (event.target === registerModal) {
        closeRegisterModal();
    }
});

// Check for existing session on page load
document.addEventListener('DOMContentLoaded', function() {
    logger.trackPageView('homepage');
    
    // Check if user is already logged in
    const existingUser = getCurrentUser();
    if (existingUser) {
        currentUser = existingUser;
        showDashboard(existingUser);
    }
    
    // Set minimum date for appointment booking to today
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.min = today;
    });
});

// Auto-fill credentials function for demo
window.fillCredentials = function(email, password) {
    logger.trackUserAction('FILL_DEMO_CREDENTIALS', 'credential_click', { email });
    
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    
    if (emailField && passwordField) {
        emailField.value = email;
        passwordField.value = password;
        
        // Add visual feedback
        emailField.style.borderColor = 'var(--success-color)';
        passwordField.style.borderColor = 'var(--success-color)';
        
        setTimeout(() => {
            emailField.style.borderColor = '';
            passwordField.style.borderColor = '';
        }, 2000);
        
        showNotification('Demo credentials filled! Click Login to continue.', 'success');
    }
}
