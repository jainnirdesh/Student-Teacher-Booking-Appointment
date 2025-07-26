/**
 * Teacher Dashboard - Simplified Demo Version
 * Works without Firebase dependencies
 */

class TeacherDashboard {
    constructor() {
        this.currentUser = {
            id: 'teacher_001',
            name: 'Dr. Smith',
            email: 'dr.smith@university.edu',
            role: 'teacher',
            department: 'Computer Science',
            subject: 'Programming'
        };
        this.appointments = [];
        this.students = [];
        this.schedule = [];
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Teacher Dashboard...');
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
        // Demo appointments
        this.appointments = [
            {
                id: 'apt_001',
                studentName: 'John Doe',
                studentId: 'student_001',
                date: '2025-07-28',
                time: '10:00',
                type: 'consultation',
                status: 'pending',
                notes: 'Discuss project requirements'
            },
            {
                id: 'apt_002',
                studentName: 'Jane Smith',
                studentId: 'student_002',
                date: '2025-07-28',
                time: '14:00',
                type: 'academic_support',
                status: 'confirmed',
                notes: 'Math tutoring session'
            },
            {
                id: 'apt_003',
                studentName: 'Mike Johnson',
                studentId: 'student_003',
                date: '2025-07-29',
                time: '11:00',
                type: 'project_discussion',
                status: 'pending',
                notes: 'Final project review'
            }
        ];

        // Demo students
        this.students = [
            {
                id: 'student_001',
                name: 'John Doe',
                email: 'john.doe@student.edu',
                course: 'Computer Science',
                year: '3rd Year'
            },
            {
                id: 'student_002',
                name: 'Jane Smith',
                email: 'jane.smith@student.edu',
                course: 'Information Technology',
                year: '2nd Year'
            },
            {
                id: 'student_003',
                name: 'Mike Johnson',
                email: 'mike.johnson@student.edu',
                course: 'Software Engineering',
                year: '4th Year'
            }
        ];

        // Demo schedule
        this.schedule = [
            { day: 'Monday', time: '09:00-11:00', available: true },
            { day: 'Monday', time: '14:00-16:00', available: true },
            { day: 'Tuesday', time: '10:00-12:00', available: false },
            { day: 'Wednesday', time: '09:00-11:00', available: true },
            { day: 'Thursday', time: '13:00-15:00', available: true },
            { day: 'Friday', time: '10:00-12:00', available: true }
        ];
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

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    renderDashboard() {
        this.updateUserInfo();
        this.renderStats();
        this.renderAppointments();
        this.renderSchedule();
        this.renderQuickActions();
    }

    updateUserInfo() {
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.name;
        }

        const userEmailElement = document.querySelector('.user-email');
        if (userEmailElement) {
            userEmailElement.textContent = this.currentUser.email;
        }

        const userRoleElement = document.querySelector('.user-role');
        if (userRoleElement) {
            userRoleElement.textContent = `${this.currentUser.department} - ${this.currentUser.subject}`;
        }
    }

    renderStats() {
        const pendingAppointments = this.appointments.filter(apt => apt.status === 'pending').length;
        const confirmedAppointments = this.appointments.filter(apt => apt.status === 'confirmed').length;
        const totalStudents = this.students.length;

        this.updateStatCard('pending-appointments', pendingAppointments);
        this.updateStatCard('confirmed-appointments', confirmedAppointments);
        this.updateStatCard('total-students', totalStudents);
    }

    updateStatCard(id, value) {
        const element = document.getElementById(id) || document.querySelector(`[data-stat="${id}"]`);
        if (element) {
            element.textContent = value;
        }
    }

    renderAppointments() {
        const container = document.getElementById('appointmentsList') || document.querySelector('.appointments-list');
        if (!container) return;

        const upcomingAppointments = this.appointments
            .filter(apt => new Date(apt.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        container.innerHTML = upcomingAppointments.map(apt => `
            <div class="appointment-card" data-id="${apt.id}">
                <div class="appointment-header">
                    <h4>${apt.studentName}</h4>
                    <span class="status-badge status-${apt.status}">${apt.status}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(apt.date)}</p>
                    <p><i class="fas fa-clock"></i> ${apt.time}</p>
                    <p><i class="fas fa-tag"></i> ${apt.type.replace('_', ' ')}</p>
                    ${apt.notes ? `<p><i class="fas fa-note"></i> ${apt.notes}</p>` : ''}
                </div>
                <div class="appointment-actions">
                    ${apt.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="teacherDashboard.approveAppointment('${apt.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="teacherDashboard.rejectAppointment('${apt.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-outline" onclick="teacherDashboard.viewAppointment('${apt.id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    `}
                    <button class="btn btn-sm btn-secondary" onclick="teacherDashboard.rescheduleAppointment('${apt.id}')">
                        <i class="fas fa-calendar-alt"></i> Reschedule
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderSchedule() {
        const container = document.getElementById('scheduleList') || document.querySelector('.schedule-list');
        if (!container) return;

        container.innerHTML = this.schedule.map(slot => `
            <div class="schedule-slot ${slot.available ? 'available' : 'unavailable'}">
                <div class="schedule-time">
                    <strong>${slot.day}</strong>
                    <span>${slot.time}</span>
                </div>
                <div class="schedule-status">
                    <span class="status-indicator ${slot.available ? 'available' : 'busy'}">
                        ${slot.available ? 'Available' : 'Busy'}
                    </span>
                </div>
                <div class="schedule-actions">
                    <button class="btn btn-sm btn-outline" onclick="teacherDashboard.toggleAvailability('${slot.day}', '${slot.time}')">
                        ${slot.available ? 'Mark Busy' : 'Mark Available'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderQuickActions() {
        const container = document.getElementById('quickActions') || document.querySelector('.quick-actions');
        if (!container) return;

        container.innerHTML = `
            <div class="quick-action-grid">
                <button class="quick-action-btn" data-action="set-availability">
                    <i class="fas fa-calendar"></i>
                    <span>Set Availability</span>
                </button>
                <button class="quick-action-btn" data-action="send-message">
                    <i class="fas fa-envelope"></i>
                    <span>Send Message</span>
                </button>
                <button class="quick-action-btn" data-action="view-reports">
                    <i class="fas fa-chart-line"></i>
                    <span>View Reports</span>
                </button>
                <button class="quick-action-btn" data-action="manage-students">
                    <i class="fas fa-users"></i>
                    <span>Manage Students</span>
                </button>
            </div>
        `;

        // Re-attach event listeners
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    handleQuickAction(action) {
        switch (action) {
            case 'set-availability':
                this.showNotification('Availability settings opened! (Demo mode)', 'info');
                break;
            case 'send-message':
                this.showNotification('Message composer opened! (Demo mode)', 'info');
                break;
            case 'view-reports':
                this.showNotification('Reports view opened! (Demo mode)', 'info');
                break;
            case 'manage-students':
                this.showNotification('Student management opened! (Demo mode)', 'info');
                break;
            default:
                this.showNotification(`Action: ${action}`, 'info');
        }
    }

    approveAppointment(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            appointment.status = 'confirmed';
            this.renderAppointments();
            this.renderStats();
            this.showNotification(`Appointment with ${appointment.studentName} approved!`, 'success');
        }
    }

    rejectAppointment(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            appointment.status = 'rejected';
            this.renderAppointments();
            this.renderStats();
            this.showNotification(`Appointment with ${appointment.studentName} rejected.`, 'warning');
        }
    }

    rescheduleAppointment(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            this.showNotification(`Reschedule appointment with ${appointment.studentName} (Demo mode)`, 'info');
        }
    }

    viewAppointment(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            this.showNotification(`Viewing appointment details for ${appointment.studentName}`, 'info');
        }
    }

    toggleAvailability(day, time) {
        const slot = this.schedule.find(s => s.day === day && s.time === time);
        if (slot) {
            slot.available = !slot.available;
            this.renderSchedule();
            this.showNotification(`${day} ${time} marked as ${slot.available ? 'available' : 'busy'}`, 'info');
        }
    }

    showSection(sectionName) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`) ||
                          document.querySelector(`.nav-link:contains("${sectionName}")`);
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
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
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
            this.showNotification(`Welcome back, ${this.currentUser.name}!`, 'success');
        }, 500);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Teacher Dashboard...');
    window.teacherDashboard = new TeacherDashboard();
});

// Export for global access
window.TeacherDashboard = TeacherDashboard;
