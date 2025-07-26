/**
 * Admin Dashboard - Simplified Demo Version
 * Works without Firebase dependencies
 */

class AdminDashboard {
    constructor() {
        this.currentUser = {
            id: 'admin_001',
            name: 'Administrator',
            email: 'admin@edubook.com',
            role: 'admin'
        };
        this.users = [];
        this.appointments = [];
        this.systemStats = {};
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Admin Dashboard...');
            await this.loadDemoData();
            this.setupEventListeners();
            this.renderDashboard();
            this.showWelcomeMessage();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    async loadDemoData() {
        // Demo users
        this.users = [
            {
                id: 'student_001',
                name: 'John Doe',
                email: 'john.doe@student.edu',
                role: 'student',
                status: 'active',
                lastLogin: '2025-07-27T10:30:00Z'
            },
            {
                id: 'student_002',
                name: 'Jane Smith',
                email: 'jane.smith@student.edu',
                role: 'student',
                status: 'active',
                lastLogin: '2025-07-26T15:45:00Z'
            },
            {
                id: 'teacher_001',
                name: 'Dr. Smith',
                email: 'dr.smith@university.edu',
                role: 'teacher',
                status: 'active',
                department: 'Computer Science',
                lastLogin: '2025-07-27T09:15:00Z'
            },
            {
                id: 'teacher_002',
                name: 'Prof. Johnson',
                email: 'prof.johnson@university.edu',
                role: 'teacher',
                status: 'pending',
                department: 'Mathematics',
                lastLogin: '2025-07-25T14:20:00Z'
            }
        ];

        // Demo appointments
        this.appointments = [
            {
                id: 'apt_001',
                studentName: 'John Doe',
                teacherName: 'Dr. Smith',
                date: '2025-07-28',
                time: '10:00',
                status: 'confirmed',
                type: 'consultation'
            },
            {
                id: 'apt_002',
                studentName: 'Jane Smith',
                teacherName: 'Prof. Johnson',
                date: '2025-07-28',
                time: '14:00',
                status: 'pending',
                type: 'academic_support'
            },
            {
                id: 'apt_003',
                studentName: 'Mike Johnson',
                teacherName: 'Dr. Smith',
                date: '2025-07-29',
                time: '11:00',
                status: 'completed',
                type: 'project_discussion'
            }
        ];

        // Demo system stats
        this.systemStats = {
            totalUsers: this.users.length,
            activeUsers: this.users.filter(u => u.status === 'active').length,
            totalStudents: this.users.filter(u => u.role === 'student').length,
            totalTeachers: this.users.filter(u => u.role === 'teacher').length,
            pendingTeachers: this.users.filter(u => u.role === 'teacher' && u.status === 'pending').length,
            totalAppointments: this.appointments.length,
            pendingAppointments: this.appointments.filter(a => a.status === 'pending').length,
            confirmedAppointments: this.appointments.filter(a => a.status === 'confirmed').length,
            completedAppointments: this.appointments.filter(a => a.status === 'completed').length
        };
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section || e.target.textContent.toLowerCase().replace(/\s+/g, '');
                this.showSection(section);
            });
        });

        // Quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // System actions
        this.setupSystemActionListeners();

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    setupSystemActionListeners() {
        // System backup
        document.getElementById('systemBackupBtn')?.addEventListener('click', () => {
            this.performSystemBackup();
        });

        // Send announcement
        document.getElementById('sendAnnouncementBtn')?.addEventListener('click', () => {
            this.showAnnouncementModal();
        });

        // Generate report
        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            this.generateSystemReport();
        });

        // System maintenance
        document.getElementById('systemMaintenanceBtn')?.addEventListener('click', () => {
            this.performSystemMaintenance();
        });

        // Manage permissions
        document.getElementById('managePermissionsBtn')?.addEventListener('click', () => {
            this.showPermissionsModal();
        });
    }

    renderDashboard() {
        this.updateUserInfo();
        this.renderStats();
        this.renderUserManagement();
        this.renderAppointmentOverview();
        this.renderSystemActions();
    }

    updateUserInfo() {
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.name;
        }

        const userRoleElement = document.querySelector('.user-role');
        if (userRoleElement) {
            userRoleElement.textContent = 'System Administrator';
        }
    }

    renderStats() {
        // Update all stat cards
        Object.keys(this.systemStats).forEach(key => {
            this.updateStatCard(key.replace(/([A-Z])/g, '-$1').toLowerCase(), this.systemStats[key]);
        });

        // Update specific stat displays
        const statElements = {
            'total-users': this.systemStats.totalUsers,
            'active-users': this.systemStats.activeUsers,
            'total-students': this.systemStats.totalStudents,
            'total-teachers': this.systemStats.totalTeachers,
            'pending-teachers': this.systemStats.pendingTeachers,
            'total-appointments': this.systemStats.totalAppointments,
            'pending-appointments': this.systemStats.pendingAppointments,
            'confirmed-appointments': this.systemStats.confirmedAppointments
        };

        Object.entries(statElements).forEach(([id, value]) => {
            this.updateStatCard(id, value);
        });
    }

    updateStatCard(id, value) {
        const element = document.getElementById(id) || 
                       document.querySelector(`[data-stat="${id}"]`) ||
                       document.querySelector(`.stat-${id} .stat-number`);
        if (element) {
            element.textContent = value;
        }
    }

    renderUserManagement() {
        const container = document.getElementById('userManagementList') || 
                         document.querySelector('.user-management-list');
        if (!container) return;

        const recentUsers = this.users.slice(0, 5);

        container.innerHTML = recentUsers.map(user => `
            <div class="user-card" data-id="${user.id}">
                <div class="user-info">
                    <div class="user-avatar">
                        <i class="fas fa-${user.role === 'student' ? 'user-graduate' : 'chalkboard-teacher'}"></i>
                    </div>
                    <div class="user-details">
                        <h5>${user.name}</h5>
                        <p>${user.email}</p>
                        <span class="user-role">${user.role}</span>
                        ${user.department ? `<span class="user-department">${user.department}</span>` : ''}
                    </div>
                </div>
                <div class="user-status">
                    <span class="status-badge status-${user.status}">${user.status}</span>
                    <small>Last login: ${this.formatTime(user.lastLogin)}</small>
                </div>
                <div class="user-actions">
                    ${user.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="adminDashboard.approveUser('${user.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.rejectUser('${user.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewUser('${user.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editUser('${user.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    `}
                </div>
            </div>
        `).join('');
    }

    renderAppointmentOverview() {
        const container = document.getElementById('appointmentOverviewList') || 
                         document.querySelector('.appointment-overview-list');
        if (!container) return;

        const recentAppointments = this.appointments
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        container.innerHTML = recentAppointments.map(apt => `
            <div class="appointment-overview-card" data-id="${apt.id}">
                <div class="appointment-participants">
                    <div class="participant">
                        <i class="fas fa-user-graduate"></i>
                        <span>${apt.studentName}</span>
                    </div>
                    <div class="appointment-arrow">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                    <div class="participant">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span>${apt.teacherName}</span>
                    </div>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(apt.date)}</p>
                    <p><i class="fas fa-clock"></i> ${apt.time}</p>
                    <p><i class="fas fa-tag"></i> ${apt.type.replace('_', ' ')}</p>
                </div>
                <div class="appointment-status">
                    <span class="status-badge status-${apt.status}">${apt.status}</span>
                </div>
                <div class="appointment-admin-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewAppointment('${apt.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${apt.status === 'pending' ? `
                        <button class="btn btn-sm btn-warning" onclick="adminDashboard.escalateAppointment('${apt.id}')">
                            <i class="fas fa-exclamation-triangle"></i> Escalate
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderSystemActions() {
        const container = document.getElementById('systemActions') || 
                         document.querySelector('.system-actions');
        if (!container) return;

        container.innerHTML = `
            <div class="system-action-grid">
                <button class="system-action-btn" id="systemBackupBtn">
                    <i class="fas fa-database"></i>
                    <span>System Backup</span>
                </button>
                <button class="system-action-btn" id="sendAnnouncementBtn">
                    <i class="fas fa-bullhorn"></i>
                    <span>Send Announcement</span>
                </button>
                <button class="system-action-btn" id="generateReportBtn">
                    <i class="fas fa-file-alt"></i>
                    <span>Generate Report</span>
                </button>
                <button class="system-action-btn" id="systemMaintenanceBtn">
                    <i class="fas fa-tools"></i>
                    <span>System Maintenance</span>
                </button>
                <button class="system-action-btn" id="managePermissionsBtn">
                    <i class="fas fa-shield-alt"></i>
                    <span>Manage Permissions</span>
                </button>
            </div>
        `;

        // Re-attach event listeners
        this.setupSystemActionListeners();
    }

    // User management functions
    approveUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.status = 'active';
            this.updateSystemStats();
            this.renderUserManagement();
            this.renderStats();
            this.showNotification(`${user.name} has been approved and activated!`, 'success');
        }
    }

    rejectUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.status = 'rejected';
            this.updateSystemStats();
            this.renderUserManagement();
            this.renderStats();
            this.showNotification(`${user.name}'s application has been rejected.`, 'warning');
        }
    }

    viewUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.showNotification(`Viewing profile for ${user.name} (Demo mode)`, 'info');
        }
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.showNotification(`Editing profile for ${user.name} (Demo mode)`, 'info');
        }
    }

    // Appointment management functions
    viewAppointment(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            this.showNotification(`Viewing appointment: ${appointment.studentName} → ${appointment.teacherName}`, 'info');
        }
    }

    escalateAppointment(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            this.showNotification(`Appointment escalated: ${appointment.studentName} → ${appointment.teacherName}`, 'warning');
        }
    }

    // System functions
    performSystemBackup() {
        this.showNotification('Starting system backup...', 'info');
        
        setTimeout(() => {
            this.showNotification('System backup completed successfully!', 'success');
        }, 2000);
    }

    showAnnouncementModal() {
        this.showNotification('Announcement composer opened! (Demo mode)', 'info');
    }

    generateSystemReport() {
        this.showNotification('Generating system report...', 'info');
        
        setTimeout(() => {
            this.showNotification('System report generated and ready for download!', 'success');
        }, 1500);
    }

    performSystemMaintenance() {
        this.showNotification('System maintenance mode activated! (Demo mode)', 'warning');
    }

    showPermissionsModal() {
        this.showNotification('Permission management opened! (Demo mode)', 'info');
    }

    handleQuickAction(action) {
        switch (action) {
            case 'backup':
                this.performSystemBackup();
                break;
            case 'announcement':
                this.showAnnouncementModal();
                break;
            case 'report':
                this.generateSystemReport();
                break;
            case 'maintenance':
                this.performSystemMaintenance();
                break;
            case 'permissions':
                this.showPermissionsModal();
                break;
            default:
                this.showNotification(`Quick action: ${action}`, 'info');
        }
    }

    updateSystemStats() {
        this.systemStats = {
            totalUsers: this.users.length,
            activeUsers: this.users.filter(u => u.status === 'active').length,
            totalStudents: this.users.filter(u => u.role === 'student').length,
            totalTeachers: this.users.filter(u => u.role === 'teacher').length,
            pendingTeachers: this.users.filter(u => u.role === 'teacher' && u.status === 'pending').length,
            totalAppointments: this.appointments.length,
            pendingAppointments: this.appointments.filter(a => a.status === 'pending').length,
            confirmedAppointments: this.appointments.filter(a => a.status === 'confirmed').length,
            completedAppointments: this.appointments.filter(a => a.status === 'completed').length
        };
    }

    showSection(sectionName) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.showNotification(`Switched to ${sectionName} section`, 'info');
    }

    logout() {
        this.showNotification('Logging out...', 'info');
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
    }

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(message, type = 'info') {
        if (typeof window.dashboardUI !== 'undefined' && window.dashboardUI.showToast) {
            window.dashboardUI.showToast(message, type);
        } else {
            // Fallback notification
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};
                color: white;
                border-radius: 6px;
                z-index: 10000;
                font-weight: 500;
                max-width: 300px;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.showNotification(`Welcome, ${this.currentUser.name}! System overview loaded.`, 'success');
        }, 500);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Admin Dashboard...');
    window.adminDashboard = new AdminDashboard();
});

// Export for global access
window.AdminDashboard = AdminDashboard;
