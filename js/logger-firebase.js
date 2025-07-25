// Firebase-integrated Logger utility for tracking all user actions
import { 
    db,
    collection,
    addDoc 
} from './firebase-config.js';

class Logger {
    constructor() {
        this.logs = JSON.parse(localStorage.getItem('appLogs')) || [];
        this.offlineLogs = [];
        this.isOnline = navigator.onLine;
        this.setupNetworkListener();
    }

    setupNetworkListener() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineLogs();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    async log(level, action, details = {}, userId = null) {
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

        // Always store locally first
        this.logs.push(logEntry);
        
        // Keep only last 1000 logs to prevent storage overflow
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
        
        localStorage.setItem('appLogs', JSON.stringify(this.logs));
        
        // Console output for development
        console.log(`[${level.toUpperCase()}] ${action}:`, details);

        // Try to save to Firebase if online
        if (this.isOnline) {
            try {
                await this.saveToFirestore(logEntry);
            } catch (error) {
                console.warn('Failed to save log to Firestore:', error);
                this.offlineLogs.push(logEntry);
            }
        } else {
            this.offlineLogs.push(logEntry);
        }
    }

    async saveToFirestore(logEntry) {
        try {
            await addDoc(collection(db, 'logs'), logEntry);
        } catch (error) {
            throw error;
        }
    }

    async syncOfflineLogs() {
        if (this.offlineLogs.length === 0) return;

        try {
            const promises = this.offlineLogs.map(log => this.saveToFirestore(log));
            await Promise.all(promises);
            this.offlineLogs = [];
            console.log('Offline logs synced to Firebase');
        } catch (error) {
            console.error('Failed to sync offline logs:', error);
        }
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

    getLogs(filter = {}) {
        let filteredLogs = [...this.logs];

        if (filter.level) {
            filteredLogs = filteredLogs.filter(log => log.level === filter.level);
        }

        if (filter.action) {
            filteredLogs = filteredLogs.filter(log => 
                log.action.toLowerCase().includes(filter.action.toLowerCase())
            );
        }

        if (filter.userId) {
            filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
        }

        if (filter.startDate) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) >= new Date(filter.startDate)
            );
        }

        if (filter.endDate) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) <= new Date(filter.endDate)
            );
        }

        return filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getLogsByUser(userId) {
        return this.getLogs({ userId });
    }

    getLogsByAction(action) {
        return this.getLogs({ action });
    }

    getLogsByLevel(level) {
        return this.getLogs({ level });
    }

    getRecentLogs(limit = 50) {
        return this.logs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    clearLogs() {
        this.logs = [];
        localStorage.removeItem('appLogs');
        console.log('All logs cleared');
    }

    exportLogs(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.logs, null, 2);
        } else if (format === 'csv') {
            const headers = ['timestamp', 'level', 'action', 'details', 'userId', 'sessionId'];
            const csvContent = [
                headers.join(','),
                ...this.logs.map(log => [
                    log.timestamp,
                    log.level,
                    log.action,
                    JSON.stringify(log.details).replace(/"/g, '""'),
                    log.userId || '',
                    log.sessionId
                ].join(','))
            ].join('\n');
            return csvContent;
        }
        return this.logs;
    }

    getLogStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            byAction: {},
            byUser: {},
            recentSession: 0
        };

        const currentSessionId = this.getSessionId();

        this.logs.forEach(log => {
            // Count by level
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

            // Count by action
            stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

            // Count by user
            if (log.userId) {
                stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
            }

            // Count current session
            if (log.sessionId === currentSessionId) {
                stats.recentSession++;
            }
        });

        return stats;
    }

    // Performance monitoring
    startTimer(action) {
        const timerId = `${action}_${Date.now()}`;
        this[`timer_${timerId}`] = performance.now();
        return timerId;
    }

    endTimer(timerId, userId = null) {
        const startTime = this[`timer_${timerId}`];
        if (startTime) {
            const duration = performance.now() - startTime;
            const action = timerId.split('_')[0];
            this.info('PERFORMANCE', { 
                action, 
                duration: Math.round(duration),
                unit: 'milliseconds'
            }, userId);
            delete this[`timer_${timerId}`];
            return duration;
        }
        return null;
    }

    // User action tracking helpers
    trackPageView(page, userId = null) {
        this.info('PAGE_VIEW', { page }, userId);
    }

    trackUserAction(action, details = {}, userId = null) {
        this.info('USER_ACTION', { action, ...details }, userId);
    }

    trackError(error, context = '', userId = null) {
        this.error('APPLICATION_ERROR', {
            message: error.message,
            stack: error.stack,
            context
        }, userId);
    }

    trackApiCall(endpoint, method, status, duration, userId = null) {
        this.info('API_CALL', {
            endpoint,
            method,
            status,
            duration
        }, userId);
    }
}

// Create global logger instance
const logger = new Logger();

// Export convenience functions
export function logUserAction(userId, action, details) {
    logger.info(action, details, userId);
}

export function logError(error, context = '', userId = null) {
    logger.trackError(error, context, userId);
}

export function logPageView(page, userId = null) {
    logger.trackPageView(page, userId);
}

export function logPerformance(action, duration, userId = null) {
    logger.info('PERFORMANCE', { action, duration }, userId);
}

export function startTimer(action) {
    return logger.startTimer(action);
}

export function endTimer(timerId, userId = null) {
    return logger.endTimer(timerId, userId);
}

export function getLogs(filter = {}) {
    return logger.getLogs(filter);
}

export function getLogStats() {
    return logger.getLogStats();
}

export function exportLogs(format = 'json') {
    return logger.exportLogs(format);
}

export function clearLogs() {
    logger.clearLogs();
}

// Export the logger instance
export default logger;
