// Main Application Logic with Firebase Integration
import { 
    authManager,
    login,
    register,
    logout,
    getCurrentUser,
    getCurrentUserProfile,
    isAuthenticated,
    hasRole
} from './auth-firebase.js';

import { appointmentManager } from './appointments-firebase.js';
import { messagingManager } from './messaging-firebase.js';
import { logUserAction } from './logger-firebase.js';

// Application State
class AppState {
    constructor() {
        this.currentView = 'home';
        this.user = null;
        this.userProfile = null;
        this.isInitialized = false;
        this.setupEventListeners();
        this.initialize();
    }

    async initialize() {
        try {
            // Setup auth state listener
            authManager.onAuthStateChange((isAuth, profile) => {
                this.user = getCurrentUser();
                this.userProfile = profile;
                this.handleAuthStateChange(isAuth);
            });

            // Setup appointment listener
            appointmentManager.onAppointmentChange(() => {
                this.refreshDashboard();
            });

            // Setup message listener
            messagingManager.onMessageChange(() => {
                this.refreshDashboard();
            });

            this.isInitialized = true;
            this.updateUI();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to initialize application');
        }
    }

    handleAuthStateChange(isAuthenticated) {
        if (isAuthenticated && this.userProfile) {
            this.showDashboard(this.userProfile.role);
        } else {
            this.showHome();
        }
        this.updateUI();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Register form (single form for both roles)
        document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userType = document.getElementById('userType')?.value || 'student';
            await this.handleRegister(userType);
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            await this.handleLogout();
        });

        // Navigation
        this.setupNavigation();

        // Modal controls
        this.setupModals();
    }

    setupNavigation() {
        // Dashboard navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                const view = e.target.dataset.view;
                this.switchView(view);
            }
        });
    }

    setupModals() {
        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    async handleLogin() {
        try {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                throw new Error('Please fill in all fields');
            }

            this.showLoading('Logging in...');
            
            const result = await login(email, password);
            
            if (result.success) {
                this.closeModals();
                this.showSuccess('Login successful!');
                // Auth state change will handle navigation
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async handleRegister(role) {
        try {
            const form = document.getElementById('registerForm');
            const formData = new FormData(form);
            const userData = {
                email: formData.get('email'),
                password: formData.get('password'),
                name: formData.get('name'),
                role: role
            };
            // Add role-specific fields
            if (role === 'student') {
                userData.department = formData.get('department');
                userData.year = formData.get('year');
                userData.rollNumber = formData.get('rollNumber');
            } else if (role === 'teacher') {
                userData.department = formData.get('department');
                userData.subject = formData.get('subject');
                userData.qualification = formData.get('qualification');
            }
            // Validate required fields
            if (!userData.email || !userData.password || !userData.name) {
                throw new Error('Please fill in all required fields');
            }
            this.showLoading('Registering...');
            const result = await register(userData);
            if (result.success) {
                this.closeModals();
                this.showSuccess('Registration successful! Please wait for approval.');
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async handleLogout() {
        try {
            this.showLoading('Logging out...');
            await logout();
            this.showSuccess('Logged out successfully!');
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    showHome() {
        this.currentView = 'home';
        document.getElementById('home').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }

    showDashboard(role) {
        this.currentView = 'dashboard';
        document.getElementById('home').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        this.renderDashboard(role);
    }

    renderDashboard(role) {
        const dashboardContent = document.getElementById('dashboardContent');
        const userInfo = document.getElementById('userInfo');

        // Update user info
        if (this.userProfile) {
            userInfo.innerHTML = `
                <div class="user-profile">
                    <h3>Welcome, ${this.userProfile.name}</h3>
                    <p>Role: ${this.userProfile.role.charAt(0).toUpperCase() + this.userProfile.role.slice(1)}</p>
                    ${this.userProfile.email ? `<p>Email: ${this.userProfile.email}</p>` : ''}
                    ${this.userProfile.department ? `<p>Department: ${this.userProfile.department}</p>` : ''}
                </div>
            `;
        }

        // Render role-specific dashboard
        switch (role) {
            case 'admin':
                this.renderAdminDashboard();
                break;
            case 'teacher':
                this.renderTeacherDashboard();
                break;
            case 'student':
                this.renderStudentDashboard();
                break;
        }
    }

    renderAdminDashboard() {
        const dashboardContent = document.getElementById('dashboardContent');
        
        dashboardContent.innerHTML = `
            <div class="admin-dashboard">
                <div class="dashboard-nav">
                    <button class="nav-btn active" data-view="overview">Overview</button>
                    <button class="nav-btn" data-view="users">Manage Users</button>
                    <button class="nav-btn" data-view="appointments">All Appointments</button>
                    <button class="nav-btn" data-view="messages">System Messages</button>
                    <button class="nav-btn" data-view="logs">Activity Logs</button>
                </div>
                <div class="dashboard-content">
                    <div id="overview" class="view-content active">
                        ${this.renderAdminOverview()}
                    </div>
                    <div id="users" class="view-content">
                        ${this.renderUserManagement()}
                    </div>
                    <div id="appointments" class="view-content">
                        ${this.renderAllAppointments()}
                    </div>
                    <div id="messages" class="view-content">
                        ${this.renderSystemMessages()}
                    </div>
                    <div id="logs" class="view-content">
                        ${this.renderActivityLogs()}
                    </div>
                </div>
            </div>
        `;

        this.bindAdminEvents();
    }

    renderTeacherDashboard() {
        const dashboardContent = document.getElementById('dashboardContent');
        
        dashboardContent.innerHTML = `
            <div class="teacher-dashboard">
                <div class="dashboard-nav">
                    <button class="nav-btn active" data-view="overview">Overview</button>
                    <button class="nav-btn" data-view="appointments">My Appointments</button>
                    <button class="nav-btn" data-view="schedule">Schedule</button>
                    <button class="nav-btn" data-view="messages">Messages</button>
                </div>
                <div class="dashboard-content">
                    <div id="overview" class="view-content active">
                        ${this.renderTeacherOverview()}
                    </div>
                    <div id="appointments" class="view-content">
                        ${this.renderTeacherAppointments()}
                    </div>
                    <div id="schedule" class="view-content">
                        ${this.renderTeacherSchedule()}
                    </div>
                    <div id="messages" class="view-content">
                        ${this.renderMessages()}
                    </div>
                </div>
            </div>
        `;

        this.bindTeacherEvents();
    }

    renderStudentDashboard() {
        const dashboardContent = document.getElementById('dashboardContent');
        
        dashboardContent.innerHTML = `
            <div class="student-dashboard">
                <div class="dashboard-nav">
                    <button class="nav-btn active" data-view="overview">Overview</button>
                    <button class="nav-btn" data-view="book">Book Appointment</button>
                    <button class="nav-btn" data-view="appointments">My Appointments</button>
                    <button class="nav-btn" data-view="messages">Messages</button>
                </div>
                <div class="dashboard-content">
                    <div id="overview" class="view-content active">
                        ${this.renderStudentOverview()}
                    </div>
                    <div id="book" class="view-content">
                        ${this.renderBookAppointment()}
                    </div>
                    <div id="appointments" class="view-content">
                        ${this.renderStudentAppointments()}
                    </div>
                    <div id="messages" class="view-content">
                        ${this.renderMessages()}
                    </div>
                </div>
            </div>
        `;

        this.bindStudentEvents();
    }

    // Dashboard rendering methods
    renderAdminOverview() {
        const stats = appointmentManager.getAppointmentStats();
        const messageStats = messagingManager.getMessageStats();

        return `
            <div class="overview-section">
                <h3>System Overview</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>Total Appointments</h4>
                        <p class="stat-number">${stats.totalSystem || 0}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Pending Approvals</h4>
                        <p class="stat-number">${stats.pendingSystem || 0}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Total Messages</h4>
                        <p class="stat-number">${messageStats.totalSystem || 0}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Active Users</h4>
                        <p class="stat-number">-</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderTeacherOverview() {
        const stats = appointmentManager.getAppointmentStats();
        const messageStats = messagingManager.getMessageStats();

        return `
            <div class="overview-section">
                <h3>My Overview</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>Total Appointments</h4>
                        <p class="stat-number">${stats.total}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Pending Requests</h4>
                        <p class="stat-number">${stats.pending}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Unread Messages</h4>
                        <p class="stat-number">${messageStats.unread}</p>
                    </div>
                    <div class="stat-card">
                        <h4>This Week</h4>
                        <p class="stat-number">-</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderStudentOverview() {
        const stats = appointmentManager.getAppointmentStats();
        const messageStats = messagingManager.getMessageStats();

        return `
            <div class="overview-section">
                <h3>My Overview</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>My Appointments</h4>
                        <p class="stat-number">${stats.total}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Approved</h4>
                        <p class="stat-number">${stats.approved}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Pending</h4>
                        <p class="stat-number">${stats.pending}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Messages</h4>
                        <p class="stat-number">${messageStats.total}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Additional rendering methods would go here...
    renderUserManagement() {
        return `
            <div class="user-management">
                <h3>User Management</h3>
                <div id="usersList">Loading users...</div>
            </div>
        `;
    }

    renderAllAppointments() {
        return `
            <div class="appointments-management">
                <h3>All Appointments</h3>
                <div id="allAppointmentsList">Loading appointments...</div>
            </div>
        `;
    }

    renderSystemMessages() {
        return `
            <div class="messages-section">
                <h3>System Messages</h3>
                <div id="systemMessagesList">Loading messages...</div>
            </div>
        `;
    }

    renderActivityLogs() {
        return `
            <div class="logs-section">
                <h3>Activity Logs</h3>
                <div id="activityLogsList">Loading logs...</div>
            </div>
        `;
    }

    renderTeacherAppointments() {
        const appointments = appointmentManager.getMyAppointments();
        
        return `
            <div class="appointments-section">
                <h3>My Appointments</h3>
                <div class="appointments-list">
                    ${appointments.map(apt => this.renderAppointmentCard(apt)).join('')}
                </div>
            </div>
        `;
    }

    renderStudentAppointments() {
        const appointments = appointmentManager.getMyAppointments();
        
        return `
            <div class="appointments-section">
                <h3>My Appointments</h3>
                <div class="appointments-list">
                    ${appointments.map(apt => this.renderAppointmentCard(apt)).join('')}
                </div>
            </div>
        `;
    }

    renderBookAppointment() {
        return `
            <div class="book-appointment">
                <h3>Book New Appointment</h3>
                <form id="bookAppointmentForm">
                    <div id="teachersList">Loading teachers...</div>
                    <div class="form-group">
                        <label>Date:</label>
                        <input type="date" id="appointmentDate" required>
                    </div>
                    <div class="form-group">
                        <label>Time:</label>
                        <select id="appointmentTime" required>
                            <option value="">Select time...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Purpose:</label>
                        <textarea id="appointmentPurpose" required></textarea>
                    </div>
                    <button type="submit">Book Appointment</button>
                </form>
            </div>
        `;
    }

    renderTeacherSchedule() {
        return `
            <div class="schedule-section">
                <h3>My Schedule</h3>
                <div id="scheduleCalendar">Schedule view coming soon...</div>
            </div>
        `;
    }

    renderMessages() {
        const conversations = messagingManager.getConversations();
        
        return `
            <div class="messages-section">
                <h3>Messages</h3>
                <div class="messages-container">
                    <div class="conversations-list">
                        ${conversations.map(conv => this.renderConversationItem(conv)).join('')}
                    </div>
                    <div class="message-content">
                        <p>Select a conversation to view messages</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderAppointmentCard(appointment) {
        return `
            <div class="appointment-card" data-id="${appointment.id}">
                <div class="appointment-header">
                    <h4>${this.userProfile.role === 'student' ? appointment.teacherName : appointment.studentName}</h4>
                    <span class="status-badge status-${appointment.status}">${appointment.status}</span>
                </div>
                <div class="appointment-details">
                    <p><strong>Date:</strong> ${appointment.date}</p>
                    <p><strong>Time:</strong> ${appointment.time}</p>
                    <p><strong>Purpose:</strong> ${appointment.purpose}</p>
                </div>
                <div class="appointment-actions">
                    ${this.renderAppointmentActions(appointment)}
                </div>
            </div>
        `;
    }

    renderAppointmentActions(appointment) {
        const userRole = this.userProfile.role;
        const status = appointment.status;

        if (userRole === 'teacher' && status === 'pending') {
            return `
                <button onclick="app.approveAppointment('${appointment.id}')" class="btn-approve">Approve</button>
                <button onclick="app.rejectAppointment('${appointment.id}')" class="btn-reject">Reject</button>
            `;
        } else if (userRole === 'student' && ['pending', 'approved'].includes(status)) {
            return `
                <button onclick="app.cancelAppointment('${appointment.id}')" class="btn-cancel">Cancel</button>
            `;
        }
        return '';
    }

    renderConversationItem(conversation) {
        return `
            <div class="conversation-item" data-user-id="${conversation.otherUser.id}">
                <div class="conversation-info">
                    <h4>${conversation.otherUser.name}</h4>
                    <p class="last-message">${conversation.lastMessage.content.substring(0, 50)}...</p>
                </div>
                ${conversation.unreadCount > 0 ? `<span class="unread-count">${conversation.unreadCount}</span>` : ''}
            </div>
        `;
    }

    // Event binding methods
    bindAdminEvents() {
        // Add admin-specific event listeners
    }

    bindTeacherEvents() {
        // Add teacher-specific event listeners
    }

    bindStudentEvents() {
        // Book appointment form
        document.getElementById('bookAppointmentForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleBookAppointment();
        });
    }

    async handleBookAppointment() {
        try {
            // Implementation for booking appointment
            this.showSuccess('Appointment booked successfully!');
        } catch (error) {
            this.showError(error.message);
        }
    }

    // Appointment actions
    async approveAppointment(appointmentId) {
        try {
            await appointmentManager.approveAppointment(appointmentId);
            this.showSuccess('Appointment approved!');
        } catch (error) {
            this.showError(error.message);
        }
    }

    async rejectAppointment(appointmentId) {
        try {
            await appointmentManager.rejectAppointment(appointmentId);
            this.showSuccess('Appointment rejected!');
        } catch (error) {
            this.showError(error.message);
        }
    }

    async cancelAppointment(appointmentId) {
        try {
            await appointmentManager.cancelAppointment(appointmentId);
            this.showSuccess('Appointment cancelled!');
        } catch (error) {
            this.showError(error.message);
        }
    }

    // UI Helper methods
    switchView(view) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        document.getElementById(view).classList.add('active');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    showLoading(message = 'Loading...') {
        // Implementation for loading indicator
    }

    hideLoading() {
        // Implementation for hiding loading indicator
    }

    showSuccess(message) {
        // Implementation for success notification
        console.log('Success:', message);
    }

    showError(message) {
        // Implementation for error notification
        console.error('Error:', message);
    }

    updateUI() {
        // Update UI based on current state
        const isAuth = isAuthenticated();
        
        // Show/hide elements based on auth state
        document.querySelectorAll('.auth-required').forEach(el => {
            el.style.display = isAuth ? 'block' : 'none';
        });
        
        document.querySelectorAll('.guest-only').forEach(el => {
            el.style.display = isAuth ? 'none' : 'block';
        });
    }

    refreshDashboard() {
        if (this.currentView === 'dashboard' && this.userProfile) {
            this.renderDashboard(this.userProfile.role);
        }
    }
}

// Initialize the application
const app = new AppState();

// Make app globally available for event handlers
window.app = app;

// Ensure showLoginModal is always available globally
window.showLoginModal = function(role = null) {
    setTimeout(function() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'block';
            // Removed demo autofill logic
        }
    }, 0);
};

window.showRegisterModal = function() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'block';
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

window.closeAllModals = function() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
};

// Export for module usage
export default app;
