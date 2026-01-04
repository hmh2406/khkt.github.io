// 🎯 WEB USAGE TRACKER - Display utilities for usage tracking
import WebUsageTracker from './usageTracker.js';

class WebUsageDisplay {
    constructor() {
        this.tracker = window.webUsageTracker;
        this.init();
    }
    
    init() {
        // Update display every 10 seconds
        setInterval(() => {
            this.updateAllDisplays();
        }, 10000);
        
        // Initial update
        setTimeout(() => {
            this.updateAllDisplays();
        }, 1000);
        
        // Track page visits for analytics
        this.trackCurrentPage();
        
        // Listen for page changes
        this.setupPageTracking();
    }
    
    trackCurrentPage() {
        if (this.tracker) {
            this.tracker.trackPageVisit(document.title, window.location.href);
        }
    }
    
    setupPageTracking() {
        // Track navigation changes
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function() {
            originalPushState.apply(history, arguments);
            setTimeout(() => {
                if (window.webUsageTracker) {
                    window.webUsageTracker.trackPageVisit(document.title, window.location.href);
                }
            }, 100);
        };
        
        history.replaceState = function() {
            originalReplaceState.apply(history, arguments);
            setTimeout(() => {
                if (window.webUsageTracker) {
                    window.webUsageTracker.trackPageVisit(document.title, window.location.href);
                }
            }, 100);
        };
        
        // Track hash changes
        window.addEventListener('hashchange', () => {
            if (this.tracker) {
                this.tracker.trackPageVisit(document.title, window.location.href);
            }
        });
    }
    
    updateAllDisplays() {
        if (!this.tracker) return;
        
        const usage = this.tracker.getDailyUsage();
        if (!usage) return;
        
        // Update elements with data attributes
        const timeElements = document.querySelectorAll('[data-usage-time]');
        timeElements.forEach(el => {
            el.textContent = this.formatTime(usage.totalSeconds);
        });
        
        const remainingElements = document.querySelectorAll('[data-usage-remaining]');
        remainingElements.forEach(el => {
            el.textContent = `${usage.remainingMinutes}m`;
        });
        
        const sessionElements = document.querySelectorAll('[data-usage-sessions]');
        sessionElements.forEach(el => {
            el.textContent = usage.sessions;
        });
        
        // Update progress bars
        const progressElements = document.querySelectorAll('[data-usage-progress]');
        progressElements.forEach(el => {
            const percentage = Math.min(100, (usage.totalMinutes / 120) * 100);
            el.style.width = `${percentage}%`;
            
            // Add color coding
            if (percentage >= 90) {
                el.className = 'usage-progress danger';
            } else if (percentage >= 75) {
                el.className = 'usage-progress warning';
            } else {
                el.className = 'usage-progress normal';
            }
        });
        
        // Dispatch custom event for analytics
        document.dispatchEvent(new CustomEvent('usageUpdated', {
            detail: usage
        }));
    }
    
    formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    // Public API for analytics integration
    getUsageData() {
        return this.tracker ? this.tracker.getDailyUsage() : null;
    }
    
    getUsageStats() {
        return this.tracker ? this.tracker.getUsageStats() : null;
    }
    
    async getWeeklyData() {
        return this.tracker ? await this.tracker.getWeeklyUsage() : null;
    }
}

// Initialize display manager
const webUsageDisplay = new WebUsageDisplay();

// Global access for analytics
window.webUsageDisplay = webUsageDisplay;

export default webUsageDisplay;