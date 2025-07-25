// Import Firebase modules and utilities
import { 
    db, 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs,
    updateDoc,
    deleteDoc,
    doc 
} from '../js/firebase-config.js';

import { getCurrentUserProfile, hasRole } from '../js/auth-firebase.js';
import { appointmentManager } from '../js/appointments-firebase.js';
import { logUserAction } from '../js/logger-firebase.js';

console.log('Admin dashboard JS loaded');

// Helper: Show loading
function showLoading(id) {
    document.getElementById(id).innerHTML = '<div class="loading"><span class="loader"></span> Loading...</div>';
}

// Helper: Show no data
function showNoData(id, message) {
    document.getElementById(id).innerHTML = `<div class="no-data">${message}</div>`;
}

// Helper: Show feedback
function showFeedback(message, type = 'success') {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
}

// Fetch and render admin stats
async function renderAdminStats() {
    try {
        showLoading('adminTeachersTable');
        showLoading('adminStudentsTable');
        showLoading('adminAllAppointmentsTable');
        showLoading('adminLogsTable');

        const userProfile = await getCurrentUserProfile();
        if (!hasRole(userProfile, 'admin')) {
            throw new Error('Unauthorized access');
        }

        // Fetch all data in parallel
        const [teachers, students, appointments, logs] = await Promise.all([
            fetchUsersByRole('teacher'),
            fetchUsersByRole('student'),
            appointmentManager.getAllAppointments(),
            fetchLogs()
        ]);

        // Update stats
        document.getElementById('adminTotalTeachers').textContent = teachers.length;
        document.getElementById('adminTotalStudents').textContent = students.length;
        document.getElementById('adminTotalAppointments').textContent = appointments.length;

        // Render tables
        renderTeachersTable(teachers);
        renderStudentsTable(students);
        renderAppointmentsTable(appointments);
        renderLogsTable(logs);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showFeedback('Error loading dashboard data', 'error');
    }
}

// Fetch users by role
async function fetchUsersByRole(role) {
    const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', role)
    );
    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Fetch logs
async function fetchLogs() {
    const logsQuery = query(
        collection(db, 'logs'),
        orderBy('timestamp', 'desc'),
        limit(50)
    );
    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map(doc => doc.data());
}

// Approve user
async function approveUser(userId) {
    try {
        await updateDoc(doc(db, 'users', userId), {
            approved: true,
            approvedAt: new Date().toISOString()
        });
        await logUserAction('USER_APPROVED', { userId });
        showFeedback('User approved successfully');
        renderAdminStats();
    } catch (error) {
        console.error('Error approving user:', error);
        showFeedback('Error approving user', 'error');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        await deleteDoc(doc(db, 'users', userId));
        await logUserAction('USER_DELETED', { userId });
        showFeedback('User deleted successfully');
        renderAdminStats();
    } catch (error) {
        console.error('Error deleting user:', error);
        showFeedback('Error deleting user', 'error');
    }
}

// Make functions available globally for event handlers
window.approveUser = approveUser;
window.deleteUser = deleteUser;

// Render tables
function renderTeachersTable(teachers) {
    const table = document.getElementById('adminTeachersTable');
    if (!teachers?.length) {
        showNoData('adminTeachersTable', 'No teachers found');
        return;
    }
    
    table.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${teachers.map(t => `
                    <tr>
                        <td>${t.name || 'N/A'}</td>
                        <td>${t.email || 'N/A'}</td>
                        <td>${t.department || 'N/A'}</td>
                        <td>${t.approved ? '<span class="status approved">Approved</span>' : '<span class="status pending">Pending</span>'}</td>
                        <td>
                            ${!t.approved ? `<button onclick="approveUser('${t.id}')">Approve</button>` : ''}
                            <button onclick="deleteUser('${t.id}')" class="delete">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

function renderStudentsTable(students) {
    const table = document.getElementById('adminStudentsTable');
    if (!students?.length) {
        showNoData('adminStudentsTable', 'No students found');
        return;
    }

    table.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Year</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(s => `
                    <tr>
                        <td>${s.name || 'N/A'}</td>
                        <td>${s.email || 'N/A'}</td>
                        <td>${s.year || 'N/A'}</td>
                        <td>
                            <button onclick="deleteUser('${s.id}')" class="delete">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

function renderAppointmentsTable(appointments) {
    const table = document.getElementById('adminAllAppointmentsTable');
    if (!appointments?.length) {
        showNoData('adminAllAppointmentsTable', 'No appointments found');
        return;
    }

    table.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Teacher</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${appointments.map(a => `
                    <tr>
                        <td>${a.studentName || 'N/A'}</td>
                        <td>${a.teacherName || 'N/A'}</td>
                        <td>${new Date(a.date).toLocaleDateString()}</td>
                        <td>${a.time || 'N/A'}</td>
                        <td><span class="status ${a.status.toLowerCase()}">${a.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

function renderLogsTable(logs) {
    const table = document.getElementById('adminLogsTable');
    if (!logs?.length) {
        showNoData('adminLogsTable', 'No logs found');
        return;
    }

    table.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                ${logs.map(l => `
                    <tr>
                        <td>${new Date(l.timestamp).toLocaleString()}</td>
                        <td>${l.action}</td>
                        <td>${l.userEmail || 'N/A'}</td>
                        <td>${JSON.stringify(l.details || {})}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

// Add CSS for status indicators and loading
const style = document.createElement('style');
style.textContent = `
    .loading { display: flex; align-items: center; justify-content: center; padding: 2rem; color: #666; }
    .loader { display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .no-data { text-align: center; padding: 2rem; color: #666; font-style: italic; }
    .feedback { position: fixed; top: 20px; right: 20px; padding: 1rem 2rem; border-radius: 4px; color: white; z-index: 1000; animation: slideIn 0.3s ease; }
    .feedback.success { background: #2ecc71; }
    .feedback.error { background: #e74c3c; }
    @keyframes slideIn { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .status { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.9em; }
    .status.approved { background: #e8f5e9; color: #2e7d32; }
    .status.pending { background: #fff3e0; color: #ef6c00; }
    .status.completed { background: #e8f5e9; color: #2e7d32; }
    .status.cancelled { background: #ffebee; color: #c62828; }
    button { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem; }
    button.delete { background: #ff5252; color: white; }
    button:hover { opacity: 0.9; }
`;
document.head.appendChild(style);

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin dashboard initializing...');
    renderAdminStats();
    // Setup real-time listeners
    appointmentManager.onAppointmentChange(() => {
        console.log('Appointments updated, refreshing stats...');
        renderAdminStats();
    });
});
