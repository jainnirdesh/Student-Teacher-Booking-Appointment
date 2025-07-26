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
        const userDropdown = document.getElementById('userDropdown');

        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('show');
                }
            });
        }
    }

    // Navigation functionality
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Remove active class from all nav items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                e.currentTarget.classList.add('active');
            });
        });
    }

    // Modal functionality
    setupModals() {
        // Close modal when clicking overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target.id);
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-overlay[style*="flex"]');
                if (openModal) {
                    this.closeModal(openModal.id);
                }
            }
        });

        // Setup close buttons
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // Open modal
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Add fade-in animation
            modal.style.opacity = '0';
            requestAnimationFrame(() => {
                modal.style.transition = 'opacity 0.3s ease';
                modal.style.opacity = '1';
            });
        }
    }

    // Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    // Animation helpers
    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observeOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observeOptions);

        // Observe elements with animation classes
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    // Responsive features
    setupResponsiveFeatures() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Initial resize handling
        this.handleResize();
    }

    handleResize() {
        const sidebar = document.getElementById('sidebar');
        
        if (window.innerWidth <= 768) {
            // Mobile: Hide sidebar by default
            if (sidebar) {
                sidebar.classList.remove('show');
            }
        } else {
            // Desktop: Show sidebar
            if (sidebar) {
                sidebar.classList.remove('show');
            }
        }
    }

    // Loading states
    setupLoadingStates() {
        // Add loading styles if not present
        if (!document.querySelector('#loading-styles')) {
            const loadingStyles = document.createElement('style');
            loadingStyles.id = 'loading-styles';
            loadingStyles.textContent = `
                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    border-radius: inherit;
                }
                
                .loading-spinner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    color: #007bff;
                    font-weight: 500;
                }
                
                .loading-spinner i {
                    font-size: 24px;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .fa-spin {
                    animation: spin 1s linear infinite;
                }
                
                /* Form validation styles */
                .form-group {
                    margin-bottom: 1rem;
                }
                
                .form-control {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                }
                
                .form-control:focus {
                    border-color: #007bff;
                    outline: 0;
                    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
                }
                
                .form-control.error {
                    border-color: #dc3545;
                    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
                }
                
                .error-message {
                    color: #dc3545;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }
                
                /* Data table styles */
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                
                .data-table th,
                .data-table td {
                    padding: 12px 16px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                
                .data-table th {
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #495057;
                    position: relative;
                }
                
                .data-table th.sortable {
                    cursor: pointer;
                    user-select: none;
                }
                
                .data-table th.sortable:hover {
                    background: #e9ecef;
                }
                
                .data-table th.sort-asc::after {
                    content: '↑';
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                
                .data-table th.sort-desc::after {
                    content: '↓';
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                
                .data-table tbody tr:hover {
                    background: #f8f9fa;
                }
                
                .data-table tbody tr:last-child td {
                    border-bottom: none;
                }
                
                /* Search input styles */
                .search-input {
                    width: 100%;
                    max-width: 300px;
                    padding: 8px 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 20px;
                    font-size: 14px;
                    background: #f8f9fa;
                    transition: all 0.3s ease;
                }
                
                .search-input:focus {
                    border-color: #007bff;
                    background: white;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
                }
                
                /* Progress indicators */
                .progress {
                    width: 100%;
                    height: 8px;
                    background: #e9ecef;
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(45deg, #007bff, #0056b3);
                    transition: width 0.3s ease;
                    position: relative;
                }
                
                .progress-bar::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    right: 0;
                    background: linear-gradient(
                        45deg,
                        transparent 33%,
                        rgba(255, 255, 255, 0.3) 33%,
                        rgba(255, 255, 255, 0.3) 66%,
                        transparent 66%
                    );
                    background-size: 30px 30px;
                    animation: progressStripes 1s linear infinite;
                }
                
                @keyframes progressStripes {
                    0% { background-position: 0 0; }
                    100% { background-position: 30px 0; }
                }
            `;
            document.head.appendChild(loadingStyles);
        }
    }

    // Toast notification system
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add toast styles if not present
        if (!document.querySelector('#toast-styles')) {
            const toastStyles = document.createElement('style');
            toastStyles.id = 'toast-styles';
            toastStyles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 16px;
                    border-radius: 8px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 10000;
                    min-width: 300px;
                    max-width: 500px;
                    animation: slideInToast 0.3s ease;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                }
                
                .toast-success { background: #28a745; }
                .toast-error { background: #dc3545; }
                .toast-warning { background: #ffc107; color: #212529; }
                .toast-info { background: #007bff; }
                
                .toast-close {
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    margin-left: auto;
                    opacity: 0.8;
                }
                
                .toast-close:hover {
                    opacity: 1;
                }
                
                @keyframes slideInToast {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(toastStyles);
        }

        document.body.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideInToast 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    // Confirmation dialog
    showConfirmDialog(title, message, onConfirm, onCancel = null) {
        const dialogId = 'confirmDialog_' + Date.now();
        const dialog = document.createElement('div');
        dialog.id = dialogId;
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-content">
                    <p>${message}</p>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="dashboardUI.closeModal('${dialogId}'); ${onCancel ? onCancel.toString() + '()' : ''}">Cancel</button>
                        <button class="btn btn-primary" onclick="dashboardUI.closeModal('${dialogId}'); ${onConfirm.toString()}()">Confirm</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        this.openModal(dialogId);

        // Auto cleanup after 30 seconds
        setTimeout(() => {
            if (document.getElementById(dialogId)) {
                dialog.remove();
            }
        }, 30000);
    }

    // Loading state management
    showLoading(element, text = 'Loading...') {
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${text}</span>
            </div>
        `;

        if (typeof element === 'string') {
            element = document.getElementById(element);
        }

        if (element) {
            element.style.position = 'relative';
            element.appendChild(loader);
        }
    }

    hideLoading(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }

        if (element) {
            const loader = element.querySelector('.loading-overlay');
            if (loader) {
                loader.remove();
            }
        }
    }

    // Form validation helpers
    validateForm(formElement) {
        let isValid = true;
        const errors = [];

        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                errors.push(`${input.name || input.id} is required`);
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }

            // Email validation
            if (input.type === 'email' && input.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    isValid = false;
                    errors.push('Please enter a valid email address');
                    input.classList.add('error');
                }
            }

            // Phone validation
            if (input.type === 'tel' && input.value) {
                const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
                if (!phoneRegex.test(input.value)) {
                    isValid = false;
                    errors.push('Please enter a valid phone number');
                    input.classList.add('error');
                }
            }
        });

        return { isValid, errors };
    }

    // Data table helpers
    createDataTable(containerId, data, columns, options = {}) {
        const container = document.getElementById(containerId);
        if (!container || !data || !columns) return;

        const table = document.createElement('table');
        table.className = 'data-table';

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.title;
            th.dataset.key = column.key;
            if (column.sortable !== false) {
                th.classList.add('sortable');
                th.addEventListener('click', () => this.sortTable(table, column.key));
            }
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        this.populateTableBody(tbody, data, columns);
        table.appendChild(tbody);

        container.innerHTML = '';
        container.appendChild(table);

        return table;
    }

    populateTableBody(tbody, data, columns) {
        tbody.innerHTML = '';
        
        data.forEach(row => {
            const tr = document.createElement('tr');
            
            columns.forEach(column => {
                const td = document.createElement('td');
                
                if (column.render) {
                    td.innerHTML = column.render(row[column.key], row);
                } else {
                    td.textContent = row[column.key] || '';
                }
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
    }

    sortTable(table, key) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const header = table.querySelector(`th[data-key="${key}"]`);
        
        const isAscending = !header.classList.contains('sort-asc');
        
        // Remove existing sort classes
        table.querySelectorAll('th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Add current sort class
        header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
        
        // Sort rows
        rows.sort((a, b) => {
            const aText = a.cells[Array.from(table.querySelectorAll('th')).findIndex(th => th.dataset.key === key)].textContent;
            const bText = b.cells[Array.from(table.querySelectorAll('th')).findIndex(th => th.dataset.key === key)].textContent;
            
            const aValue = isNaN(aText) ? aText : parseFloat(aText);
            const bValue = isNaN(bText) ? bText : parseFloat(bText);
            
            if (isAscending) {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        // Reorder DOM
        rows.forEach(row => tbody.appendChild(row));
    }

    // Search and filter functionality
    setupTableSearch(tableId, searchInputId) {
        const table = document.getElementById(tableId);
        const searchInput = document.getElementById(searchInputId);
        
        if (!table || !searchInput) return;
        
        searchInput.addEventListener('input', this.debounce((e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }, 300));
    }
}

// Initialize the dashboard UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardUI = new DashboardUI();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardUI;
}