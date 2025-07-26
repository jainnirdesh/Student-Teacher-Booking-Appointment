// Enhanced Main Application with Firebase Auth for Students/Teachers and Local Auth for Admin
import { 
    enhancedAuthManager,
    login,
    register,
    logout,
    getCurrentUser,
    isAuthenticated,
    hasRole,
    approveTeacher,
    rejectTeacher,
    getAllTeachers,
    getAllStudents
} from './enhanced-auth.js';

// Import UI enhancements
import UIEnhancements from './ui-enhancements.js';

class EduBookApp {
    constructor() {
        this.currentUser = null;
        this.currentView = 'home';
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Setup auth state listener
            enhancedAuthManager.onAuthStateChange((isAuth, user) => {
                this.currentUser = user;
                this.handleAuthStateChange(isAuth);
            });

            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI enhancements
            this.initializeUIEnhancements();

            this.isInitialized = true;
            console.log('EduBook App initialized successfully');
            
            // Show welcome message
            setTimeout(() => {
                UIEnhancements.showNotification('Welcome to EduBook! Choose your portal to get started.', 'info');
            }, 1000);

        } catch (error) {
            console.error('Error initializing app:', error);
            UIEnhancements.showNotification('Failed to initialize application. Please refresh the page.', 'error');
        }
    }

    initializeUIEnhancements() {
        // Enhance all existing buttons
        document.querySelectorAll('.btn').forEach(btn => {
            UIEnhancements.enhanceButton(btn);
        });

        // Enhance all modals
        document.querySelectorAll('.modal').forEach(modal => {
            UIEnhancements.enhanceModal(modal.id);
        });
    }

    handleAuthStateChange(isAuthenticated) {
        if (isAuthenticated && this.currentUser) {
            this.showDashboard(this.currentUser.role);
            UIEnhancements.showNotification(`Welcome back, ${this.currentUser.name}!`, 'success');
        } else {
            this.showHome();
        }
    }

    setupEventListeners() {
        // Enhanced login buttons with user type detection
        document.getElementById('studentLoginBtn')?.addEventListener('click', () => {
            this.showLoginModal('student');
        });

        document.getElementById('teacherLoginBtn')?.addEventListener('click', () => {
            this.showLoginModal('teacher');
        });

        document.getElementById('adminLoginBtn')?.addEventListener('click', () => {
            this.showLoginModal('admin');
        });

        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Registration form submission
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister();
            });
        }

        // User type change in registration
        const userTypeSelect = document.getElementById('userType');
        if (userTypeSelect) {
            userTypeSelect.addEventListener('change', (e) => {
                this.toggleTeacherFields(e.target.value === 'teacher');
            });
        }

        // Global logout handler
        document.addEventListener('click', (e) => {
            if (e.target.matches('.logout-btn')) {
                this.handleLogout();
            }
        });

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.matches('.close')) {
                e.target.closest('.modal').style.display = 'none';
            }
        });

        // Dashboard navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="showSection"]')) {
                const sectionId = e.target.getAttribute('onclick').match(/'([^']+)'/)?.[1];
                if (sectionId) {
                    this.showDashboardSection(sectionId);
                }
            }
        });
    }

    showLoginModal(userType) {
        const modal = document.getElementById('loginModal');
        const titleElement = document.getElementById('modalTitle');
        
        if (modal && titleElement) {
            titleElement.textContent = `${userType.charAt(0).toUpperCase() + userType.slice(1)} Login`;
            modal.style.display = 'block';
            modal.dataset.userType = userType;

            // Focus on email input
            const emailInput = modal.querySelector('input[type="email"]');
            if (emailInput) {
                setTimeout(() => emailInput.focus(), 100);
            }

            // Show demo credentials for the specific user type
            this.showDemoCredentials(userType);
        }
    }

    showDemoCredentials(userType) {
        const demoCredentials = document.querySelector('.demo-credentials');
        if (demoCredentials) {
            demoCredentials.style.display = 'block';
            
            let credentialsHTML = '<h4>Demo Credentials</h4>';
            
            switch (userType) {
                case 'student':
                    credentialsHTML += `
                        <div class="credential-set">
                            <strong>Student Account:</strong><br>
                            Email: student@edubook.com<br>
                            Password: student123
                        </div>
                    `;
                    break;
                case 'teacher':
                    credentialsHTML += `
                        <div class="credential-set">
                            <strong>Teacher Account:</strong><br>
                            Email: teacher@edubook.com<br>
                            Password: teacher123
                        </div>
                    `;
                    break;
                case 'admin':
                    credentialsHTML += `
                        <div class="credential-set">
                            <strong>Admin Account:</strong><br>
                            Email: admin@edubook.com<br>
                            Password: admin123
                        </div>
                    `;
                    break;
            }
            
            demoCredentials.innerHTML = credentialsHTML;
        }
    }

    async handleLogin() {
        const modal = document.getElementById('loginModal');
        const userType = modal?.dataset.userType;
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');

        if (!email || !password) {
            UIEnhancements.showNotification('Please enter both email and password.', 'error');
            return;
        }

        try {
            // Show loading state
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
                submitBtn.disabled = true;

                setTimeout(async () => {
                    try {
                        const result = await login(email, password, userType);
                        
                        // Close modal
                        modal.style.display = 'none';
                        
                        // Clear form
                        document.getElementById('loginForm').reset();
                        
                        UIEnhancements.showNotification(result.message, 'success');
                        
                    } catch (error) {
                        UIEnhancements.showNotification(error.message, 'error');
                    } finally {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }
                }, 500);
            }

        } catch (error) {
            UIEnhancements.showNotification(error.message, 'error');
        }
    }

    async handleRegister() {
        const form = document.getElementById('registerForm');
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData);
        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            // Show loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;

            setTimeout(async () => {
                try {
                    const result = await register(userData);
                    
                    // Close modal
                    document.getElementById('registerModal').style.display = 'none';
                    
                    // Clear form
                    form.reset();
                    this.toggleTeacherFields(false);
                    
                    UIEnhancements.showNotification(result.message, 'success');
                    
                    // If teacher registration, show additional info
                    if (result.requiresApproval) {
                        setTimeout(() => {
                            UIEnhancements.showNotification('Please wait for admin approval to access your account.', 'info');
                        }, 2000);
                    }
                    
                } catch (error) {
                    UIEnhancements.showNotification(error.message, 'error');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }, 800);

        } catch (error) {
            UIEnhancements.showNotification(error.message, 'error');
        }
    }

    async handleLogout() {
        try {
            const result = await logout();
            UIEnhancements.showNotification(result.message, 'success');
            
            // Hide dashboard and show home
            this.showHome();
            
        } catch (error) {
            UIEnhancements.showNotification('Failed to logout. Please try again.', 'error');
        }
    }

    toggleTeacherFields(show) {
        const teacherFields = document.getElementById('teacherFields');
        if (teacherFields) {
            teacherFields.style.display = show ? 'block' : 'none';
            
            // Make fields required/optional based on visibility
            const inputs = teacherFields.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.required = show;
            });
        }
    }

    showHome() {
        // Hide dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.remove();
        }

        // Show main container
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = 'block';
        }

        this.currentView = 'home';
    }

    showDashboard(role) {
        // Hide main container
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = 'none';
        }

        // Remove existing dashboard
        const existingDashboard = document.getElementById('dashboard');
        if (existingDashboard) {
            existingDashboard.remove();
        }

        // Create new dashboard
        this.createDashboard(role);
        this.currentView = 'dashboard';
    }

    createDashboard(role) {
        const dashboardHTML = this.getDashboardHTML(role);
        document.body.insertAdjacentHTML('beforeend', dashboardHTML);
        
        // Initialize dashboard functionality
        this.initializeDashboard(role);
    }

    getDashboardHTML(role) {
        const user = this.currentUser;
        const roleText = role.charAt(0).toUpperCase() + role.slice(1);
        
        return `
            <div id="dashboard" class="dashboard active">
                <div class="dashboard-header">
                    <div class="user-info">
                        <i class="fas fa-user-circle" style="font-size: 2rem; margin-right: 0.5rem;"></i>
                        <div>
                            <h3>${user.name}</h3>
                            <p>${roleText}${user.department ? ` - ${user.department}` : ''}</p>
                        </div>
                    </div>
                    <button class="logout-btn">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
                <div class="dashboard-content">
                    ${this.getSidebarHTML(role)}
                    <div class="content-area">
                        ${this.getContentAreaHTML(role)}
                    </div>
                </div>
            </div>
        `;
    }

    getSidebarHTML(role) {
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
                { id: 'availability', icon: 'fas fa-clock', text: 'Set Availability' },
                { id: 'messages', icon: 'fas fa-envelope', text: 'Messages' },
                { id: 'profile', icon: 'fas fa-user', text: 'Profile' }
            ],
            student: [
                { id: 'dashboard', icon: 'fas fa-tachometer-alt', text: 'Dashboard' },
                { id: 'book-appointment', icon: 'fas fa-calendar-plus', text: 'Book Appointment' },
                { id: 'my-appointments', icon: 'fas fa-calendar-alt', text: 'My Appointments' },
                { id: 'teachers', icon: 'fas fa-search', text: 'Find Teachers' },
                { id: 'messages', icon: 'fas fa-envelope', text: 'Messages' }
            ]
        };
        
        const items = sidebarItems[role] || [];
        const itemsHTML = items.map(item => 
            `<li><a href="#" onclick="showSection('${item.id}')" class="${item.id === 'dashboard' ? 'active' : ''}">
                <i class="${item.icon}"></i> ${item.text}
            </a></li>`
        ).join('');
        
        return `
            <div class="sidebar">
                <ul>${itemsHTML}</ul>
            </div>
        `;
    }

    getContentAreaHTML(role) {
        switch (role) {
            case 'admin':
                return this.getAdminContentHTML();
            case 'teacher':
                return this.getTeacherContentHTML();
            case 'student':
                return this.getStudentContentHTML();
            default:
                return '<div class="content-section active"><h2>Welcome!</h2></div>';
        }
    }

    getAdminContentHTML() {
        return `
            <div id="dashboard" class="content-section active">
                <h2>Admin Dashboard</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4 id="totalTeachers">Loading...</h4>
                        <p>Total Teachers</p>
                    </div>
                    <div class="stat-card">
                        <h4 id="totalStudents">Loading...</h4>
                        <p>Total Students</p>
                    </div>
                    <div class="stat-card">
                        <h4 id="totalAppointments">Loading...</h4>
                        <p>Total Appointments</p>
                    </div>
                    <div class="stat-card">
                        <h4 id="pendingApprovals">Loading...</h4>
                        <p>Pending Approvals</p>
                    </div>
                </div>
                <div class="card">
                    <h3>Recent Activity</h3>
                    <p>System activity and recent changes will be displayed here.</p>
                </div>
            </div>
            
            <div id="manage-teachers" class="content-section">
                <h2>Manage Teachers</h2>
                <div class="card">
                    <h3>Teacher Applications</h3>
                    <div id="teachersList">Loading teachers...</div>
                </div>
            </div>
            
            <div id="manage-students" class="content-section">
                <h2>Manage Students</h2>
                <div class="card">
                    <h3>Registered Students</h3>
                    <div id="studentsList">Loading students...</div>
                </div>
            </div>
        `;
    }

    getTeacherContentHTML() {
        return `
            <div id="dashboard" class="content-section active">
                <h2>Teacher Dashboard</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4 id="pendingAppointments">0</h4>
                        <p>Pending Requests</p>
                    </div>
                    <div class="stat-card">
                        <h4 id="upcomingAppointments">0</h4>
                        <p>Upcoming Appointments</p>
                    </div>
                    <div class="stat-card">
                        <h4 id="totalStudents">0</h4>
                        <p>Students Taught</p>
                    </div>
                </div>
                <div class="card">
                    <h3>Welcome, ${this.currentUser?.name}!</h3>
                    <p>Manage your appointments and availability from your dashboard.</p>
                </div>
            </div>
        `;
    }

    getStudentContentHTML() {
        return `
            <div id="dashboard" class="content-section active">
                <h2>Student Dashboard</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4 id="upcomingAppointments">0</h4>
                        <p>Upcoming Appointments</p>
                    </div>
                    <div class="stat-card">
                        <h4 id="completedAppointments">0</h4>
                        <p>Completed Sessions</p>
                    </div>
                    <div class="stat-card">
                        <h4 id="favoriteTeachers">0</h4>
                        <p>Favorite Teachers</p>
                    </div>
                </div>
                <div class="card">
                    <h3>Welcome, ${this.currentUser?.name}!</h3>
                    <p>Book appointments with your teachers and manage your academic sessions.</p>
                </div>
            </div>
        `;
    }

    async initializeDashboard(role) {
        if (role === 'admin') {
            await this.loadAdminData();
        } else if (role === 'teacher') {
            await this.loadTeacherData();
        } else if (role === 'student') {
            await this.loadStudentData();
        }
    }

    async loadAdminData() {
        try {
            const [teachers, students] = await Promise.all([
                getAllTeachers(),
                getAllStudents()
            ]);

            // Update stats
            document.getElementById('totalTeachers').textContent = teachers.length;
            document.getElementById('totalStudents').textContent = students.length;
            
            const pendingTeachers = teachers.filter(t => !t.approved).length;
            document.getElementById('pendingApprovals').textContent = pendingTeachers;

            // Load teacher list
            this.displayTeachersList(teachers);
            this.displayStudentsList(students);

        } catch (error) {
            console.error('Error loading admin data:', error);
            UIEnhancements.showNotification('Failed to load dashboard data', 'error');
        }
    }

    displayTeachersList(teachers) {
        const container = document.getElementById('teachersList');
        if (!container) return;

        if (teachers.length === 0) {
            container.innerHTML = '<p>No teachers found.</p>';
            return;
        }

        const teachersHTML = teachers.map(teacher => `
            <div class="teacher-item" style="border: 1px solid #ddd; padding: 1rem; margin: 0.5rem 0; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4>${teacher.name}</h4>
                        <p>Email: ${teacher.email}</p>
                        <p>Department: ${teacher.department || 'Not specified'}</p>
                        <p>Subject: ${teacher.subject || 'Not specified'}</p>
                        <span class="status ${teacher.approved ? 'approved' : 'pending'}">
                            ${teacher.approved ? 'Approved' : 'Pending Approval'}
                        </span>
                    </div>
                    <div class="action-btns">
                        ${!teacher.approved ? `
                            <button class="btn btn-success btn-sm" onclick="app.approveTeacher('${teacher.uid}')">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn btn-accent btn-sm" onclick="app.rejectTeacher('${teacher.uid}')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        ` : `
                            <button class="btn btn-warning btn-sm" onclick="app.toggleTeacherStatus('${teacher.uid}')">
                                <i class="fas fa-ban"></i> Suspend
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = teachersHTML;
    }

    displayStudentsList(students) {
        const container = document.getElementById('studentsList');
        if (!container) return;

        if (students.length === 0) {
            container.innerHTML = '<p>No students found.</p>';
            return;
        }

        const studentsHTML = students.map(student => `
            <div class="student-item" style="border: 1px solid #ddd; padding: 1rem; margin: 0.5rem 0; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4>${student.name}</h4>
                        <p>Email: ${student.email}</p>
                        <p>Enrollment: ${student.enrollmentNumber || 'Not assigned'}</p>
                        <p>Joined: ${new Date(student.createdAt).toLocaleDateString()}</p>
                        <span class="status ${student.active ? 'approved' : 'inactive'}">
                            ${student.active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div class="action-btns">
                        <button class="btn btn-primary btn-sm" onclick="app.viewStudentDetails('${student.uid}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="app.toggleStudentStatus('${student.uid}')">
                            <i class="fas fa-ban"></i> ${student.active ? 'Suspend' : 'Activate'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = studentsHTML;
    }

    async approveTeacher(teacherId) {
        try {
            await approveTeacher(teacherId);
            UIEnhancements.showNotification('Teacher approved successfully!', 'success');
            this.loadAdminData(); // Refresh the list
        } catch (error) {
            UIEnhancements.showNotification('Failed to approve teacher', 'error');
        }
    }

    async rejectTeacher(teacherId) {
        try {
            await rejectTeacher(teacherId);
            UIEnhancements.showNotification('Teacher application rejected', 'warning');
            this.loadAdminData(); // Refresh the list
        } catch (error) {
            UIEnhancements.showNotification('Failed to reject teacher', 'error');
        }
    }

    showDashboardSection(sectionId) {
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
        
        const activeLink = document.querySelector(`[onclick*="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async loadTeacherData() {
        // Load teacher-specific data
        console.log('Loading teacher dashboard data...');
    }

    async loadStudentData() {
        // Load student-specific data
        console.log('Loading student dashboard data...');
    }
}

// Global functions for onclick handlers
window.showSection = function(sectionId) {
    if (window.app) {
        window.app.showDashboardSection(sectionId);
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EduBookApp();
});

// Export for use in other modules
export default EduBookApp;
