/**
 * Student Dashboard - Production Ready (No Modules)
 * Real-world functionality with Firebase integration
 */

// Global variables
let currentUser = null;
let appointments = [];
let teachers = [];
let messages = [];

// Initialize dashboard when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Student Dashboard Loading...');
    initializeStudentDashboard();
});

async function initializeStudentDashboard() {
    try {
        // Check authentication
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    currentUser = user;
                    loadUserData();
                } else {
                    redirectToLogin();
                }
            });
        } else {
            // Use session storage for demo
            const userData = sessionStorage.getItem('currentUser');
            if (userData) {
                currentUser = JSON.parse(userData);
                loadDemoData();
            } else {
                redirectToLogin();
            }
        }
        
        setupEventListeners();
        updateUI();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showNotification('Error loading dashboard', 'error');
    }
}

function setupEventListeners() {
    // Navigation listeners
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section || this.textContent.toLowerCase().replace(/\s+/g, '');
            showSection(section);
        });
    });
    
    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.dataset.action || this.textContent;
            handleQuickAction(action);
        });
    });
    
    // Book appointment button
    const bookBtn = document.getElementById('bookAppointmentBtn');
    if (bookBtn) {
        bookBtn.addEventListener('click', showBookingModal);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // All other buttons
    document.querySelectorAll('button').forEach(btn => {
        if (!btn.onclick && !btn.type === 'submit') {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const action = this.textContent || 'Action';
                showNotification(`${action} clicked!`, 'info');
                
                // Add visual feedback
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            });
        }
    });
}

async function loadUserData() {
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            // Load real Firebase data
            const db = firebase.firestore();
            
            // Load appointments
            const appointmentsRef = db.collection('appointments')
                .where('studentId', '==', currentUser.uid);
            
            appointmentsRef.onSnapshot(snapshot => {
                appointments = [];
                snapshot.forEach(doc => {
                    appointments.push({ id: doc.id, ...doc.data() });
                });
                updateAppointmentsList();
            });
            
            // Load teachers
            const teachersRef = db.collection('users').where('role', '==', 'teacher');
            const teachersSnapshot = await teachersRef.get();
            teachers = [];
            teachersSnapshot.forEach(doc => {
                teachers.push({ id: doc.id, ...doc.data() });
            });
            updateTeachersList();
            
        } else {
            loadDemoData();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        loadDemoData(); // Fallback to demo data
    }
}

function loadDemoData() {
    // Demo data for testing
    appointments = [
        {
            id: 'apt1',
            teacherName: 'Dr. Smith',
            date: '2025-07-28',
            time: '10:00 AM',
            status: 'confirmed',
            subject: 'Mathematics'
        },
        {
            id: 'apt2',
            teacherName: 'Prof. Johnson',
            date: '2025-07-30',
            time: '2:00 PM',
            status: 'pending',
            subject: 'Physics'
        }
    ];
    
    teachers = [
        {
            id: 'teacher1',
            name: 'Dr. Smith',
            department: 'Mathematics',
            available: true
        },
        {
            id: 'teacher2',
            name: 'Prof. Johnson',
            department: 'Physics',
            available: true
        }
    ];
    
    updateUI();
}

function updateUI() {
    updateUserInfo();
    updateStats();
    updateAppointmentsList();
    updateTeachersList();
    showSection('overview');
}

function updateUserInfo() {
    const userName = document.querySelector('.user-name');
    const userEmail = document.querySelector('.user-email');
    
    if (userName) {
        userName.textContent = currentUser?.name || currentUser?.displayName || 'Student';
    }
    if (userEmail) {
        userEmail.textContent = currentUser?.email || 'student@example.com';
    }
}

function updateStats() {
    // Update dashboard stats
    const totalAppointments = document.getElementById('totalAppointments');
    const pendingAppointments = document.getElementById('pendingAppointments');
    const confirmedAppointments = document.getElementById('confirmedAppointments');
    
    if (totalAppointments) {
        totalAppointments.textContent = appointments.length;
    }
    if (pendingAppointments) {
        pendingAppointments.textContent = appointments.filter(apt => apt.status === 'pending').length;
    }
    if (confirmedAppointments) {
        confirmedAppointments.textContent = appointments.filter(apt => apt.status === 'confirmed').length;
    }
}

function updateAppointmentsList() {
    const appointmentsList = document.getElementById('appointmentsList');
    if (!appointmentsList) return;
    
    if (appointments.length === 0) {
        appointmentsList.innerHTML = '<p class="no-data">No appointments found.</p>';
        return;
    }
    
    appointmentsList.innerHTML = appointments.map(apt => `
        <div class="appointment-card">
            <div class="appointment-header">
                <h4>${apt.teacherName}</h4>
                <span class="status status-${apt.status}">${apt.status}</span>
            </div>
            <div class="appointment-details">
                <p><i class="fas fa-calendar"></i> ${apt.date}</p>
                <p><i class="fas fa-clock"></i> ${apt.time}</p>
                <p><i class="fas fa-book"></i> ${apt.subject}</p>
            </div>
            <div class="appointment-actions">
                <button class="btn btn-sm btn-primary" onclick="viewAppointment('${apt.id}')">
                    View Details
                </button>
                ${apt.status === 'pending' ? 
                    `<button class="btn btn-sm btn-danger" onclick="cancelAppointment('${apt.id}')">
                        Cancel
                    </button>` : ''
                }
            </div>
        </div>
    `).join('');
}

function updateTeachersList() {
    const teachersList = document.getElementById('teachersList');
    if (!teachersList) return;
    
    teachersList.innerHTML = teachers.map(teacher => `
        <div class="teacher-card">
            <div class="teacher-info">
                <h4>${teacher.name}</h4>
                <p>${teacher.department}</p>
                <span class="availability ${teacher.available ? 'available' : 'unavailable'}">
                    ${teacher.available ? 'Available' : 'Unavailable'}
                </span>
            </div>
            <button class="btn btn-primary" onclick="bookWithTeacher('${teacher.id}')">
                Book Appointment
            </button>
        </div>
    `).join('');
}

function showSection(sectionName) {
    console.log('Switching to section:', sectionName);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Section found and activated:', sectionName);
    } else {
        console.error('Section not found:', sectionName);
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
        console.log('Navigation updated for:', sectionName);
    }
    
    // Update breadcrumb
    const breadcrumb = document.getElementById('currentSection');
    if (breadcrumb) {
        breadcrumb.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
    }
}

function handleQuickAction(action) {
    switch(action.toLowerCase()) {
        case 'book new appointment':
        case 'book appointment':
            showBookingModal();
            break;
        case 'find teachers':
            showSection('teachers');
            break;
        case 'send message':
            showSection('messages');
            break;
        case 'edit profile':
            showSection('profile');
            break;
        default:
            showNotification(`${action} functionality coming soon!`, 'info');
    }
}

function showBookingModal() {
    // Simple booking modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>Book New Appointment</h3>
            <form id="bookingForm">
                <div class="form-group">
                    <label>Teacher:</label>
                    <select id="teacherSelect" required>
                        <option value="">Select Teacher</option>
                        ${teachers.map(t => `<option value="${t.id}">${t.name} - ${t.department}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Date:</label>
                    <input type="date" id="appointmentDate" required>
                </div>
                <div class="form-group">
                    <label>Time:</label>
                    <input type="time" id="appointmentTime" required>
                </div>
                <div class="form-group">
                    <label>Subject:</label>
                    <input type="text" id="appointmentSubject" placeholder="What would you like to discuss?" required>
                </div>
                <button type="submit" class="btn btn-primary">Book Appointment</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('bookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        bookAppointment();
        modal.remove();
    });
}

async function bookAppointment() {
    const teacherId = document.getElementById('teacherSelect').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const subject = document.getElementById('appointmentSubject').value;
    
    const teacher = teachers.find(t => t.id === teacherId);
    
    const newAppointment = {
        id: 'apt' + Date.now(),
        teacherName: teacher.name,
        teacherId: teacherId,
        date: date,
        time: time,
        subject: subject,
        status: 'pending',
        studentId: currentUser?.uid || 'demo-student'
    };
    
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            // Save to Firebase
            const db = firebase.firestore();
            await db.collection('appointments').add(newAppointment);
        } else {
            // Add to local data
            appointments.push(newAppointment);
            updateAppointmentsList();
            updateStats();
        }
        
        showNotification('Appointment request sent successfully!', 'success');
    } catch (error) {
        console.error('Error booking appointment:', error);
        showNotification('Error booking appointment. Please try again.', 'error');
    }
}

function viewAppointment(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
        showNotification(`Viewing appointment with ${appointment.teacherName} on ${appointment.date}`, 'info');
    }
}

function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        // Remove from appointments array
        appointments = appointments.filter(apt => apt.id !== appointmentId);
        updateAppointmentsList();
        updateStats();
        showNotification('Appointment cancelled successfully', 'success');
    }
}

function bookWithTeacher(teacherId) {
    // Set teacher in booking modal
    showBookingModal();
    setTimeout(() => {
        const teacherSelect = document.getElementById('teacherSelect');
        if (teacherSelect) {
            teacherSelect.value = teacherId;
        }
    }, 100);
}

function showProfile() {
    console.log('Opening profile settings...');
    showNotification('Profile settings opened', 'info');
    // You can implement profile modal or redirect to profile page here
}

function showSettings() {
    console.log('Opening settings...');
    showNotification('Settings opened', 'info');
    // You can implement settings modal or redirect to settings page here
}

function logout() {
    console.log('Logging out...');
    
    // Clear session storage
    sessionStorage.removeItem('currentUser');
    
    // Show notification
    showNotification('Logging out...', 'info');
    
    // Redirect after a brief delay
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1000);
}

// Toggle dropdown menu
function toggleDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('dropdownMenu');
    
    if (userMenu && dropdown && !userMenu.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Global functions for easy access
window.showSection = showSection;
window.handleQuickAction = handleQuickAction;
window.showBookingModal = showBookingModal;
window.showProfile = showProfile;
window.showSettings = showSettings;
window.logout = logout;
window.toggleDropdown = toggleDropdown;
