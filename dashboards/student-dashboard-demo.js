/**
 * Student Dashboard - Simplified Demo Version
 * Works without Firebase dependencies
 */

class StudentDashboard {
    constructor() {
        this.currentUser = {
            id: 'student_001',
            name: 'John Doe',
            email: 'john.doe@student.edu',
            role: 'student'
        };
        this.appointments = [];
        this.messages = [];
        this.teachers = [];
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Student Dashboard...');
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
                teacherName: 'Dr. Smith',
                teacherId: 'teacher_001',
                date: '2025-07-28',
                time: '10:00',
                type: 'consultation',
                status: 'confirmed',
                notes: 'Discuss project requirements'
            },
            {
                id: 'apt_002',
                teacherName: 'Prof. Johnson',
                teacherId: 'teacher_002',
                date: '2025-07-30',
                time: '14:00',
                type: 'academic_support',
                status: 'pending',
                notes: 'Math tutoring session'
            }
        ];

        // Demo messages
        this.messages = [
            {
                id: 'msg_001',
                from: 'Dr. Smith',
                subject: 'Project Approval',
                content: 'Your project proposal has been approved.',
                timestamp: '2025-07-27T10:30:00Z',
                read: false
            },
            {
                id: 'msg_002',
                from: 'Prof. Johnson',
                subject: 'Assignment Feedback',
                content: 'Please review the feedback on your latest assignment.',
                timestamp: '2025-07-26T15:45:00Z',
                read: true
            }
        ];

        // Demo teachers
        this.teachers = [
            {
                id: 'teacher_001',
                name: 'Dr. Smith',
                subject: 'Computer Science',
                department: 'Engineering',
                availability: 'Mon-Fri 9:00-17:00'
            },
            {
                id: 'teacher_002',
                name: 'Prof. Johnson',
                subject: 'Mathematics',
                department: 'Sciences',
                availability: 'Mon-Wed-Fri 10:00-16:00'
            },
            {
                id: 'teacher_003',
                name: 'Dr. Williams',
                subject: 'Physics',
                department: 'Sciences',
                availability: 'Tue-Thu 9:00-15:00'
            }
        ];
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Quick actions
        document.getElementById('bookAppointmentBtn')?.addEventListener('click', () => {
            this.showBookingModal();
        });

        document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
            this.showMessageModal();
        });

        document.getElementById('viewScheduleBtn')?.addEventListener('click', () => {
            this.showSection('appointments');
        });

        document.getElementById('editProfileBtn')?.addEventListener('click', () => {
            this.showEditProfileModal();
        });

        // Refresh button
        document.getElementById('refreshData')?.addEventListener('click', () => {
            this.refreshData();
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
        this.renderMessages();
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
    }

    renderStats() {
        // Update stats cards
        const upcomingCount = this.appointments.filter(apt => 
            apt.status === 'confirmed' && new Date(apt.date) >= new Date()
        ).length;
        
        const unreadMessages = this.messages.filter(msg => !msg.read).length;

        this.updateStatCard('upcoming-appointments', upcomingCount);
        this.updateStatCard('unread-messages', unreadMessages);
        this.updateStatCard('total-teachers', this.teachers.length);
    }

    updateStatCard(id, value) {
        const element = document.getElementById(id) || document.querySelector(`[data-stat="${id}"]`);
        if (element) {
            element.textContent = value;
        }
    }

    renderAppointments() {
        const container = document.getElementById('appointmentsList');
        if (!container) return;

        const upcomingAppointments = this.appointments
            .filter(apt => new Date(apt.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        container.innerHTML = upcomingAppointments.map(apt => `
            <div class="appointment-card" data-id="${apt.id}">
                <div class="appointment-header">
                    <h4>${apt.teacherName}</h4>
                    <span class="status-badge status-${apt.status}">${apt.status}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(apt.date)}</p>
                    <p><i class="fas fa-clock"></i> ${apt.time}</p>
                    <p><i class="fas fa-tag"></i> ${apt.type}</p>
                    ${apt.notes ? `<p><i class="fas fa-note"></i> ${apt.notes}</p>` : ''}
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-sm btn-outline" onclick="studentDashboard.viewAppointment('${apt.id}')">
                        View Details
                    </button>
                    ${apt.status === 'pending' ? `
                        <button class="btn btn-sm btn-secondary" onclick="studentDashboard.cancelAppointment('${apt.id}')">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderMessages() {
        const container = document.getElementById('messagesList');
        if (!container) return;

        const recentMessages = this.messages
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        container.innerHTML = recentMessages.map(msg => `
            <div class="message-card ${!msg.read ? 'unread' : ''}" data-id="${msg.id}">
                <div class="message-header">
                    <h5>${msg.from}</h5>
                    <span class="message-time">${this.formatTime(msg.timestamp)}</span>
                </div>
                <h6>${msg.subject}</h6>
                <p>${msg.content}</p>
                <div class="message-actions">
                    <button class="btn btn-sm btn-primary" onclick="studentDashboard.viewMessage('${msg.id}')">
                        Read
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="studentDashboard.replyMessage('${msg.id}')">
                        Reply
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderQuickActions() {
        const container = document.getElementById('quickActions');
        if (!container) return;

        container.innerHTML = `
            <div class="quick-action-grid">
                <button class="quick-action-btn" id="bookAppointmentBtn">
                    <i class="fas fa-calendar-plus"></i>
                    <span>Book Appointment</span>
                </button>
                <button class="quick-action-btn" id="sendMessageBtn">
                    <i class="fas fa-envelope"></i>
                    <span>Send Message</span>
                </button>
                <button class="quick-action-btn" id="viewScheduleBtn">
                    <i class="fas fa-calendar-alt"></i>
                    <span>View Schedule</span>
                </button>
                <button class="quick-action-btn" id="editProfileBtn">
                    <i class="fas fa-user-edit"></i>
                    <span>Edit Profile</span>
                </button>
            </div>
        `;

        // Re-attach event listeners for quick actions
        this.setupQuickActionListeners();
    }

    setupQuickActionListeners() {
        document.getElementById('bookAppointmentBtn')?.addEventListener('click', () => {
            this.showBookingModal();
        });

        document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
            this.showMessageModal();
        });

        document.getElementById('viewScheduleBtn')?.addEventListener('click', () => {
            this.showSection('appointments');
        });

        document.getElementById('editProfileBtn')?.addEventListener('click', () => {
            this.showEditProfileModal();
        });
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

        // Update breadcrumb
        const breadcrumb = document.getElementById('currentSection');
        if (breadcrumb) {
            breadcrumb.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
        }

        // Show appropriate content
        this.showNotification(`Switched to ${sectionName} section`, 'info');
    }

    showBookingModal() {
        if (typeof window.dashboardUI !== 'undefined') {
            // Use the enhanced UI system if available
            const modal = this.createBookingModal();
            document.body.appendChild(modal);
            window.dashboardUI.openModal(modal.id);
        } else {
            // Fallback: simple alert
            this.showNotification('Booking modal opened! (Demo mode)', 'info');
        }
    }

    showMessageModal() {
        this.showNotification('Message modal opened! (Demo mode)', 'info');
    }

    showEditProfileModal() {
        this.showNotification('Profile edit modal opened! (Demo mode)', 'info');
    }

    viewAppointment(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            this.showNotification(`Viewing appointment with ${appointment.teacherName}`, 'info');
        }
    }

    cancelAppointment(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            appointment.status = 'cancelled';
            this.renderAppointments();
            this.showNotification(`Appointment with ${appointment.teacherName} has been cancelled`, 'warning');
        }
    }

    viewMessage(messageId) {
        const message = this.messages.find(msg => msg.id === messageId);
        if (message) {
            message.read = true;
            this.renderMessages();
            this.renderStats();
            this.showNotification(`Reading message from ${message.from}`, 'info');
        }
    }

    replyMessage(messageId) {
        const message = this.messages.find(msg => msg.id === messageId);
        if (message) {
            this.showNotification(`Replying to ${message.from}`, 'info');
        }
    }

    refreshData() {
        this.showNotification('Refreshing dashboard data...', 'info');
        
        setTimeout(() => {
            this.renderDashboard();
            this.showNotification('Dashboard refreshed successfully!', 'success');
        }, 1000);
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
            
            // Create simple notification
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
    console.log('Initializing Student Dashboard...');
    window.studentDashboard = new StudentDashboard();
});

// Export for global access
window.StudentDashboard = StudentDashboard;
