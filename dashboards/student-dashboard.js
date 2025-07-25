import { getCurrentUserProfile, hasRole, authManager } from '../js/auth-firebase.js';
import { appointmentManager } from '../js/appointments-firebase.js';
import { messagingManager } from '../js/messaging-firebase.js';

function showLoading(id) {
    document.getElementById(id).innerHTML = '<div class="loading">Loading...</div>';
}
function showNoData(id, message) {
    document.getElementById(id).innerHTML = `<div class="no-data">${message}</div>`;
}

async function renderStudentStats() {
    showLoading('studentBookAppointmentForm');
    showLoading('studentAppointmentsTable');
    showLoading('studentMessagesTable');
    try {
        const userProfile = await getCurrentUserProfile();
        if (!hasRole('student')) return;
        const appointments = await appointmentManager.getMyAppointments();
        const upcoming = appointments.filter(a => a.status === 'approved' && new Date(a.date) >= new Date());
        const past = appointments.filter(a => a.status === 'approved' && new Date(a.date) < new Date());
        document.getElementById('studentUpcomingAppointments').textContent = upcoming.length;
        document.getElementById('studentPastAppointments').textContent = past.length;
        renderBookAppointmentForm();
        renderAppointmentsTable(appointments);
        renderMessagesTable(messagingManager.getMyMessages());
    } catch (error) {
        showNoData('studentBookAppointmentForm', 'Error loading form');
        showNoData('studentAppointmentsTable', 'Error loading appointments');
        showNoData('studentMessagesTable', 'Error loading messages');
    }
}

function renderBookAppointmentForm() {
    const form = document.getElementById('studentBookAppointmentForm');
    form.innerHTML = `<form id="bookAppointmentForm">
        <input type="text" name="teacher" placeholder="Teacher Name" required />
        <input type="date" name="date" required />
        <input type="time" name="time" required />
        <button type="submit">Book</button>
    </form>`;
    document.getElementById('bookAppointmentForm').onsubmit = async function(e) {
        e.preventDefault();
        // TODO: Implement booking logic
        alert('Appointment booking not implemented.');
    };
}

function renderAppointmentsTable(appointments) {
    const table = document.getElementById('studentAppointmentsTable');
    if (!appointments || appointments.length === 0) {
        showNoData('studentAppointmentsTable', 'No appointments found');
        return;
    }
    table.innerHTML = `<table><tr><th>Teacher</th><th>Date</th><th>Status</th></tr>` +
        appointments.map(a => `<tr><td>${a.teacherName}</td><td>${a.date}</td><td>${a.status}</td></tr>`).join('') + '</table>';
}

function renderMessagesTable(messages) {
    const table = document.getElementById('studentMessagesTable');
    if (!messages || messages.length === 0) {
        showNoData('studentMessagesTable', 'No messages found');
        return;
    }
    table.innerHTML = `<table><tr><th>From</th><th>Subject</th><th>Date</th></tr>` +
        messages.map(m => `<tr><td>${m.senderName}</td><td>${m.subject}</td><td>${m.timestamp}</td></tr>`).join('') + '</table>';
}

document.addEventListener('DOMContentLoaded', renderStudentStats);
