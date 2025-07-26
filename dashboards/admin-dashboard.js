/**
 * Admin Dashboard JavaScript
 * Modern, functional implementation with comprehensive admin features
 */

import { getCurrentUserProfile, hasRole, authManager } from '../js/auth-firebase.js';
import { appointmentManager } from '../js/appointments-firebase.js';
import { messagingManager } from '../js/messaging-firebase.js';
import { logUserAction } from '../js/logger-firebase.js';

class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.appointments = [];
        this.teachers = [];
        this.students = [];
        this.systemLogs = [];
        this.analytics = {};
        this.init();
    }

    async init() {
        try {
            await this.loadUserProfile();
            await this.loadData();
            this.setupEventListeners();
            this.renderDashboard();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    async loadUserProfile() {
        this.currentUser = await getCurrentUserProfile();
        if (!hasRole('admin')) {
            throw new Error('Access denied: Admin role required');
        }
    }

    async loadData() {
        try {
            const [appointments, teachers, students, logs] = await Promise.all([
                this.loadAppointments(),
                this.loadTeachers(),
                this.loadStudents(),
                this.loadSystemLogs()
            ]);
            
            this.appointments = appointments;
            this.teachers = teachers;
            this.students = students;
            this.systemLogs = logs;
            this.analytics = this.calculateAnalytics();
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    async loadAppointments() {
        try {
            return await appointmentManager.getAllAppointments();
        } catch (error) {
            console.error('Error loading appointments:', error);
            return [];
        }
    }

    async loadTeachers() {
        try {
            return await this.fetchUsersByRole('teacher');
        } catch (error) {
            console.error('Error loading teachers:', error);
            return [];
        }
    }

    async loadStudents() {
        try {
            return await this.fetchUsersByRole('student');
        } catch (error) {
            console.error('Error loading students:', error);
            return [];
        }
    }

    async loadSystemLogs() {
        try {
            return await fetch('/api/admin/logs').then(res => res.json()).catch(() => []);
        } catch (error) {
            console.error('Error loading system logs:', error);
            return [];
        }
    }

    async fetchUsersByRole(role) {
        try {
            return await fetch(`/api/admin/users?role=${role}`).then(res => res.json()).catch(() => []);
        } catch (error) {
            console.error(`Error loading ${role}s:`, error);
            return [];
        }
    }

    calculateAnalytics() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Appointment analytics
        const totalAppointments = this.appointments.length;
        const todayAppointments = this.appointments.filter(apt => {
            const aptDate = new Date(apt.dateTime);
            return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        });
        
        const monthlyAppointments = this.appointments.filter(apt => {
            const aptDate = new Date(apt.dateTime);
            return aptDate >= thisMonth;
        });
        
        const pendingAppointments = this.appointments.filter(apt => apt.status === 'pending');
        const approvedAppointments = this.appointments.filter(apt => apt.status === 'approved');
        const completedAppointments = this.appointments.filter(apt => apt.status === 'completed');
        
        // User analytics
        const activeTeachers = this.teachers.filter(t => t.status === 'active');
        const activeStudents = this.students.filter(s => s.status === 'active');
        
        return {
            totalUsers: this.teachers.length + this.students.length,
            activeTeachers: activeTeachers.length,
            activeStudents: activeStudents.length,
            totalAppointments,
            todayAppointments: todayAppointments.length,
            monthlyAppointments: monthlyAppointments.length,
            pendingAppointments: pendingAppointments.length,
            approvedAppointments: approvedAppointments.length,
            completedAppointments: completedAppointments.length,
            appointmentApprovalRate: totalAppointments > 0 ? (approvedAppointments.length / totalAppointments * 100).toFixed(1) : 0,
            appointmentCompletionRate: totalAppointments > 0 ? (completedAppointments.length / totalAppointments * 100).toFixed(1) : 0
        };
    }

    setupEventListeners() {
        // User management actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('activate-user-btn')) {
                this.handleUserStatusChange(e.target.dataset.userId, 'active');
            }
            if (e.target.classList.contains('deactivate-user-btn')) {
                this.handleUserStatusChange(e.target.dataset.userId, 'inactive');
            }
            if (e.target.classList.contains('delete-user-btn')) {
                this.handleUserDeletion(e.target.dataset.userId);
            }
        });

        // Appointment management
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('force-approve-btn')) {
                this.handleAppointmentStatusChange(e.target.dataset.appointmentId, 'approved');
            }
            if (e.target.classList.contains('force-reject-btn')) {
                this.handleAppointmentStatusChange(e.target.dataset.appointmentId, 'rejected');
            }
        });

        // Refresh buttons
        document.querySelectorAll('.refresh-btn').forEach(btn => {
            btn.addEventListener('click', this.refreshData.bind(this));
        });
    }

    renderDashboard() {
        this.renderAnalytics();
        this.renderUserManagement();
        this.renderAppointmentManagement();
        this.renderSystemLogs();
    }

    renderAnalytics() {
        // Update overview cards
        this.updateStatCard('totalUsers', this.analytics.totalUsers, 'Total Users');
        this.updateStatCard('activeTeachers', this.analytics.activeTeachers, 'Active Teachers');
        this.updateStatCard('activeStudents', this.analytics.activeStudents, 'Active Students');
        this.updateStatCard('monthlyAppointments', this.analytics.monthlyAppointments, 'This Month');
        this.updateStatCard('pendingAppointments', this.analytics.pendingAppointments, 'Pending');
        this.updateStatCard('todayAppointments', this.analytics.todayAppointments, 'Today');
        
        // Render charts
        this.renderAnalyticsCharts();
    }

    renderAnalyticsCharts() {
        // Appointment status distribution
        const statusData = {
            pending: this.analytics.pendingAppointments,
            approved: this.analytics.approvedAppointments,
            completed: this.analytics.completedAppointments
        };
        
        this.renderPieChart('appointmentStatusChart', statusData);
        
        // Monthly trends (placeholder for now)
        this.renderTrendChart('appointmentTrendChart');
    }

    renderPieChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Simple chart placeholder - in production, use Chart.js or similar
        container.innerHTML = `
            <div class="chart-placeholder">
                <h4>Appointment Status Distribution</h4>
                <div class="chart-data">
                    <div class="chart-item">
                        <span class="chart-color pending"></span>
                        Pending: ${data.pending}
                    </div>
                    <div class="chart-item">
                        <span class="chart-color approved"></span>
                        Approved: ${data.approved}
                    </div>
                    <div class="chart-item">
                        <span class="chart-color completed"></span>
                        Completed: ${data.completed}
                    </div>
                </div>
            </div>
        `;
    }

    renderTrendChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="chart-placeholder">
                <h4>Monthly Appointment Trends</h4>
                <p>Chart visualization would go here</p>
                <div class="trend-stats">
                    <div>Approval Rate: ${this.analytics.appointmentApprovalRate}%</div>
                    <div>Completion Rate: ${this.analytics.appointmentCompletionRate}%</div>
                </div>
            </div>
        `;
    }

    renderUserManagement() {
        this.renderTeachersTable();
        this.renderStudentsTable();
    }

    renderTeachersTable() {
        const container = document.getElementById('teachersTableContainer');
        if (!container) return;

        if (this.teachers.length === 0) {
            container.innerHTML = this.getEmptyState('No teachers found');
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Join Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.teachers.map(teacher => `
                            <tr>
                                <td>${teacher.name}</td>
                                <td>${teacher.email}</td>
                                <td>${teacher.subject || 'General'}</td>
                                <td>
                                    <span class="status-badge status-${teacher.status || 'active'}">${teacher.status || 'active'}</span>
                                </td>
                                <td>${this.formatDate(teacher.joinDate)}</td>
                                <td>
                                    <div class="table-actions">
                                        ${this.getUserActions(teacher)}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderStudentsTable() {
        const container = document.getElementById('studentsTableContainer');
        if (!container) return;

        if (this.students.length === 0) {
            container.innerHTML = this.getEmptyState('No students found');
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Grade/Class</th>
                            <th>Status</th>
                            <th>Join Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.students.map(student => `
                            <tr>
                                <td>${student.name}</td>
                                <td>${student.email}</td>
                                <td>${student.grade || 'Not specified'}</td>
                                <td>
                                    <span class="status-badge status-${student.status || 'active'}">${student.status || 'active'}</span>
                                </td>
                                <td>${this.formatDate(student.joinDate)}</td>
                                <td>
                                    <div class="table-actions">
                                        ${this.getUserActions(student)}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getUserActions(user) {
        const actions = [];
        
        if (user.status !== 'active') {
            actions.push(`<button class="btn btn-sm btn-success activate-user-btn" data-user-id="${user.id}">Activate</button>`);
        } else {
            actions.push(`<button class="btn btn-sm btn-warning deactivate-user-btn" data-user-id="${user.id}">Deactivate</button>`);
        }
        
        actions.push(`<button class="btn btn-sm btn-secondary" onclick="adminDashboard.viewUserProfile('${user.id}')">View</button>`);
        actions.push(`<button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}">Delete</button>`);
        
        return actions.join('');
    }

    // Utility methods
    updateStatCard(elementId, value, label) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getEmptyState(message) {
        return `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>${message}</p>
            </div>
        `;
    }

    showLoading(message = 'Loading...') {
        console.log(message);
    }

    showSuccess(message) {
        console.log('Success:', message);
    }

    showError(message) {
        console.error('Error:', message);
    }

    async refreshData() {
        try {
            await this.loadData();
            this.renderDashboard();
            this.showSuccess('Data refreshed successfully!');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showError('Failed to refresh data');
        }
    }

    // Placeholder methods for unimplemented features
    renderAppointmentManagement() {
        console.log('Rendering appointment management...');
    }

    renderSystemLogs() {
        console.log('Rendering system logs...');
    }

    async handleUserStatusChange(userId, status) {
        console.log(`Changing user ${userId} status to ${status}`);
    }

    async handleUserDeletion(userId) {
        console.log(`Deleting user ${userId}`);
    }

    async handleAppointmentStatusChange(appointmentId, status) {
        console.log(`Changing appointment ${appointmentId} status to ${status}`);
    }

    viewUserProfile(userId) {
        console.log(`Viewing user profile: ${userId}`);
    }
}

// Initialize dashboard when DOM is loaded
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});

// Export for use in other files
window.adminDashboard = adminDashboard;
