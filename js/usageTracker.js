// 🎯 WEB USAGE TRACKER - Tính thời gian sử dụng web chính xác
// ⏱️ Tính từ lúc đăng nhập → đăng xuất hoặc đóng tab/reload
// 🔥 Lưu thời gian lên Firebase theo ngày, cộng dồn nhiều session
// 🚫 Giới hạn 120 phút/ngày, chặn nếu vượt

import { auth, db } from './firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class WebUsageTracker {
    constructor() {
        this.config = {
            maxDailyMinutes: 120,           // Giới hạn 120 phút/ngày
            warningThreshold: 100,          // Cảnh báo ở 100 phút
            checkInterval: 30000,           // Check mỗi 30 giây
            saveInterval: 60000             // Lưu Firebase mỗi 60 giây
        };
        
        this.currentUser = null;
        this.sessionStartTime = null;
        this.lastSaveTime = null;
        this.dailyUsage = {
            totalSeconds: 0,
            sessions: 0,
            date: null
        };
        
        this.isBlocked = false;
        this.saveTimer = null;
        this.checkTimer = null;
        
        this.init();
    }

    // ==================== INITIALIZATION ====================
    
    init() {
        console.log('🎯 Initializing Web Usage Tracker...');
        
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.handleUserLogin(user);
            } else {
                this.handleUserLogout();
            }
        });
        
        // Listen for page unload (đóng tab/reload)
        window.addEventListener('beforeunload', () => {
            this.handlePageUnload();
        });
        
        // Listen for visibility change (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleTabHidden();
            } else {
                this.handleTabVisible();
            }
        });
        
        console.log('✅ Web Usage Tracker initialized');
    }

    // ==================== USER SESSION MANAGEMENT ====================
    
    async handleUserLogin(user) {
        console.log('🔐 User logged in, starting usage tracking...');
        
        this.currentUser = user;
        this.sessionStartTime = Date.now();
        this.lastSaveTime = Date.now();
        
        // Load today's usage data
        await this.loadDailyUsage();
        
        // Check if user is already blocked
        if (this.isUsageLimitExceeded()) {
            this.blockUserAccess();
            return false;
        }
        
        // Start tracking timers
        this.startTrackingTimers();
        
        // Update session count
        this.dailyUsage.sessions += 1;
        await this.saveDailyUsage();
        
        console.log('✅ Usage tracking started for user:', user.email);
        return true;
    }
    
    async handleUserLogout() {
        console.log('🔓 User logged out, stopping usage tracking...');
        
        if (this.currentUser && this.sessionStartTime) {
            // Calculate and save final session time
            await this.saveCurrentSession();
        }
        
        this.stopTrackingTimers();
        this.resetSession();
        
        console.log('✅ Usage tracking stopped');
    }
    
    handlePageUnload() {
        if (this.currentUser && this.sessionStartTime) {
            // ✅ CÁCH ĐÚNG: Tính chênh lệch thời gian
            const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            
            // Use sendBeacon for reliable data sending during unload
            const data = {
                userId: this.currentUser.uid,
                date: this.getTodayString(),
                sessionDuration: sessionDuration,
                timestamp: Date.now()
            };
            
            // Try to send data immediately
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/save-usage', JSON.stringify(data));
            }
            
            // Also save to localStorage as backup
            this.saveToLocalStorage(sessionDuration);
            
            console.log('📤 Page unload - saved session duration:', sessionDuration, 'seconds');
        }
    }
    
    handleTabHidden() {
        // Pause tracking when tab is hidden
        if (this.sessionStartTime) {
            this.saveCurrentSessionProgress();
        }
    }
    
    handleTabVisible() {
        // Resume tracking when tab becomes visible
        if (this.currentUser && !this.sessionStartTime) {
            this.sessionStartTime = Date.now();
            this.lastSaveTime = Date.now();
        }
    }

    // ==================== USAGE CALCULATION ====================
    
    async saveCurrentSession() {
        if (!this.currentUser || !this.sessionStartTime) return false;
        
        try {
            // ✅ CÁCH ĐÚNG: Tính chênh lệch timestamp
            const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            
            if (sessionDuration > 0) {
                this.dailyUsage.totalSeconds += sessionDuration;
                await this.saveDailyUsage();
                
                console.log('💾 Saved session duration:', sessionDuration, 'seconds');
                console.log('📊 Total daily usage:', this.dailyUsage.totalSeconds, 'seconds');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error saving current session:', error);
            return false;
        }
    }
    
    async saveCurrentSessionProgress() {
        // Save progress without ending session
        if (!this.currentUser || !this.sessionStartTime) return false;
        
        try {
            const sessionDuration = Math.floor((Date.now() - this.lastSaveTime) / 1000);
            
            if (sessionDuration > 0) {
                this.dailyUsage.totalSeconds += sessionDuration;
                await this.saveDailyUsage();
                
                // Reset last save time
                this.lastSaveTime = Date.now();
                
                console.log('💾 Saved session progress:', sessionDuration, 'seconds');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error saving session progress:', error);
            return false;
        }
    }

    // ==================== FIREBASE DATA MANAGEMENT ====================
    
    async loadDailyUsage() {
        if (!this.currentUser) return false;
        
        try {
            const today = this.getTodayString();
            const docRef = doc(db, 'usage', this.currentUser.uid, 'daily', today);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.dailyUsage = {
                    totalSeconds: data.totalSeconds || 0,
                    sessions: data.sessions || 0,
                    date: today
                };
                
                console.log('📊 Loaded daily usage:', this.dailyUsage);
            } else {
                // Initialize new day
                this.dailyUsage = {
                    totalSeconds: 0,
                    sessions: 0,
                    date: today
                };
                
                console.log('🆕 Initialized new daily usage tracking');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error loading daily usage:', error);
            return false;
        }
    }
    
    async saveDailyUsage() {
        if (!this.currentUser) return false;
        
        try {
            const today = this.getTodayString();
            const docRef = doc(db, 'usage', this.currentUser.uid, 'daily', today);
            
            const data = {
                totalSeconds: this.dailyUsage.totalSeconds,
                sessions: this.dailyUsage.sessions,
                date: today,
                lastUpdated: serverTimestamp(),
                userId: this.currentUser.uid
            };
            
            await setDoc(docRef, data, { merge: true });
            
            console.log('💾 Saved daily usage to Firebase:', data);
            return true;
        } catch (error) {
            console.error('❌ Error saving daily usage:', error);
            return false;
        }
    }
    
    saveToLocalStorage(sessionDuration) {
        try {
            const today = this.getTodayString();
            const key = `usage_backup_${this.currentUser.uid}_${today}`;
            
            const existing = localStorage.getItem(key);
            const backup = existing ? JSON.parse(existing) : { totalSeconds: 0, sessions: 0 };
            
            backup.totalSeconds += sessionDuration;
            backup.lastSession = Date.now();
            
            localStorage.setItem(key, JSON.stringify(backup));
            
            console.log('💾 Saved usage backup to localStorage');
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
        }
    }

    // ==================== USAGE LIMIT ENFORCEMENT ====================
    
    isUsageLimitExceeded() {
        const dailyMinutes = Math.floor(this.dailyUsage.totalSeconds / 60);
        return dailyMinutes >= this.config.maxDailyMinutes;
    }
    
    getRemainingMinutes() {
        const usedMinutes = Math.floor(this.dailyUsage.totalSeconds / 60);
        return Math.max(0, this.config.maxDailyMinutes - usedMinutes);
    }
    
    blockUserAccess() {
        this.isBlocked = true;
        this.stopTrackingTimers();
        
        // Show blocking UI
        this.showUsageLimitModal();
        
        // Redirect to a blocked page or show overlay
        setTimeout(() => {
            if (confirm('Bạn đã sử dụng hết 120 phút trong ngày. Vui lòng quay lại vào ngày mai.')) {
                window.location.href = 'index.html';
            }
        }, 2000);
        
        console.log('🚫 User access blocked - daily limit exceeded');
    }
    
    showUsageLimitModal() {
        // Create and show usage limit modal
        const modal = document.createElement('div');
        modal.className = 'usage-limit-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-icon">⏰</div>
                    <h2>Đã hết thời gian sử dụng</h2>
                    <p>Bạn đã sử dụng hết <strong>120 phút</strong> trong ngày hôm nay.</p>
                    <p>Vui lòng quay lại vào ngày mai để tiếp tục học tập.</p>
                    <button onclick="window.location.href='index.html'" class="btn btn-primary">
                        Đăng xuất
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // ==================== TRACKING TIMERS ====================
    
    startTrackingTimers() {
        // Timer to save progress periodically
        this.saveTimer = setInterval(() => {
            this.saveCurrentSessionProgress();
        }, this.config.saveInterval);
        
        // Timer to check usage limits
        this.checkTimer = setInterval(() => {
            this.checkUsageLimit();
        }, this.config.checkInterval);
        
        console.log('⏰ Started tracking timers');
    }
    
    stopTrackingTimers() {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
            this.saveTimer = null;
        }
        
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
        
        console.log('⏰ Stopped tracking timers');
    }
    
    checkUsageLimit() {
        if (this.isUsageLimitExceeded() && !this.isBlocked) {
            this.blockUserAccess();
        } else {
            // Show warning if approaching limit
            const remainingMinutes = this.getRemainingMinutes();
            if (remainingMinutes <= 20 && remainingMinutes > 0) {
                this.showUsageWarning(remainingMinutes);
            }
        }
    }
    
    showUsageWarning(remainingMinutes) {
        // Show warning toast
        const toast = document.createElement('div');
        toast.className = 'usage-warning-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-clock"></i>
                <span>Còn lại ${remainingMinutes} phút sử dụng hôm nay</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // ==================== UTILITY METHODS ====================
    
    getTodayString() {
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    resetSession() {
        this.currentUser = null;
        this.sessionStartTime = null;
        this.lastSaveTime = null;
        this.isBlocked = false;
    }
    
    // ==================== PUBLIC API ====================
    
    getDailyUsage() {
        return {
            totalMinutes: Math.floor(this.dailyUsage.totalSeconds / 60),
            totalSeconds: this.dailyUsage.totalSeconds,
            sessions: this.dailyUsage.sessions,
            remainingMinutes: this.getRemainingMinutes(),
            isBlocked: this.isBlocked,
            sessionStart: this.sessionStartTime,
            pages: this.getPageHistory(),
            date: this.getTodayString()
        };
    }
    
    getUsageDisplay() {
        const minutes = Math.floor(this.dailyUsage.totalSeconds / 60);
        const seconds = this.dailyUsage.totalSeconds % 60;
        return `${minutes}m ${seconds}s`;
    }
    
    // Get usage data for a specific date
    async getUsageByDate(dateString) {
        if (!this.currentUser) return null;
        
        try {
            const docRef = doc(db, 'usage', this.currentUser.uid, 'daily', dateString);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    totalMinutes: Math.floor(data.totalSeconds / 60),
                    totalSeconds: data.totalSeconds,
                    sessions: data.sessions,
                    pages: data.pages || [],
                    date: dateString
                };
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error getting usage by date:', error);
            return null;
        }
    }
    
    // Get weekly usage data
    async getWeeklyUsage() {
        const weekData = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = await this.getUsageByDate(dateStr);
            weekData.push({
                date: dateStr,
                dayName: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
                ...dayData
            });
        }
        
        return weekData;
    }
    
    // Track page visits for analytics
    trackPageVisit(title, url) {
        if (!this.dailyUsage.pages) {
            this.dailyUsage.pages = [];
        }
        
        this.dailyUsage.pages.push({
            title: title || document.title,
            url: url || window.location.href,
            timestamp: Date.now(),
            timeSpent: 0
        });
        
        // Limit page history to prevent excessive data
        if (this.dailyUsage.pages.length > 100) {
            this.dailyUsage.pages = this.dailyUsage.pages.slice(-50);
        }
    }
    
    // Get page visit history
    getPageHistory() {
        return this.dailyUsage.pages || [];
    }
    
    // Get usage statistics
    getUsageStats() {
        const totalMinutes = Math.floor(this.dailyUsage.totalSeconds / 60);
        const averageSessionLength = this.dailyUsage.sessions > 0 
            ? Math.floor(totalMinutes / this.dailyUsage.sessions) 
            : 0;
        
        return {
            totalMinutes,
            totalHours: Math.round(totalMinutes / 60 * 10) / 10,
            sessions: this.dailyUsage.sessions,
            averageSessionLength,
            remainingMinutes: this.getRemainingMinutes(),
            usagePercentage: Math.round((totalMinutes / this.config.maxDailyMinutes) * 100),
            isNearLimit: this.getRemainingMinutes() <= 20,
            isBlocked: this.isBlocked
        };
    }
    
    // Force save current session (for manual triggers)
    async forceSave() {
        return await this.saveCurrentSession();
    }
    
    // Export usage data
    async exportUsageData(days = 30) {
        if (!this.currentUser) return null;
        
        const exportData = {
            userId: this.currentUser.uid,
            exportDate: new Date().toISOString(),
            days: days,
            data: []
        };
        
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = await this.getUsageByDate(dateStr);
            if (dayData) {
                exportData.data.push({
                    date: dateStr,
                    dayName: date.toLocaleDateString('vi-VN', { weekday: 'long' }),
                    ...dayData
                });
            }
        }
        
        return exportData;
    }
}

// ==================== STYLES ====================
const styles = `
<style>
.usage-limit-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.usage-limit-modal .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
}

.usage-limit-modal .modal-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    max-width: 400px;
    text-align: center;
    position: relative;
    z-index: 1;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.usage-limit-modal .modal-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.usage-limit-modal h2 {
    color: #dc2626;
    margin-bottom: 1rem;
}

.usage-limit-modal p {
    margin-bottom: 1rem;
    color: #6b7280;
}

.usage-warning-toast {
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: rgba(251, 191, 36, 0.95);
    color: #92400e;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
}

.usage-warning-toast .toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', styles);

// ==================== EXPORT ====================
export default WebUsageTracker;

// Create global instance
window.webUsageTracker = new WebUsageTracker();

console.log('🎯 Web Usage Tracker module loaded');