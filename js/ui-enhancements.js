// UI Enhancement utilities
class UIEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.addLoadingStates();
        this.addNotificationSystem();
        this.addFormValidation();
        this.addSmoothScrolling();
        this.addKeyboardNavigation();
        this.addTooltips();
        this.initThemeToggle();
    }

    // Enhanced notification system
    static showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type} fade-in`;
        notification.innerHTML = `
            <div class="d-flex align-center gap-2">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem;">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);

        // Add slide out animation
        if (!document.querySelector('style[data-notification-styles]')) {
            const style = document.createElement('style');
            style.setAttribute('data-notification-styles', true);
            style.textContent = `
                @keyframes slideOut {
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    static getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Enhanced loading states
    addLoadingStates() {
        // Add loading utility functions to window
        window.showLoading = (element, text = 'Loading...') => {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            if (!element) return;

            element.classList.add('loading');
            element.style.position = 'relative';
            element.style.pointerEvents = 'none';
            
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">${text}</div>
            `;
            element.appendChild(loadingOverlay);
        };

        window.hideLoading = (element) => {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            if (!element) return;

            element.classList.remove('loading');
            element.style.pointerEvents = '';
            
            const overlay = element.querySelector('.loading-overlay');
            if (overlay) {
                overlay.remove();
            }
        };

        // Add loading styles
        if (!document.querySelector('style[data-loading-styles]')) {
            const style = document.createElement('style');
            style.setAttribute('data-loading-styles', true);
            style.textContent = `
                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    border-radius: inherit;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                }

                .loading-text {
                    color: var(--text-color);
                    font-weight: 500;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Enhanced form validation
    addFormValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        
        let isValid = true;
        let message = '';

        // Required validation
        if (required && !value) {
            isValid = false;
            message = 'This field is required';
        }
        // Email validation
        else if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }
        }
        // Password validation
        else if (type === 'password' && value) {
            if (value.length < 6) {
                isValid = false;
                message = 'Password must be at least 6 characters long';
            }
        }

        if (!isValid) {
            this.showFieldError(field, message);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.style.borderColor = 'var(--accent-color)';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: var(--accent-color);
            font-size: 0.875rem;
            margin-top: 0.25rem;
            animation: fadeIn 0.3s ease;
        `;
        
        field.parentElement.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.style.borderColor = '';
        const error = field.parentElement.querySelector('.field-error');
        if (error) {
            error.remove();
        }
    }

    // Smooth scrolling for navigation
    addSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Keyboard navigation
    addKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // ESC to close modals
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="block"]');
                if (openModal) {
                    openModal.style.display = 'none';
                }
            }
            
            // Enter to submit forms
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                const form = e.target.closest('form');
                if (form) {
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.click();
                    }
                }
            }
        });
    }

    // Tooltip system
    addTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = e.target.getAttribute('data-tooltip');
                tooltip.style.cssText = `
                    position: absolute;
                    background: var(--darker-color);
                    color: var(--lighter-color);
                    padding: 0.5rem 0.75rem;
                    border-radius: var(--border-radius-sm);
                    font-size: 0.875rem;
                    z-index: 9999;
                    white-space: nowrap;
                    animation: fadeIn 0.2s ease;
                    box-shadow: var(--shadow);
                `;
                
                document.body.appendChild(tooltip);
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
                
                element._tooltip = tooltip;
            });
            
            element.addEventListener('mouseleave', () => {
                if (element._tooltip) {
                    element._tooltip.remove();
                    element._tooltip = null;
                }
            });
        });
    }

    // Theme toggle functionality
    initThemeToggle() {
        // Create theme toggle button
        const themeToggle = document.createElement('button');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('data-tooltip', 'Toggle Dark Mode');
        themeToggle.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            border: none;
            background: var(--primary-color);
            color: var(--lighter-color);
            font-size: 1.2rem;
            cursor: pointer;
            box-shadow: var(--shadow-lg);
            transition: var(--transition);
            z-index: 1000;
        `;
        
        document.body.appendChild(themeToggle);
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.enableDarkMode();
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-mode');
            if (isDark) {
                this.disableDarkMode();
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('theme', 'light');
            } else {
                this.enableDarkMode();
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    enableDarkMode() {
        document.body.classList.add('dark-mode');
        
        if (!document.querySelector('style[data-dark-mode]')) {
            const darkModeStyles = document.createElement('style');
            darkModeStyles.setAttribute('data-dark-mode', true);
            darkModeStyles.textContent = `
                .dark-mode {
                    --text-color: #ffffff;
                    --text-light: #cccccc;
                    --text-muted: #888888;
                    --lighter-color: #1a1a1a;
                    --light-color: #2d2d2d;
                    --border-color: #404040;
                    --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                
                .dark-mode .container {
                    background: var(--lighter-color);
                }
                
                .dark-mode .modal-content {
                    background: var(--lighter-color);
                    border-color: var(--border-color);
                }
                
                .dark-mode .form-group input,
                .dark-mode .form-group select,
                .dark-mode .form-group textarea {
                    background: var(--light-color);
                    border-color: var(--border-color);
                    color: var(--text-color);
                }
                
                .dark-mode .card {
                    background: var(--light-color);
                }
            `;
            document.head.appendChild(darkModeStyles);
        }
    }

    disableDarkMode() {
        document.body.classList.remove('dark-mode');
    }

    // Enhanced modal functionality
    static enhanceModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Prevent modal content clicks from closing modal
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    // Enhanced button interactions
    static enhanceButton(button) {
        if (typeof button === 'string') {
            button = document.querySelector(button);
        }
        if (!button) return;

        // Add ripple effect
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });

        // Add ripple animation
        if (!document.querySelector('style[data-ripple-styles]')) {
            const style = document.createElement('style');
            style.setAttribute('data-ripple-styles', true);
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize UI enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiEnhancements = new UIEnhancements();
    
    // Enhance existing elements
    document.querySelectorAll('.btn').forEach(btn => UIEnhancements.enhanceButton(btn));
    document.querySelectorAll('.modal').forEach(modal => UIEnhancements.enhanceModal(modal.id));
    
    // Override the global showNotification function
    window.showNotification = UIEnhancements.showNotification;
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIEnhancements;
}
