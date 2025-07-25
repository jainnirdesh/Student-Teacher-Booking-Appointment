import { getCurrentUserProfile, hasRole, authManager } from '../js/auth-firebase.js';
import { appointmentManager } from '../js/appointments-firebase.js';
import { messagingManager } from '../js/messaging-firebase.js';

function showLoading(id) {
    document.getElementById(id).innerHTML = '<div class="loading">Loading...</div>';
}
function showNoData(id, message) {
    document.getElementById(id).innerHTML = `<div class="no-data">${message}</div>`;
}

async function renderTeacherStats() {
    showLoading('teacherScheduleTable');
    showLoading('teacherAppointmentsTable');
    showLoading('teacherMessagesTable');
    try {
        const userProfile = await getCurrentUserProfile();
        if (!hasRole('teacher')) return;
        const schedule = await appointmentManager.getTeacherSchedule(userProfile.uid);
        const appointments = await appointmentManager.getMyAppointments();
        const pending = appointments.filter(a => a.status === 'pending');
        const approved = appointments.filter(a => a.status === 'approved');
        document.getElementById('teacherPendingRequests').textContent = pending.length;
        document.getElementById('teacherApprovedAppointments').textContent = approved.length;
        renderScheduleTable(schedule);
        renderAppointmentsTable(appointments);
        renderMessagesTable(messagingManager.getMyMessages());
    } catch (error) {
        showNoData('teacherScheduleTable', 'Error loading schedule');
        showNoData('teacherAppointmentsTable', 'Error loading appointments');
        showNoData('teacherMessagesTable', 'Error loading messages');
    }
}

function renderScheduleTable(schedule) {
    const table = document.getElementById('teacherScheduleTable');
    if (!schedule || schedule.length === 0) {
        showNoData('teacherScheduleTable', 'No schedule found');
        return;
    }
    table.innerHTML = `<table><tr><th>Date</th><th>Time</th><th>Subject</th></tr>` +
        schedule.map(s => `<tr><td>${s.date}</td><td>${s.time}</td><td>${s.subject}</td></tr>`).join('') + '</table>';
}

function renderAppointmentsTable(appointments) {
    const table = document.getElementById('teacherAppointmentsTable');
    if (!appointments || appointments.length === 0) {
        showNoData('teacherAppointmentsTable', 'No appointments found');
        return;
    }
    table.innerHTML = `<table><tr><th>Student</th><th>Date</th><th>Status</th></tr>` +
        appointments.map(a => `<tr><td>${a.studentName}</td><td>${a.date}</td><td>${a.status}</td></tr>`).join('') + '</table>';
}

function renderMessagesTable(messages) {
    const table = document.getElementById('teacherMessagesTable');
    if (!messages || messages.length === 0) {
        showNoData('teacherMessagesTable', 'No messages found');
        return;
    }
    table.innerHTML = `<table><tr><th>From</th><th>Subject</th><th>Date</th></tr>` +
        messages.map(m => `<tr><td>${m.senderName}</td><td>${m.subject}</td><td>${m.timestamp}</td></tr>`).join('') + '</table>';
}

document.addEventListener('DOMContentLoaded', renderTeacherStats);
