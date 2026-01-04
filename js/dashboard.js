// 🎓 PHẦN MỀM HỖ TRỢ HỌC TẬP CHỦ ĐỘNG - Dashboard Module

import { auth, db } from './firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class Dashboard {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        
        this.init();
    }

    init() {
        // Wait for authentication - but don't handle redirects here
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserProfile();
                this.updateUI();
                this.initializeEventListeners();
            } else {
                // Don't redirect here - let auth.js handle it
                console.log('❌ User not authenticated in dashboard');
            }
        });
    }

    async loadUserProfile() {
        try {
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            if (userDoc.exists()) {
                this.userProfile = userDoc.data();
            } else {
                // Create default profile if doesn't exist
                this.userProfile = {
                    email: this.currentUser.email,
                    displayName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
                    role: 'student',
                    createdAt: new Date().toISOString()
                };
            }
            console.log('✅ User profile loaded');
        } catch (error) {
            console.error('❌ Error loading user profile:', error);
        }
    }

    updateUI() {
        // Update user info
        this.updateUserInfo();
        
        // Update recent activity
        this.updateRecentActivity();
    }

    updateUserInfo() {
        const userNameElements = document.querySelectorAll('[data-user-name]');
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        const userAvatarElements = document.querySelectorAll('[data-user-avatar]');
        
        const displayName = this.userProfile?.displayName || this.currentUser.displayName || this.currentUser.email.split('@')[0];
        
        userNameElements.forEach(el => {
            el.textContent = displayName;
        });
        
        userEmailElements.forEach(el => {
            el.textContent = this.currentUser.email;
        });
        
        userAvatarElements.forEach(el => {
            if (this.currentUser.photoURL) {
                el.src = this.currentUser.photoURL;
            } else {
                el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4f46e5&color=fff`;
            }
        });
    }

    updateRecentActivity() {
        const activityContainer = document.getElementById('recentActivity');
        if (!activityContainer) return;
        
        // Show placeholder message
        activityContainer.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-clock text-2xl mb-2"></i>
                <p>Chưa có hoạt động nào</p>
            </div>
        `;
    }

    initializeEventListeners() {
        // Quick action buttons
        const quickActions = document.querySelectorAll('[data-quick-action]');
        quickActions.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.quickAction;
                this.handleQuickAction(action);
            });
        });
        
        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }
    }

    handleQuickAction(action) {
        switch (action) {
            case 'ai-chat':
                window.location.href = 'ai-chat-new.html';
                break;
            case 'view-stats':
                this.showNotification('Chức năng thống kê đã được tắt', 'info');
                break;
            default:
                console.log('Unknown quick action:', action);
        }
    }

    showSettingsModal() {
        // Settings modal implementation
        console.log('Settings modal - to be implemented');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="notification-icon">
                    ${type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div class="flex-1">
                    <p>${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// Create global instance
const dashboard = new Dashboard();

// Export for external access
export { dashboard };