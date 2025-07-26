/**
 * Production Admin Dashboard
 * Real Firebase integration for system administration
 */

import { 
    auth, 
    db, 
    collection, 
    doc, 
    getDocs, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    orderBy, 
    onSnapshot 
} from '../js/firebase-config.js';

class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.appointments = [];
        this.messages = [];
        this.systemLogs = [];
        this.init();
    }

    async init() {
        try {
            // Check authentication and admin role
            if (!auth.currentUser) {
                window.location.href = '../index.html';
                return;
            }

            this.currentUser = auth.currentUser;
            
            // Verify admin role
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            if (!userDoc.exists() || userDoc.data().role !== 'admin') {
                this.showError('Access denied. Admin privileges required.');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
                return;
            }

            await this.loadSystemData();
            this.setupEventListeners();
            this.setupRealtimeListeners();
            this.renderDashboard();
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Failed to initialize admin dashboard');
        }
    }

    async loadSystemData() {
        try {
            // Load all users
            const usersSnapshot = await getDocs(collection(db, 'users'));
            this.users = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load all appointments
            const appointmentsSnapshot = await getDocs(
                query(collection(db, 'appointments'), orderBy('createdAt', 'desc'))
            );
            this.appointments = appointmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load all messages
            const messagesSnapshot = await getDocs(
                query(collection(db, 'messages'), orderBy('createdAt', 'desc'))
            );
            this.messages = messagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load system logs (if implemented)
            try {
                const logsSnapshot = await getDocs(
                    query(collection(db, 'systemLogs'), orderBy('timestamp', 'desc'))
                );
                this.systemLogs = logsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.log('System logs collection not found, creating...');
                this.systemLogs = [];
            }

        } catch (error) {
            console.error('Error loading system data:', error);
            this.showError('Error loading system data');
        }
    }

    setupRealtimeListeners() {
        // Real-time users listener
        onSnapshot(collection(db, 'users'), (snapshot) => {
            this.users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.renderUsers();
            this.renderStats();
        });

        // Real-time appointments listener
        onSnapshot(query(collection(db, 'appointments'), orderBy('createdAt', 'desc')), (snapshot) => {
            this.appointments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.renderAppointments();
            this.renderStats();
        });

        // Real-time messages listener
        onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), (snapshot) => {
            this.messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.renderMessages();
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

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async approveTeacher(teacherId) {
        try {
            await updateDoc(doc(db, 'users', teacherId), {
                isApproved: true,
                approvedAt: new Date(),
                approvedBy: this.currentUser.uid
            });

            this.logSystemAction('teacher_approved', { teacherId });
            this.showSuccess('Teacher approved successfully!');
        } catch (error) {
            console.error('Error approving teacher:', error);
            this.showError('Failed to approve teacher');
        }
    }

    async rejectTeacher(teacherId, reason = '') {
        try {
            await updateDoc(doc(db, 'users', teacherId), {
                isApproved: false,
                rejectionReason: reason,
                rejectedAt: new Date(),
                rejectedBy: this.currentUser.uid
            });

            this.logSystemAction('teacher_rejected', { teacherId, reason });
            this.showSuccess('Teacher application rejected');
        } catch (error) {
            console.error('Error rejecting teacher:', error);
            this.showError('Failed to reject teacher');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', userId));
            this.logSystemAction('user_deleted', { userId });
            this.showSuccess('User deleted successfully');
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showError('Failed to delete user');
        }
    }

    async deleteAppointment(appointmentId) {
        if (!confirm('Are you sure you want to delete this appointment?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'appointments', appointmentId));
            this.logSystemAction('appointment_deleted', { appointmentId });
            this.showSuccess('Appointment deleted successfully');
        } catch (error) {
            console.error('Error deleting appointment:', error);
            this.showError('Failed to delete appointment');
        }
    }

    async logSystemAction(action, data = {}) {
        try {
            await addDoc(collection(db, 'systemLogs'), {
                action: action,
                adminId: this.currentUser.uid,
                data: data,
                timestamp: new Date(),
                ip: 'unknown' // Could be enhanced with actual IP detection
            });
        } catch (error) {
            console.error('Error logging system action:', error);
        }
    }

    async generateReport(type) {
        try {
            const reportData = {
                type: type,
                generatedAt: new Date(),
                generatedBy: this.currentUser.uid,
                data: this.getReportData(type)
            };

            await addDoc(collection(db, 'reports'), reportData);
            this.showSuccess(`${type} report generated successfully!`);
            
            // Could implement download functionality here
            this.downloadReport(reportData);
            
        } catch (error) {
            console.error('Error generating report:', error);
            this.showError('Failed to generate report');
        }
    }

    getReportData(type) {
        switch (type) {
            case 'users':
                return {
                    totalUsers: this.users.length,
                    students: this.users.filter(u => u.role === 'student').length,
                    teachers: this.users.filter(u => u.role === 'teacher').length,
                    admins: this.users.filter(u => u.role === 'admin').length,
                    pendingTeachers: this.users.filter(u => u.role === 'teacher' && !u.isApproved).length
                };
            case 'appointments':
                return {
                    totalAppointments: this.appointments.length,
                    pending: this.appointments.filter(a => a.status === 'pending').length,
                    confirmed: this.appointments.filter(a => a.status === 'confirmed').length,
                    completed: this.appointments.filter(a => a.status === 'completed').length,
                    rejected: this.appointments.filter(a => a.status === 'rejected').length
                };
            case 'system':
                return {
                    totalUsers: this.users.length,
                    totalAppointments: this.appointments.length,
                    totalMessages: this.messages.length,
                    systemLogs: this.systemLogs.length
                };
            default:
                return {};
        }
    }

    downloadReport(reportData) {
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportData.type}_report_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    handleQuickAction(action) {
        switch (action) {
            case 'systemBackup':
                this.performSystemBackup();
                break;
            case 'sendAnnouncement':
                this.showAnnouncementModal();
                break;
            case 'generateReport':
                this.showReportModal();
                break;
            case 'systemMaintenance':
                this.showMaintenanceModal();
                break;
            case 'managePermissions':
                this.showSection('permissions');
                break;
            default:
                console.log('Quick action:', action);
        }
    }

    async performSystemBackup() {
        try {
            this.showSuccess('System backup initiated... This may take a few minutes.');
            
            // In a real implementation, this would trigger a cloud function
            // that creates a backup of all Firestore data
            
            const backupData = {
                users: this.users,
                appointments: this.appointments,
                messages: this.messages,
                timestamp: new Date()
            };

            this.downloadReport({ 
                type: 'system_backup', 
                generatedAt: new Date(),
                data: backupData 
            });

            this.logSystemAction('system_backup_created');
            
        } catch (error) {
            console.error('Error performing backup:', error);
            this.showError('Backup failed');
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
        this.renderUsers();
        this.renderAppointments();
        this.renderMessages();
        this.renderSystemLogs();
    }

    updateUserInfo() {
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = 'Administrator';
        }
    }

    renderStats() {
        const totalUsers = this.users.length;
        const totalStudents = this.users.filter(u => u.role === 'student').length;
        const totalTeachers = this.users.filter(u => u.role === 'teacher').length;
        const pendingTeachers = this.users.filter(u => u.role === 'teacher' && !u.isApproved).length;
        const totalAppointments = this.appointments.length;
        const pendingAppointments = this.appointments.filter(a => a.status === 'pending').length;

        this.updateStatCard('totalUsers', totalUsers);
        this.updateStatCard('totalStudents', totalStudents);
        this.updateStatCard('totalTeachers', totalTeachers);
        this.updateStatCard('pendingTeachers', pendingTeachers);
        this.updateStatCard('totalAppointments', totalAppointments);
        this.updateStatCard('pendingAppointments', pendingAppointments);
    }

    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    renderUsers() {
        const container = document.getElementById('usersContainer');
        if (!container) return;

        if (this.users.length === 0) {
            container.innerHTML = '<p class="no-data">No users found.</p>';
            return;
        }

        container.innerHTML = this.users.map(user => `
            <div class="user-card ${user.role}">
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <p class="email">${user.email}</p>
                    <span class="role-badge ${user.role}">${user.role.toUpperCase()}</span>
                    ${user.role === 'teacher' ? `
                        <span class="approval-status ${user.isApproved ? 'approved' : 'pending'}">
                            ${user.isApproved ? 'APPROVED' : 'PENDING APPROVAL'}
                        </span>
                    ` : ''}
                </div>
                <div class="user-actions">
                    ${user.role === 'teacher' && !user.isApproved ? `
                        <button class="btn btn-sm btn-success" onclick="adminDashboard.approveTeacher('${user.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="adminDashboard.rejectTeacher('${user.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderAppointments() {
        const container = document.getElementById('appointmentsContainer');
        if (!container) return;

        if (this.appointments.length === 0) {
            container.innerHTML = '<p class="no-data">No appointments found.</p>';
            return;
        }

        container.innerHTML = this.appointments.slice(0, 20).map(appointment => `
            <div class="appointment-card ${appointment.status}">
                <div class="appointment-header">
                    <h4>Appointment #${appointment.id.substring(0, 8)}</h4>
                    <span class="status-badge ${appointment.status}">${appointment.status.toUpperCase()}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-user-graduate"></i> Student: ${appointment.studentName || 'Unknown'}</p>
                    <p><i class="fas fa-chalkboard-teacher"></i> Teacher: ${appointment.teacherName || 'Unknown'}</p>
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(appointment.date)}</p>
                    <p><i class="fas fa-clock"></i> ${appointment.time}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteAppointment('${appointment.id}')">
                        <i class="fas fa-trash"></i> Delete
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

        container.innerHTML = this.messages.slice(0, 20).map(message => `
            <div class="message-card">
                <div class="message-header">
                    <h5>${message.subject}</h5>
                    <span class="timestamp">${this.formatDate(message.createdAt)}</span>
                </div>
                <p class="message-content">${message.message.substring(0, 100)}${message.message.length > 100 ? '...' : ''}</p>
                <div class="message-meta">
                    <span class="sender">From: ${message.senderEmail || 'Unknown'}</span>
                    <span class="recipient">To: ${message.recipientEmail || 'Unknown'}</span>
                </div>
            </div>
        `).join('');
    }

    renderSystemLogs() {
        const container = document.getElementById('systemLogsContainer');
        if (!container) return;

        if (this.systemLogs.length === 0) {
            container.innerHTML = '<p class="no-data">No system logs found.</p>';
            return;
        }

        container.innerHTML = this.systemLogs.slice(0, 50).map(log => `
            <div class="log-entry">
                <div class="log-header">
                    <span class="action">${log.action}</span>
                    <span class="timestamp">${this.formatDate(log.timestamp)}</span>
                </div>
                <div class="log-details">
                    <p>Admin: ${log.adminId}</p>
                    ${log.data ? `<p>Data: ${JSON.stringify(log.data)}</p>` : ''}
                </div>
            </div>
        `).join('');
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
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
    window.adminDashboard = adminDashboard;
});
