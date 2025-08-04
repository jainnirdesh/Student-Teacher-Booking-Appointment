/**
 * Production Teacher Dashboard
 * Real Firebase integration for managing appointments and students
 */

import { 
    auth, 
    db, 
    collection, 
    doc, 
    getDocs, 
    getDoc,
    addDoc, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    orderBy, 
    onSnapshot 
} from '../js/firebase-config.js';

class TeacherDashboard {
    constructor() {
        this.currentUser = null;
        this.appointments = [];
        this.students = [];
        this.messages = [];
        this.schedule = [];
        this.userProfile = null;
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
            // Load teacher profile information
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            if (userDoc.exists()) {
                this.userProfile = userDoc.data();
            }

            // Load appointments for this teacher
            const appointmentsQuery = query(
                collection(db, 'appointments'),
                where('teacherId', '==', this.currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            const appointmentsSnapshot = await getDocs(appointmentsQuery);
            this.appointments = appointmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load students who have appointments with this teacher
            const uniqueStudentIds = [...new Set(this.appointments.map(apt => apt.studentId))];
            if (uniqueStudentIds.length > 0) {
                const studentsQuery = query(
                    collection(db, 'users'),
                    where('__name__', 'in', uniqueStudentIds)
                );
                const studentsSnapshot = await getDocs(studentsQuery);
                this.students = studentsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }

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

            // Load teacher's availability schedule
            const scheduleQuery = query(
                collection(db, 'schedules'),
                where('teacherId', '==', this.currentUser.uid)
            );
            const scheduleSnapshot = await getDocs(scheduleQuery);
            this.schedule = scheduleSnapshot.docs.map(doc => ({
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
            where('teacherId', '==', this.currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(appointmentsQuery, (snapshot) => {
            this.appointments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.renderAppointments();
            this.renderStats();
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

        // Quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Logout buttons
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
        if (dropdownLogoutBtn) {
            dropdownLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    async approveAppointment(appointmentId) {
        try {
            await updateDoc(doc(db, 'appointments', appointmentId), {
                status: 'confirmed',
                confirmedAt: new Date()
            });
            this.showSuccess('Appointment approved successfully!');
        } catch (error) {
            console.error('Error approving appointment:', error);
            this.showError('Failed to approve appointment');
        }
    }

    async rejectAppointment(appointmentId, reason = '') {
        try {
            await updateDoc(doc(db, 'appointments', appointmentId), {
                status: 'rejected',
                rejectionReason: reason,
                rejectedAt: new Date()
            });
            this.showSuccess('Appointment rejected');
        } catch (error) {
            console.error('Error rejecting appointment:', error);
            this.showError('Failed to reject appointment');
        }
    }

    async setAvailability(day, timeSlots) {
        try {
            const scheduleData = {
                teacherId: this.currentUser.uid,
                day: day,
                timeSlots: timeSlots,
                updatedAt: new Date()
            };

            // Check if schedule exists for this day
            const existingSchedule = this.schedule.find(s => s.day === day);
            if (existingSchedule) {
                await updateDoc(doc(db, 'schedules', existingSchedule.id), scheduleData);
            } else {
                await addDoc(collection(db, 'schedules'), scheduleData);
            }

            this.showSuccess('Availability updated successfully!');
        } catch (error) {
            console.error('Error setting availability:', error);
            this.showError('Failed to update availability');
        }
    }

    async sendMessage(studentId, subject, message) {
        try {
            const messageData = {
                senderId: this.currentUser.uid,
                recipientId: studentId,
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

    handleQuickAction(action) {
        switch (action) {
            case 'setAvailability':
                this.showAvailabilityModal();
                break;
            case 'sendMessage':
                this.showMessageModal();
                break;
            case 'viewReports':
                this.showSection('reports');
                break;
            case 'manageStudents':
                this.showSection('students');
                break;
            default:
                console.log('Quick action:', action);
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
        this.renderStudents();
        this.renderMessages();
        this.renderSchedule();
        this.updateNotificationCount();
    }

    updateUserInfo() {
        // Update teacher name in sidebar
        const teacherNameElement = document.getElementById('teacherName');
        if (teacherNameElement && this.userProfile) {
            teacherNameElement.textContent = this.userProfile.name || this.currentUser.displayName || 'Teacher';
        }

        // Update teacher name in header
        const headerUserName = document.querySelector('.header-right .user-name');
        if (headerUserName && this.userProfile) {
            headerUserName.textContent = this.userProfile.name || this.currentUser.displayName || 'Teacher';
        }

        // Update user avatar initials
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar && this.userProfile) {
            const initials = this.userProfile.name 
                ? this.userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()
                : 'T';
            userAvatar.src = `https://via.placeholder.com/40x40?text=${initials}`;
            userAvatar.alt = this.userProfile.name || 'Teacher';
        }
    }

    renderStats() {
        const pendingCount = this.appointments.filter(apt => apt.status === 'pending').length;
        const confirmedCount = this.appointments.filter(apt => apt.status === 'confirmed').length;
        const totalStudents = this.students.length;
        const unreadMessages = this.messages.filter(msg => !msg.read).length;

        this.updateStatCard('pendingAppointments', pendingCount);
        this.updateStatCard('confirmedAppointments', confirmedCount);
        this.updateStatCard('totalStudents', totalStudents);
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
            container.innerHTML = '<p class="no-data">No appointment requests found.</p>';
            return;
        }

        container.innerHTML = this.appointments.map(appointment => `
            <div class="appointment-card ${appointment.status}">
                <div class="appointment-header">
                    <h4>${appointment.studentName || 'Student'}</h4>
                    <span class="status-badge ${appointment.status}">${appointment.status.toUpperCase()}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(appointment.date)}</p>
                    <p><i class="fas fa-clock"></i> ${appointment.time}</p>
                    <p><i class="fas fa-tag"></i> ${appointment.type}</p>
                    ${appointment.notes ? `<p><i class="fas fa-note-sticky"></i> ${appointment.notes}</p>` : ''}
                </div>
                <div class="appointment-actions">
                    ${appointment.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="teacherDashboard.approveAppointment('${appointment.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="teacherDashboard.rejectAppointment('${appointment.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderStudents() {
        const container = document.getElementById('studentsContainer');
        if (!container) return;

        if (this.students.length === 0) {
            container.innerHTML = '<p class="no-data">No students found.</p>';
            return;
        }

        container.innerHTML = this.students.map(student => `
            <div class="student-card">
                <div class="student-info">
                    <h4>${student.name}</h4>
                    <p class="email">${student.email}</p>
                    <p class="appointment-count">
                        ${this.appointments.filter(apt => apt.studentId === student.id).length} appointments
                    </p>
                </div>
                <div class="student-actions">
                    <button class="btn btn-primary btn-sm" onclick="teacherDashboard.messageStudent('${student.id}')">
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
                <div class="message-actions">
                    ${!message.read ? `<button class="btn btn-sm btn-primary" onclick="teacherDashboard.markAsRead('${message.id}')">Mark as Read</button>` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="teacherDashboard.replyMessage('${message.id}')">Reply</button>
                </div>
            </div>
        `).join('');
    }

    renderSchedule() {
        const container = document.getElementById('scheduleContainer');
        if (!container) return;

        // Implementation for schedule display
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        container.innerHTML = days.map(day => {
            const daySchedule = this.schedule.find(s => s.day === day);
            return `
                <div class="schedule-day">
                    <h4>${day}</h4>
                    <div class="time-slots">
                        ${daySchedule ? 
                            daySchedule.timeSlots.map(slot => `
                                <span class="time-slot ${slot.available ? 'available' : 'unavailable'}">
                                    ${slot.time}
                                </span>
                            `).join('') :
                            '<p class="no-schedule">No schedule set</p>'
                        }
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="teacherDashboard.editSchedule('${day}')">
                        Edit
                    </button>
                </div>
            `;
        }).join('');
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
let teacherDashboard;
document.addEventListener('DOMContentLoaded', () => {
    teacherDashboard = new TeacherDashboard();
    window.teacherDashboard = teacherDashboard;
});
