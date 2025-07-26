/**
 * Student Dashboard JavaScript
 * Modern, functional implementation with proper error handling
 */

import { getCurrentUserProfile, hasRole, authManager } from '../js/auth-firebase.js';
import { appointmentManager } from '../js/appointments-firebase.js';
import { messagingManager } from '../js/messaging-firebase.js';

class StudentDashboard {
    constructor() {
        this.currentUser = null;
        this.appointments = [];
        this.messages = [];
        this.teachers = [];
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
        if (!hasRole('student')) {
            throw new Error('Access denied: Student role required');
        }
    }

    async loadData() {
        try {
            const [appointments, messages, teachers] = await Promise.all([
                this.loadAppointments(),
                this.loadMessages(),
                this.loadTeachers()
            ]);
            
            this.appointments = appointments;
            this.messages = messages;
            this.teachers = teachers;
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    async loadAppointments() {
        try {
            return await appointmentManager.getMyAppointments();
        } catch (error) {
            console.error('Error loading appointments:', error);
            return [];
        }
    }

    async loadMessages() {
        try {
            return await messagingManager.getMyMessages();
        } catch (error) {
            console.error('Error loading messages:', error);
            return [];
        }
    }

    async loadTeachers() {
        try {
            // This would typically come from a user management service
            return await fetch('/api/teachers').then(res => res.json()).catch(() => []);
        } catch (error) {
            console.error('Error loading teachers:', error);
            return [];
        }
    }

    setupEventListeners() {
        // Quick actions
        document.getElementById('bookAppointmentBtn')?.addEventListener('click', () => {
            this.showBookingModal();
        });

        document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
            this.showMessageModal();
        });

        document.getElementById('viewScheduleBtn')?.addEventListener('click', () => {
            this.showScheduleView();
        });

        // Calendar interactions
        this.setupCalendar();

        // Search functionality
        const searchInput = document.getElementById('teacherSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.filterTeachers(e.target.value);
            }, 300));
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterChange(e.target.dataset.filter);
            });
        });

        // Refresh button
        document.getElementById('refreshData')?.addEventListener('click', () => {
            this.refreshData();
        });

        // Profile edit
        document.getElementById('editProfileBtn')?.addEventListener('click', () => {
            this.showEditProfileModal();
        });
    }

    showBookingModal() {
        const modal = this.createBookingModal();
        document.body.appendChild(modal);
        window.dashboardUI.openModal(modal.id);
    }

    createBookingModal() {
        const modalId = 'bookingModal';
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3><i class="fas fa-calendar-plus"></i> Book New Appointment</h3>
                    <button class="modal-close" onclick="dashboardUI.closeModal('${modalId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <form id="bookingForm" class="booking-form">
                        <div class="form-group">
                            <label for="teacherSelect">Select Teacher</label>
                            <select id="teacherSelect" class="form-control" required>
                                <option value="">Choose a teacher...</option>
                                ${this.teachers.map(teacher => 
                                    `<option value="${teacher.id}">${teacher.name} - ${teacher.subject}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="appointmentDate">Preferred Date</label>
                            <input type="date" id="appointmentDate" class="form-control" required 
                                   min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div class="form-group">
                            <label for="appointmentTime">Preferred Time</label>
                            <select id="appointmentTime" class="form-control" required>
                                <option value="">Select time...</option>
                                ${this.generateTimeSlots().map(slot => 
                                    `<option value="${slot}">${slot}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="appointmentType">Appointment Type</label>
                            <select id="appointmentType" class="form-control" required>
                                <option value="">Select type...</option>
                                <option value="consultation">Consultation</option>
                                <option value="academic_support">Academic Support</option>
                                <option value="project_discussion">Project Discussion</option>
                                <option value="exam_preparation">Exam Preparation</option>
                                <option value="career_guidance">Career Guidance</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="appointmentNotes">Additional Notes</label>
                            <textarea id="appointmentNotes" class="form-control" rows="3" 
                                    placeholder="Describe what you'd like to discuss..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="urgency">Priority Level</label>
                            <select id="urgency" class="form-control">
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="dashboardUI.closeModal('${modalId}')">Cancel</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i> Send Request
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add form submission handler
        setTimeout(() => {
            const form = document.getElementById('bookingForm');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBookingSubmission(form);
            });
        }, 100);

        return modal;
    }

    generateTimeSlots() {
        const slots = [];
        for (let hour = 8; hour <= 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }
        return slots;
    }

    async handleBookingSubmission(form) {
        const formData = new FormData(form);
        const bookingData = {
            teacherId: formData.get('teacherSelect'),
            date: formData.get('appointmentDate'),
            time: formData.get('appointmentTime'),
            type: formData.get('appointmentType'),
            notes: formData.get('appointmentNotes'),
            urgency: formData.get('urgency') || 'normal',
            studentId: this.currentUser.id,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        try {
            window.dashboardUI.showLoading('bookingForm', 'Sending request...');
            
            // Validate form
            const validation = window.dashboardUI.validateForm(form);
            if (!validation.isValid) {
                validation.errors.forEach(error => {
                    window.dashboardUI.showToast(error, 'error');
                });
                return;
            }

            // Submit booking
            await appointmentManager.createAppointment(bookingData);
            
            window.dashboardUI.showToast('Appointment request sent successfully!', 'success');
            window.dashboardUI.closeModal('bookingModal');
            
            // Refresh appointments
            await this.loadAppointments();
            this.renderAppointments();
            
        } catch (error) {
            console.error('Booking submission error:', error);
            window.dashboardUI.showToast('Failed to send appointment request', 'error');
        } finally {
            window.dashboardUI.hideLoading('bookingForm');
        }
    }

    showMessageModal() {
        const modal = this.createMessageModal();
        document.body.appendChild(modal);
        window.dashboardUI.openModal(modal.id);
    }

    createMessageModal() {
        const modalId = 'messageModal';
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3><i class="fas fa-envelope"></i> Send Message</h3>
                    <button class="modal-close" onclick="dashboardUI.closeModal('${modalId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <form id="messageForm" class="message-form">
                        <div class="form-group">
                            <label for="messageRecipient">To</label>
                            <select id="messageRecipient" class="form-control" required>
                                <option value="">Select recipient...</option>
                                ${this.teachers.map(teacher => 
                                    `<option value="${teacher.id}">${teacher.name} - ${teacher.subject}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="messageSubject">Subject</label>
                            <input type="text" id="messageSubject" class="form-control" required
                                   placeholder="Enter message subject...">
                        </div>
                        
                        <div class="form-group">
                            <label for="messageContent">Message</label>
                            <textarea id="messageContent" class="form-control" rows="6" required
                                    placeholder="Type your message here..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="requestResponse"> Request response
                            </label>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="dashboardUI.closeModal('${modalId}')">Cancel</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i> Send Message
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add form submission handler
        setTimeout(() => {
            const form = document.getElementById('messageForm');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMessageSubmission(form);
            });
        }, 100);

        return modal;
    }

    async handleMessageSubmission(form) {
        const formData = new FormData(form);
        const messageData = {
            recipientId: formData.get('messageRecipient'),
            subject: formData.get('messageSubject'),
            content: formData.get('messageContent'),
            requestResponse: document.getElementById('requestResponse').checked,
            senderId: this.currentUser.id,
            timestamp: new Date().toISOString(),
            read: false
        };

        try {
            window.dashboardUI.showLoading('messageForm', 'Sending message...');
            
            await messagingManager.sendMessage(messageData);
            
            window.dashboardUI.showToast('Message sent successfully!', 'success');
            window.dashboardUI.closeModal('messageModal');
            
            // Refresh messages
            await this.loadMessages();
            this.renderMessages();
            
        } catch (error) {
            console.error('Message submission error:', error);
            window.dashboardUI.showToast('Failed to send message', 'error');
        } finally {
            window.dashboardUI.hideLoading('messageForm');
        }
    }

    setupCalendar() {
        const calendarContainer = document.getElementById('calendar');
        if (!calendarContainer) return;

        this.renderCalendar();
    }

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        calendar.innerHTML = this.generateCalendarHTML(currentYear, currentMonth);
        this.attachCalendarEvents();
    }

    generateCalendarHTML(year, month) {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        
        let html = `
            <div class="calendar-header">
                <button class="calendar-nav" id="prevMonth">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3>${monthNames[month]} ${year}</h3>
                <button class="calendar-nav" id="nextMonth">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day-header">Sun</div>
                <div class="calendar-day-header">Mon</div>
                <div class="calendar-day-header">Tue</div>
                <div class="calendar-day-header">Wed</div>
                <div class="calendar-day-header">Thu</div>
                <div class="calendar-day-header">Fri</div>
                <div class="calendar-day-header">Sat</div>
        `;
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const hasAppointment = this.hasAppointmentOnDate(date);
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (hasAppointment) classes += ' has-appointment';
            
            html += `
                <div class="${classes}" data-date="${date.toISOString().split('T')[0]}">
                    <span class="day-number">${day}</span>
                    ${hasAppointment ? '<div class="appointment-indicator"></div>' : ''}
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    attachCalendarEvents() {
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            // Implementation for previous month navigation
        });
        
        document.getElementById('nextMonth')?.addEventListener('click', () => {
            // Implementation for next month navigation
        });
        
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', (e) => {
                const date = e.currentTarget.dataset.date;
                this.showDayDetails(date);
            });
        });
    }

    hasAppointmentOnDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.appointments.some(apt => apt.date === dateStr);
    }

    showDayDetails(date) {
        const appointments = this.appointments.filter(apt => apt.date === date);
        
        if (appointments.length === 0) {
            window.dashboardUI.showToast('No appointments on this day', 'info');
            return;
        }
        
        const modal = this.createDayDetailsModal(date, appointments);
        document.body.appendChild(modal);
        window.dashboardUI.openModal(modal.id);
    }

    createDayDetailsModal(date, appointments) {
        const modalId = 'dayDetailsModal';
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3><i class="fas fa-calendar-day"></i> ${formattedDate}</h3>
                    <button class="modal-close" onclick="dashboardUI.closeModal('${modalId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <div class="appointments-list">
                        ${appointments.map(apt => `
                            <div class="appointment-card">
                                <div class="appointment-time">
                                    <i class="fas fa-clock"></i>
                                    ${apt.time}
                                </div>
                                <div class="appointment-details">
                                    <h4>${apt.teacherName}</h4>
                                    <p>${apt.type}</p>
                                    <span class="status-badge status-${apt.status}">${apt.status}</span>
                                </div>
                                <div class="appointment-actions">
                                    <button class="btn btn-sm btn-outline" onclick="studentDashboard.viewAppointment('${apt.id}')">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async refreshData() {
        try {
            window.dashboardUI.showToast('Refreshing data...', 'info');
            await this.loadData();
            this.renderDashboard();
            window.dashboardUI.showToast('Data refreshed successfully!', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            window.dashboardUI.showToast('Failed to refresh data', 'error');
        }
    }

    // Utility methods
    formatDateTime(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
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
        // Implementation would show a loading overlay or notification
        console.log(message);
    }

    showSuccess(message) {
        // Implementation would show a success notification
        console.log('Success:', message);
    }

    showError(message) {
        // Implementation would show an error notification
        console.error('Error:', message);
    }

    // Public methods for button actions
    async joinAppointment(appointmentId) {
        // Implementation for joining video call
        console.log('Joining appointment:', appointmentId);
    }

    async rescheduleAppointment(appointmentId) {
        // Implementation for rescheduling
        console.log('Rescheduling appointment:', appointmentId);
    }

    async cancelAppointment(appointmentId) {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            try {
                await appointmentManager.cancelAppointment(appointmentId);
                this.showSuccess('Appointment cancelled successfully');
                await this.refreshData();
            } catch (error) {
                this.showError('Failed to cancel appointment');
            }
        }
    }

    viewMessage(messageId) {
        // Implementation for viewing message details
        console.log('Viewing message:', messageId);
    }

    viewFeedback(appointmentId) {
        // Implementation for viewing feedback
        console.log('Viewing feedback for:', appointmentId);
    }
}

// Initialize dashboard when DOM is loaded
let studentDashboard;
document.addEventListener('DOMContentLoaded', () => {
    studentDashboard = new StudentDashboard();
});

// Export for use in other files
window.studentDashboard = studentDashboard;
