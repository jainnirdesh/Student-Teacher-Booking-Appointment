/**
 * UI Enhancements for Student-Teacher Booking Application
 * Provides common functionality for all dashboards
 */

class DashboardUI {
    constructor() {
        this.init();
    }

    init() {
        this.setupSidebar();
        this.setupNotifications();
        this.setupUserMenu();
        this.setupNavigation();
        this.setupModals();
        this.setupAnimations();
        this.setupResponsiveFeatures();
        this.setupLoadingStates();
    }

    // Sidebar functionality
    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mainContent = document.querySelector('.main-content');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                
                // Save state to localStorage
                localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            });

            // Restore sidebar state
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
            }

            // Mobile sidebar toggle
            if (window.innerWidth <= 768) {
                sidebarToggle.addEventListener('click', () => {
                    sidebar.classList.toggle('show');
                });

                // Close sidebar when clicking outside on mobile
                document.addEventListener('click', (e) => {
                    if (window.innerWidth <= 768 && 
                        !sidebar.contains(e.target) && 
                        !sidebarToggle.contains(e.target)) {
                        sidebar.classList.remove('show');
                    }
                });
            }
        }
    }

    // Notification dropdown functionality
    setupNotifications() {
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationDropdown = document.getElementById('notificationDropdown');
        const markAllRead = document.querySelector('.mark-all-read');

        if (notificationBtn && notificationDropdown) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!notificationDropdown.contains(e.target)) {
                    notificationDropdown.classList.remove('show');
                }
            });

            // Mark all notifications as read
            if (markAllRead) {
                markAllRead.addEventListener('click', () => {
                    const unreadItems = notificationDropdown.querySelectorAll('.notification-item.unread');
                    unreadItems.forEach(item => {
                        item.classList.remove('unread');
                    });
                    
                    // Update notification badge
                    const badge = notificationBtn.querySelector('.notification-badge');
                    if (badge) {
                        badge.textContent = '0';
                        badge.style.display = 'none';
                    }
                });
            }
        }
    }

    // User menu functionality
    setupUserMenu() {
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userMenuDropdown = document.getElementById('userMenuDropdown');

        if (userMenuBtn && userMenuDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenuDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenuDropdown.contains(e.target)) {
                    userMenuDropdown.classList.remove('show');
                }
            });
        }
    }

    // Navigation between dashboard sections
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        const contentSections = document.querySelectorAll('.content-section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetSection = link.getAttribute('data-section');
                
                // Remove active class from all nav items and sections
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                contentSections.forEach(section => {
                    section.classList.remove('active');
                });
                
                // Add active class to clicked nav item and target section
                link.closest('.nav-item').classList.add('active');
                const targetElement = document.getElementById(targetSection);
                if (targetElement) {
                    targetElement.classList.add('active');
                    
                    // Animate section transition
                    targetElement.style.opacity = '0';
                    targetElement.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        targetElement.style.transition = 'all 0.3s ease';
                        targetElement.style.opacity = '1';
                        targetElement.style.transform = 'translateY(0)';
                    }, 50);
                }

                // Update page title
                const pageTitle = document.querySelector('.page-title');
                if (pageTitle) {
                    pageTitle.textContent = link.querySelector('span').textContent;
                }
            });
        });

        // Handle tab navigation within sections
        this.setupTabs();
    }

    // Tab functionality
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                const tabContainer = button.closest('.user-management-container, .settings-container');
                
                if (tabContainer) {
                    // Remove active class from all tabs in this container
                    tabContainer.querySelectorAll('.tab-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    tabContainer.querySelectorAll('.tab-pane').forEach(pane => {
                        pane.classList.remove('active');
                    });
                    
                    // Add active class to clicked tab
                    button.classList.add('active');
                    const targetPane = document.getElementById(`${targetTab}-tab`);
                    if (targetPane) {
                        targetPane.classList.add('active');
                    }
                }
            });
        });
    }

    // Modal functionality
    setupModals() {
        // Create modal overlay if it doesn't exist
        if (!document.querySelector('.modal-overlay')) {
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'modal-overlay';
            modalOverlay.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Modal Title</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        Modal content goes here
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-cancel">Cancel</button>
                        <button class="btn btn-primary modal-confirm">Confirm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modalOverlay);
        }

        // Modal controls
        const modalOverlay = document.querySelector('.modal-overlay');
        const modalClose = document.querySelector('.modal-close');
        const modalCancel = document.querySelector('.modal-cancel');

        [modalClose, modalCancel].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.hideModal();
                });
            }
        });

        // Close modal when clicking overlay
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.hideModal();
                }
            });
        }
    }

    // Show modal
    showModal(title, content, onConfirm = null) {
        const modalOverlay = document.querySelector('.modal-overlay');
        const modalTitle = document.querySelector('.modal-title');
        const modalBody = document.querySelector('.modal-body');
        const modalConfirm = document.querySelector('.modal-confirm');

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = content;
        
        if (onConfirm && modalConfirm) {
            modalConfirm.onclick = () => {
                onConfirm();
                this.hideModal();
            };
        }

        if (modalOverlay) {
            modalOverlay.classList.add('show');
        }
    }

    // Hide modal
    hideModal() {
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('show');
        }
    }

    // Animation utilities
    setupAnimations() {
        // Fade in animation for elements
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.stat-card, .card, .action-card').forEach(el => {
            observer.observe(el);
        });

        // Stagger animation for grids
        document.querySelectorAll('.stats-grid, .actions-grid').forEach(grid => {
            const items = grid.children;
            Array.from(items).forEach((item, index) => {
                item.style.animationDelay = `${index * 0.1}s`;
            });
        });
    }

    // Responsive features
    setupResponsiveFeatures() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Initial resize check
        this.handleResize();
    }

    handleResize() {
        const sidebar = document.getElementById('sidebar');
        const isMobile = window.innerWidth <= 768;

        if (sidebar) {
            if (isMobile) {
                sidebar.classList.remove('collapsed');
            } else {
                sidebar.classList.remove('show');
            }
        }

        // Adjust table responsiveness
        this.makeTablesResponsive();
    }

    // Make tables responsive
    makeTablesResponsive() {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            if (!table.closest('.table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }

    // Loading states
    setupLoadingStates() {
        // Show loading overlay
        window.showLoading = () => {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('show');
            }
        };

        // Hide loading overlay
        window.hideLoading = () => {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.remove('show');
            }
        };

        // Add loading state to buttons
        this.setupButtonLoading();
    }

    setupButtonLoading() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('button[data-loading]')) {
                const button = e.target;
                const originalText = button.innerHTML;
                
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                
                // Remove loading state after 2 seconds (or when your actual operation completes)
                setTimeout(() => {
                    button.disabled = false;
                    button.innerHTML = originalText;
                }, 2000);
            }
        });
    }

    // Utility functions
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Quick action handlers
    setupQuickActions() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.action-card')) {
                const actionCard = e.target.closest('.action-card');
                const action = actionCard.getAttribute('data-action');
                this.handleQuickAction(action);
            }
        });
    }

    handleQuickAction(action) {
        switch (action) {
            case 'add-user':
                this.showModal('Add New User', this.getUserForm(), () => {
                    this.showNotification('User added successfully!', 'success');
                });
                break;
            case 'send-message':
                this.showModal('Send Message', this.getMessageForm(), () => {
                    this.showNotification('Message sent successfully!', 'success');
                });
                break;
            case 'generate-report':
                this.showNotification('Report generation started...', 'info');
                break;
            default:
                this.showNotification('Feature coming soon!', 'info');
        }
    }

    getUserForm() {
        return `
            <form class="user-form">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select class="form-select" required>
                        <option value="">Select Role</option>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                </div>
            </form>
        `;
    }

    getMessageForm() {
        return `
            <form class="message-form">
                <div class="form-group">
                    <label>Recipients</label>
                    <select class="form-select" multiple required>
                        <option value="all">All Users</option>
                        <option value="teachers">All Teachers</option>
                        <option value="students">All Students</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Subject</label>
                    <input type="text" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Message</label>
                    <textarea class="form-control" rows="4" required></textarea>
                </div>
            </form>
        `;
    }

    // Search functionality
    setupSearch() {
        const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"]');
        
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const targetTable = e.target.closest('.section').querySelector('table');
                
                if (targetTable) {
                    this.filterTable(targetTable, searchTerm);
                }
            });
        });
    }

    filterTable(table, searchTerm) {
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    // Initialize charts (placeholder for Chart.js integration)
    initCharts() {
        const chartElements = document.querySelectorAll('canvas[id*="Chart"]');
        
        chartElements.forEach(canvas => {
            // Placeholder for actual chart implementation
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#333';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Chart will be rendered here', canvas.width / 2, canvas.height / 2);
        });
    }
}

// CSS for notifications and modals
const additionalCSS = `
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.modal-overlay.show {
    opacity: 1;
    visibility: visible;
}

.modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.modal-overlay.show .modal {
    transform: scale(1);
}

.modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #dee2e6;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-body {
    padding: 1.5rem;
    max-height: 60vh;
    overflow-y: auto;
}

.modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #dee2e6;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 400px;
    z-index: 10001;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.notification.show {
    transform: translateX(0);
}

.notification-info { border-left: 4px solid #17a2b8; }
.notification-success { border-left: 4px solid #28a745; }
.notification-warning { border-left: 4px solid #ffc107; }
.notification-error { border-left: 4px solid #dc3545; }

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
    font-size: 1.2rem;
}

.table-responsive {
    overflow-x: auto;
    border-radius: 8px;
}

.animate-fade-in {
    animation: fadeInUp 0.6s ease forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .modal {
        margin: 1rem;
        width: calc(100% - 2rem);
    }
    
    .notification {
        right: 10px;
        left: 10px;
        max-width: none;
    }
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// Initialize dashboard UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const dashboardUI = new DashboardUI();
    dashboardUI.setupQuickActions();
    dashboardUI.setupSearch();
    dashboardUI.initCharts();
    
    // Make dashboardUI globally available
    window.dashboardUI = dashboardUI;
});
