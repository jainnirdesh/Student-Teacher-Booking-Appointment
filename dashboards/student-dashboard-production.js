/**
 * Production Student Dashboard
 * Real Firebase integration for appointment booking
 */

import { 
    auth, 
    db, 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot 
} from '../js/firebase-config.js';

class StudentDashboard {
    constructor() {
        this.currentUser = null;
        this.appointments = [];
        this.teachers = [];
        this.messages = [];
        this.init();
    }

    async init() {
        try {
            // Check authentication
            if (!auth.currentUser) {
                window.location.href = '../index.html';
                return;
            }

            this.currentUser = auth.currentUser;
            await this.loadUserData();
            this.setupEventListeners();
            this.setupRealtimeListeners();
            this.renderDashboard();
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    async loadUserData() {
        try {
            // Load appointments
            const appointmentsQuery = query(
                collection(db, 'appointments'),
                where('studentId', '==', this.currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            const appointmentsSnapshot = await getDocs(appointmentsQuery);
            this.appointments = appointmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load approved teachers
            const teachersQuery = query(
                collection(db, 'users'),
                where('role', '==', 'teacher'),
                where('isApproved', '==', true)
            );
            const teachersSnapshot = await getDocs(teachersQuery);
            this.teachers = teachersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load messages
            const messagesQuery = query(
                collection(db, 'messages'),
                where('recipientId', '==', this.currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            this.messages = messagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error('Error loading user data:', error);
            this.showError('Error loading data');
        }
    }

    setupRealtimeListeners() {
        // Real-time appointments listener
        const appointmentsQuery = query(
            collection(db, 'appointments'),
            where('studentId', '==', this.currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(appointmentsQuery, (snapshot) => {
            this.appointments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.renderAppointments();
        });

        // Real-time messages listener
        const messagesQuery = query(
            collection(db, 'messages'),
            where('recipientId', '==', this.currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(messagesQuery, (snapshot) => {
            this.messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.renderMessages();
            this.updateNotificationCount();
        });
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Book appointment button
        const bookBtn = document.getElementById('bookAppointmentBtn');
        if (bookBtn) {
            bookBtn.addEventListener('click', () => this.showBookingModal());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    async bookAppointment(teacherId, date, time, type, notes) {
        try {
            const appointmentData = {
                studentId: this.currentUser.uid,
                teacherId: teacherId,
                date: date,
                time: time,
                type: type,
                notes: notes,
                status: 'pending',
                createdAt: new Date()
            };

            await addDoc(collection(db, 'appointments'), appointmentData);
            this.showSuccess('Appointment request sent successfully!');
            this.closeBookingModal();

        } catch (error) {
            console.error('Error booking appointment:', error);
            this.showError('Failed to book appointment');
        }
    }

    async sendMessage(teacherId, subject, message) {
        try {
            const messageData = {
                senderId: this.currentUser.uid,
                recipientId: teacherId,
                subject: subject,
                message: message,
                read: false,
                createdAt: new Date()
            };

            await addDoc(collection(db, 'messages'), messageData);
            this.showSuccess('Message sent successfully!');

        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message');
        }
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(sec => {
            sec.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(section + 'Section');
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

        // Update breadcrumb
        const breadcrumb = document.getElementById('currentSection');
        if (breadcrumb) {
            breadcrumb.textContent = section.charAt(0).toUpperCase() + section.slice(1);
        }
    }

    renderDashboard() {
        this.updateUserInfo();
        this.renderStats();
        this.renderAppointments();
        this.renderTeachers();
        this.renderMessages();
        this.updateNotificationCount();
    }

    updateUserInfo() {
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.displayName || this.currentUser.email;
        }
    }

    renderStats() {
        const pendingCount = this.appointments.filter(apt => apt.status === 'pending').length;
        const confirmedCount = this.appointments.filter(apt => apt.status === 'confirmed').length;
        const unreadMessages = this.messages.filter(msg => !msg.read).length;

        this.updateStatCard('pendingAppointments', pendingCount);
        this.updateStatCard('confirmedAppointments', confirmedCount);
        this.updateStatCard('unreadMessages', unreadMessages);
    }

    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    renderAppointments() {
        const container = document.getElementById('appointmentsContainer');
        if (!container) return;

        if (this.appointments.length === 0) {
            container.innerHTML = '<p class="no-data">No appointments found. Book your first appointment!</p>';
            return;
        }

        container.innerHTML = this.appointments.map(appointment => `
            <div class="appointment-card ${appointment.status}">
                <div class="appointment-header">
                    <h4>${appointment.teacherName || 'Teacher'}</h4>
                    <span class="status-badge ${appointment.status}">${appointment.status.toUpperCase()}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(appointment.date)}</p>
                    <p><i class="fas fa-clock"></i> ${appointment.time}</p>
                    <p><i class="fas fa-tag"></i> ${appointment.type}</p>
                    ${appointment.notes ? `<p><i class="fas fa-note-sticky"></i> ${appointment.notes}</p>` : ''}
                </div>
                <div class="appointment-actions">
                    ${appointment.status === 'pending' ? 
                        `<button class="btn btn-sm btn-danger" onclick="studentDashboard.cancelAppointment('${appointment.id}')">Cancel</button>` : 
                        ''
                    }
                </div>
            </div>
        `).join('');
    }

    renderTeachers() {
        const container = document.getElementById('teachersContainer');
        if (!container) return;

        container.innerHTML = this.teachers.map(teacher => `
            <div class="teacher-card">
                <div class="teacher-info">
                    <h4>${teacher.name}</h4>
                    <p class="department">${teacher.department}</p>
                    <p class="subject">${teacher.subject}</p>
                </div>
                <div class="teacher-actions">
                    <button class="btn btn-primary btn-sm" onclick="studentDashboard.bookWithTeacher('${teacher.id}')">
                        <i class="fas fa-calendar-plus"></i> Book
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="studentDashboard.messageTeacher('${teacher.id}')">
                        <i class="fas fa-message"></i> Message
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = '<p class="no-data">No messages found.</p>';
            return;
        }

        container.innerHTML = this.messages.map(message => `
            <div class="message-card ${message.read ? '' : 'unread'}">
                <div class="message-header">
                    <h5>${message.subject}</h5>
                    <span class="timestamp">${this.formatDate(message.createdAt)}</span>
                </div>
                <p class="message-content">${message.message}</p>
                ${!message.read ? `<button class="btn btn-sm btn-primary" onclick="studentDashboard.markAsRead('${message.id}')">Mark as Read</button>` : ''}
            </div>
        `).join('');
    }

    updateNotificationCount() {
        const unreadCount = this.messages.filter(msg => !msg.read).length;
        const notificationBadge = document.getElementById('notificationCount');
        if (notificationBadge) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    async logout() {
        try {
            await auth.signOut();
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Error logging out');
        }
    }

    formatDate(date) {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 3000;
            max-width: 350px;
            animation: slideInRight 0.3s ease;
        `;

        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }
}

// Initialize dashboard
let studentDashboard;
document.addEventListener('DOMContentLoaded', () => {
    studentDashboard = new StudentDashboard();
    window.studentDashboard = studentDashboard;
});
