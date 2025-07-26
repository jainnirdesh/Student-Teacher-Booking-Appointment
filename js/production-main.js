/**
 * Production Main Application
 * Real-world ready Student-Teacher Booking System
 */

import productionAuth from './production-auth.js';

class EduBookApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormHandlers();
        this.initializeUI();
    }

    setupEventListeners() {
        // Portal buttons
        const studentBtn = document.getElementById('studentLoginBtn');
        const teacherBtn = document.getElementById('teacherLoginBtn');
        const adminBtn = document.getElementById('adminLoginBtn');

        if (studentBtn) {
            studentBtn.addEventListener('click', () => this.showLoginModal('student'));
        }
        if (teacherBtn) {
            teacherBtn.addEventListener('click', () => this.showLoginModal('teacher'));
        }
        if (adminBtn) {
            adminBtn.addEventListener('click', () => this.showLoginModal('admin'));
        }

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
            if (e.target.classList.contains('close')) {
                this.closeModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    setupFormHandlers() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // User type change
        const userTypeSelect = document.getElementById('userType');
        if (userTypeSelect) {
            userTypeSelect.addEventListener('change', (e) => {
                const teacherFields = document.getElementById('teacherFields');
                if (teacherFields) {
                    teacherFields.style.display = e.target.value === 'teacher' ? 'block' : 'none';
                }
            });
        }
    }

    showLoginModal(userType) {
        this.currentUserType = userType;
        const modal = document.getElementById('loginModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modal && modalTitle) {
            modalTitle.textContent = `${userType.charAt(0).toUpperCase() + userType.slice(1)} Login`;
            modal.style.display = 'block';
            
            // Clear any previous form data
            this.clearLoginForm();
        }
    }

    showRegisterModal() {
        this.closeModal();
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.style.display = 'block';
            this.clearRegisterForm();
        }
    }

    closeModal() {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        
        if (loginModal) loginModal.style.display = 'none';
        if (registerModal) registerModal.style.display = 'none';
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showError('Please fill in all fields.');
            return;
        }

        this.showLoading(true);
        
        try {
            const result = await productionAuth.signIn(email, password);
            
            if (result.success) {
                this.showSuccess('Login successful! Redirecting...');
                this.closeModal();
                // Auth state listener will handle redirection
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Login failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const userType = document.getElementById('userType').value;
        const department = document.getElementById('department')?.value.trim() || '';
        const subject = document.getElementById('subject')?.value.trim() || '';
        
        if (!name || !email || !password || !userType) {
            this.showError('Please fill in all required fields.');
            return;
        }

        if (userType === 'teacher' && (!department || !subject)) {
            this.showError('Department and subject are required for teachers.');
            return;
        }

        this.showLoading(true);
        
        try {
            const userData = {
                name,
                role: userType,
                department,
                subject
            };

            const result = await productionAuth.signUp(email, password, userData);
            
            if (result.success) {
                if (result.needsApproval) {
                    this.showSuccess('Account created! Please wait for admin approval before logging in.');
                } else {
                    this.showSuccess('Account created successfully! You can now log in.');
                }
                this.closeModal();
                this.showLoginModal(userType);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Registration failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    clearLoginForm() {
        const emailField = document.getElementById('loginEmail');
        const passwordField = document.getElementById('loginPassword');
        
        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
    }

    clearRegisterForm() {
        const fields = ['regName', 'regEmail', 'regPassword', 'userType', 'department', 'subject'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });
        
        const teacherFields = document.getElementById('teacherFields');
        if (teacherFields) teacherFields.style.display = 'none';
    }

    showLoading(show) {
        const buttons = document.querySelectorAll('button[type="submit"]');
        buttons.forEach(button => {
            if (show) {
                button.textContent = 'Please wait...';
                button.disabled = true;
            } else {
                button.textContent = button.id === 'loginSubmit' ? 'Login' : 'Register';
                button.disabled = false;
            }
        });
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

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
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
    }

    initializeUI() {
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .modal {
                animation: fadeIn 0.3s ease;
            }
            
            .modal-content {
                animation: slideUp 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateY(50px) scale(0.95); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }
            
            button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EduBookApp();
});

// Make functions available globally for HTML onclick handlers
window.showRegisterModal = function() {
    document.dispatchEvent(new CustomEvent('showRegisterModal'));
};

window.showLoginModalFromRegister = function() {
    document.dispatchEvent(new CustomEvent('showLoginModalFromRegister'));
};

// Listen for custom events
document.addEventListener('showRegisterModal', () => {
    window.eduBookApp?.showRegisterModal();
});

document.addEventListener('showLoginModalFromRegister', () => {
    window.eduBookApp?.closeModal();
    setTimeout(() => window.eduBookApp?.showLoginModal('student'), 100);
});
