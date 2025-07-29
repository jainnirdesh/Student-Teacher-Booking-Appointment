/**
 * Comprehensive Fix Script for EduBook System
 * Addresses login modal, authentication, and dashboard issues
 */

// Fix 1: Ensure modal functionality works
function fixModalFunctionality() {
    console.log('Fixing modal functionality...');
    
    // Ensure modal elements exist
    const loginModal = document.getElementById('loginModal');
    if (!loginModal) {
        console.error('Login modal not found in DOM');
        return false;
    }
    
    // Fix modal display function
    window.showModal = function(modalId) {
        console.log('Showing modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        } else {
            console.error('Modal not found:', modalId);
        }
    };
    
    // Fix modal close function
    window.closeModal = function() {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        
        if (loginModal) {
            loginModal.style.display = 'none';
        }
        if (registerModal) {
            registerModal.style.display = 'none';
        }
        
        document.body.style.overflow = 'auto'; // Restore scrolling
    };
    
    // Close modal on background click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    return true;
}

// Fix 2: Authentication functionality
function fixAuthentication() {
    console.log('Fixing authentication...');
    
    // Demo credentials
    const demoCredentials = {
        'student@edubook.com': { password: 'student123', type: 'student' },
        'teacher@edubook.com': { password: 'teacher123', type: 'teacher' },
        'admin@edubook.com': { password: 'admin123', type: 'admin' }
    };
    
    // Update authentication status display
    function updateAuthStatus(isAuthenticated, userType = null) {
        const statusDisplay = document.getElementById('authStatusDisplay');
        if (statusDisplay) {
            if (isAuthenticated) {
                statusDisplay.innerHTML = '<i class="fas fa-check-circle"></i> Authenticated as ' + userType;
                statusDisplay.className = 'status-display authenticated';
            } else {
                statusDisplay.innerHTML = '<i class="fas fa-times-circle"></i> Not Authenticated';
                statusDisplay.className = 'status-display';
            }
        }
    }
    
    // Handle login form submission
    window.handleLogin = function(email, password) {
        console.log('Handling login for:', email);
        
        const cred = demoCredentials[email];
        if (cred && cred.password === password) {
            console.log('Login successful for:', cred.type);
            updateAuthStatus(true, cred.type);
            
            // Store session
            sessionStorage.setItem('currentUser', JSON.stringify({
                email: email,
                type: cred.type,
                authenticated: true
            }));
            
            // Redirect to dashboard
            setTimeout(() => {
                closeModal();
                window.location.href = `dashboards/${cred.type}-dashboard.html`;
            }, 500);
            
            return true;
        } else {
            console.error('Invalid credentials');
            alert('Invalid email or password');
            return false;
        }
    };
    
    // Test login function
    window.testLogin = function(userType) {
        console.log('Test login for:', userType);
        
        const credentials = {
            student: { email: 'student@edubook.com', password: 'student123' },
            teacher: { email: 'teacher@edubook.com', password: 'teacher123' },
            admin: { email: 'admin@edubook.com', password: 'admin123' }
        };
        
        const cred = credentials[userType];
        if (cred) {
            return handleLogin(cred.email, cred.password);
        }
        return false;
    };
    
    // Check existing session
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (currentUser.authenticated) {
        updateAuthStatus(true, currentUser.type);
    }
}

// Fix 3: Dashboard button interactions
function fixDashboardButtons() {
    console.log('Fixing dashboard buttons...');
    
    // Setup login buttons on main page
    const studentBtn = document.getElementById('studentLoginBtn');
    const teacherBtn = document.getElementById('teacherLoginBtn');
    const adminBtn = document.getElementById('adminLoginBtn');
    
    if (studentBtn) {
        studentBtn.onclick = function() {
            console.log('Student button clicked');
            showModal('loginModal');
            document.getElementById('modalTitle').textContent = 'Student Login';
            window.currentUserType = 'student';
        };
    }
    
    if (teacherBtn) {
        teacherBtn.onclick = function() {
            console.log('Teacher button clicked');
            showModal('loginModal');
            document.getElementById('modalTitle').textContent = 'Teacher Login';
            window.currentUserType = 'teacher';
        };
    }
    
    if (adminBtn) {
        adminBtn.onclick = function() {
            console.log('Admin button clicked');
            showModal('loginModal');
            document.getElementById('modalTitle').textContent = 'Admin Login';
            window.currentUserType = 'admin';
        };
    }
    
    // Setup login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (email && password) {
                handleLogin(email, password);
            }
        };
    }
    
    // Fix dashboard navigation buttons (for dashboard pages)
    document.querySelectorAll('.nav-link, .quick-action-btn, .action-btn').forEach(btn => {
        if (!btn.onclick) {
            btn.onclick = function(e) {
                e.preventDefault();
                console.log('Button clicked:', btn.textContent);
                
                // Add visual feedback
                btn.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                }, 150);
                
                // Show notification for demo
                if (window.showNotification) {
                    showNotification(`${btn.textContent} clicked! (Demo mode)`, 'info');
                } else {
                    alert(`${btn.textContent} clicked! (Demo mode)`);
                }
            };
        }
    });
}

// Fix 4: CSS issues
function fixCSSIssues() {
    console.log('Fixing CSS issues...');
    
    // Ensure modal CSS is properly applied
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            display: none !important;
            position: fixed !important;
            z-index: 2000 !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background-color: rgba(0, 0, 0, 0.6) !important;
            backdrop-filter: blur(8px) !important;
        }
        
        .modal.show {
            display: block !important;
        }
        
        .modal-content {
            background: white !important;
            margin: 5% auto !important;
            padding: 2rem !important;
            border-radius: 8px !important;
            width: 90% !important;
            max-width: 500px !important;
            position: relative !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
        }
        
        .btn {
            cursor: pointer !important;
            transition: all 0.3s ease !important;
        }
        
        .btn:hover {
            transform: translateY(-2px) !important;
        }
        
        .status-display {
            text-align: center !important;
            padding: 1rem !important;
            margin: 1rem 0 !important;
            border-radius: 4px !important;
            font-weight: 600 !important;
        }
        
        .status-display.authenticated {
            background: #d4edda !important;
            color: #155724 !important;
            border: 2px solid #28a745 !important;
        }
        
        .login-cards {
            display: flex !important;
            gap: 1rem !important;
            margin-top: 1rem !important;
            flex-wrap: wrap !important;
        }
        
        .login-card {
            flex: 1 !important;
            min-width: 250px !important;
            background: white !important;
            border: 1px solid #ddd !important;
            border-radius: 8px !important;
            padding: 1rem !important;
            text-align: center !important;
        }
    `;
    document.head.appendChild(style);
}

// Fix 5: Notification system
function fixNotifications() {
    console.log('Setting up notification system...');
    
    window.showNotification = function(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 3000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    };
}

// Initialize all fixes
function initializeAllFixes() {
    console.log('Initializing comprehensive fixes...');
    
    try {
        fixCSSIssues();
        fixNotifications();
        fixModalFunctionality();
        fixAuthentication();
        fixDashboardButtons();
        
        console.log('All fixes applied successfully!');
        
        if (window.showNotification) {
            setTimeout(() => {
                showNotification('System fixes applied successfully!', 'success');
            }, 500);
        }
        
        return true;
    } catch (error) {
        console.error('Error applying fixes:', error);
        return false;
    }
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', initializeAllFixes);

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAllFixes);
} else {
    initializeAllFixes();
}

// Export for manual initialization
window.initializeAllFixes = initializeAllFixes;
