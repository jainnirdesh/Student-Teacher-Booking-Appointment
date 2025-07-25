// Logger utility for tracking all user actions
class Logger {
    constructor() {
        this.logs = JSON.parse(localStorage.getItem('appLogs')) || [];
    }

    log(level, action, details = {}, userId = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            action: action,
            details: details,
            userId: userId,
            sessionId: this.getSessionId(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.logs.push(logEntry);
        
        // Keep only last 1000 logs to prevent storage overflow
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
        
        localStorage.setItem('appLogs', JSON.stringify(this.logs));
        
        // Console output for development
        console.log(`[${level.toUpperCase()}] ${action}:`, details);
    }

    info(action, details = {}, userId = null) {
        this.log('info', action, details, userId);
    }

    warn(action, details = {}, userId = null) {
        this.log('warn', action, details, userId);
    }

    error(action, details = {}, userId = null) {
        this.log('error', action, details, userId);
    }

    success(action, details = {}, userId = null) {
        this.log('success', action, details, userId);
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    getLogs(level = null, limit = 100) {
        let filteredLogs = this.logs;
        
        if (level) {
            filteredLogs = this.logs.filter(log => log.level === level);
        }
        
        return filteredLogs.slice(-limit).reverse();
    }

    exportLogs() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `app_logs_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.info('LOGS_EXPORTED', { timestamp: new Date().toISOString() });
    }

    clearLogs() {
        this.logs = [];
        localStorage.removeItem('appLogs');
        this.info('LOGS_CLEARED', { timestamp: new Date().toISOString() });
    }

    // Track user interactions
    trackPageView(page) {
        this.info('PAGE_VIEW', { page: page });
    }

    trackUserAction(action, element = null, data = {}) {
        this.info('USER_ACTION', { 
            action: action, 
            element: element, 
            data: data 
        });
    }

    trackError(error, context = '') {
        this.error('APPLICATION_ERROR', {
            message: error.message,
            stack: error.stack,
            context: context
        });
    }

    trackAPICall(endpoint, method, status, duration = null) {
        this.info('API_CALL', {
            endpoint: endpoint,
            method: method,
            status: status,
            duration: duration
        });
    }

    trackAuthEvent(event, userId = null, userType = null) {
        this.info('AUTH_EVENT', {
            event: event,
            userId: userId,
            userType: userType
        });
    }

    trackAppointmentEvent(event, appointmentId = null, data = {}) {
        this.info('APPOINTMENT_EVENT', {
            event: event,
            appointmentId: appointmentId,
            data: data
        });
    }
}

// Global logger instance
window.logger = new Logger();

// Track page load
window.addEventListener('load', () => {
    logger.info('APP_LOADED', { 
        timestamp: new Date().toISOString(),
        page: window.location.pathname 
    });
});

// Track page unload
window.addEventListener('beforeunload', () => {
    logger.info('APP_UNLOAD', { 
        timestamp: new Date().toISOString(),
        page: window.location.pathname 
    });
});

// Track errors globally
window.addEventListener('error', (event) => {
    logger.trackError(event.error, 'GLOBAL_ERROR_HANDLER');
});

// Track unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    logger.trackError(new Error(event.reason), 'UNHANDLED_PROMISE_REJECTION');
});
