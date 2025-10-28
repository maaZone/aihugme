// User Management System - Local Storage Only
console.log('👤 Loading User Manager...');

window.userManager = {
    userData: null,
    userId: null,
    
    init: function() {
        this.userId = this.getOrCreateUserId();
        this.loadUserData();
        console.log('✅ User Manager initialized for user:', this.userId);
        
        // Apply saved theme
        if (this.userData.theme && this.userData.theme !== 'default') {
            document.body.classList.add(`theme-${this.userData.theme}`);
        }
        
        // Update UI with user stats
        this.updateUI();
        
        return this.userData;
    },
    
    getOrCreateUserId: function() {
        let userId = localStorage.getItem('aihug_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('aihug_user_id', userId);
            console.log('🆕 New user created:', userId);
        }
        return userId;
    },
    
    loadUserData: function() {
        const stored = localStorage.getItem(`aihug_user_${this.userId}`);
        if (stored) {
            try {
                this.userData = JSON.parse(stored);
                console.log('📂 User data loaded:', this.userData.totalHugs + ' hugs');
            } catch (e) {
                console.warn('⚠️ Error parsing user data, creating new:', e);
                this.createNewUserData();
            }
        } else {
            this.createNewUserData();
        }
        return this.userData;
    },
    
    createNewUserData: function() {
        this.userData = {
            userId: this.userId,
            totalHugs: 0,
            favoriteHugType: null,
            soundEnabled: true,
            theme: 'default',
            hugHistory: [],
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            sessionCount: 1,
            totalSessionTime: 0,
            lastHugDate: null
        };
        this.saveUserData();
        console.log('🆕 New user data created');
    },
    
    saveUserData: function() {
        if (this.userData) {
            this.userData.lastActive = new Date().toISOString();
            this.userData.lastUpdated = new Date().toISOString();
            
            try {
                localStorage.setItem(`aihug_user_${this.userId}`, JSON.stringify(this.userData));
                console.log('💾 User data saved');
            } catch (e) {
                console.error('❌ Error saving user data:', e);
            }
        }
    },
    
    recordHug: async function(hugData) {
        if (!this.userData) this.loadUserData();
        
        console.log('🤗 Recording hug:', hugData.type);
        
        this.userData.totalHugs++;
        this.userData.lastHugDate = new Date().toISOString();
        
        const hugRecord = {
            ...hugData,
            id: 'hug_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId()
        };
        
        this.userData.hugHistory.unshift(hugRecord);
        
        // Keep only last 100 hugs for performance
        if (this.userData.hugHistory.length > 100) {
            this.userData.hugHistory = this.userData.hugHistory.slice(0, 100);
        }
        
        // Update favorite hug type
        this.updateFavoriteHugType();
        
        this.saveUserData();
        this.updateUI();
        
        return { 
            success: true, 
            hugCount: this.userData.totalHugs,
            hugId: hugRecord.id
        };
    },
    
    updateFavoriteHugType: function() {
        const hugCounts = {};
        this.userData.hugHistory.forEach(hug => {
            hugCounts[hug.type] = (hugCounts[hug.type] || 0) + 1;
        });
        
        let maxCount = 0;
        let favoriteType = null;
        Object.keys(hugCounts).forEach(type => {
            if (hugCounts[type] > maxCount) {
                maxCount = hugCounts[type];
                favoriteType = type;
            }
        });
        
        this.userData.favoriteHugType = favoriteType;
    },
    
    getSessionId: function() {
        let sessionId = sessionStorage.getItem('aihug_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now();
            sessionStorage.setItem('aihug_session_id', sessionId);
            
            // Increment session count
            if (this.userData) {
                this.userData.sessionCount = (this.userData.sessionCount || 0) + 1;
            }
        }
        return sessionId;
    },
    
    toggleSound: function() {
        if (!this.userData) this.loadUserData();
        this.userData.soundEnabled = !this.userData.soundEnabled;
        this.saveUserData();
        
        console.log('🔊 Sound toggled:', this.userData.soundEnabled ? 'ON' : 'OFF');
        return this.userData.soundEnabled;
    },
    
    setTheme: function(theme) {
        if (!this.userData) this.loadUserData();
        this.userData.theme = theme;
        this.saveUserData();
        
        // Apply theme to document
        document.body.className = '';
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
        
        console.log('🎨 Theme changed to:', theme);
    },
    
    getUserStats: function() {
        if (!this.userData) this.loadUserData();
        return {
            userId: this.userId,
            totalHugs: this.userData.totalHugs || 0,
            favoriteHugType: this.userData.favoriteHugType || 'None yet',
            soundEnabled: this.userData.soundEnabled !== false, // default to true
            theme: this.userData.theme || 'default',
            sessionCount: this.userData.sessionCount || 1,
            memberSince: this.userData.createdAt ? new Date(this.userData.createdAt).toLocaleDateString() : 'Today',
            lastActive: this.userData.lastActive ? new Date(this.userData.lastActive).toLocaleDateString() : 'Now'
        };
    },
    
    getHugHistory: function(limit = 10) {
        if (!this.userData) this.loadUserData();
        return this.userData.hugHistory.slice(0, limit);
    },
    
    getHugStats: function() {
        if (!this.userData) this.loadUserData();
        
        const stats = {
            total: this.userData.totalHugs || 0,
            byType: {},
            byDay: {},
            recentActivity: []
        };
        
        // Count hugs by type
        this.userData.hugHistory.forEach(hug => {
            stats.byType[hug.type] = (stats.byType[hug.type] || 0) + 1;
            
            // Count by day
            const day = new Date(hug.timestamp).toLocaleDateString();
            stats.byDay[day] = (stats.byDay[day] || 0) + 1;
        });
        
        // Get recent activity (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        stats.recentActivity = this.userData.hugHistory
            .filter(hug => new Date(hug.timestamp) > oneWeekAgo)
            .slice(0, 20);
        
        return stats;
    },
    
    exportUserData: function() {
        if (!this.userData) this.loadUserData();
        
        const exportData = {
            ...this.userData,
            exportDate: new Date().toISOString(),
            exportVersion: '2.0',
            hugStats: this.getHugStats(),
            summary: {
                totalHugs: this.userData.totalHugs,
                favoriteHugType: this.userData.favoriteHugType,
                memberSince: this.userData.createdAt,
                sessions: this.userData.sessionCount
            }
        };
        
        console.log('📤 User data exported');
        return exportData;
    },
    
    clearUserData: async function() {
        const userId = this.userId;
        
        try {
            localStorage.removeItem(`aihug_user_${userId}`);
            localStorage.removeItem('aihug_user_id');
            sessionStorage.removeItem('aihug_session_id');
            
            this.userData = null;
            this.userId = null;
            
            // Reinitialize with new user
            this.init();
            
            console.log('🗑️ User data cleared and new user created');
            return { success: true, newUserId: this.userId };
        } catch (error) {
            console.error('❌ Error clearing user data:', error);
            return { success: false, error: error.message };
        }
    },
    
    updateUI: function() {
        // Update any UI elements that display user stats
        try {
            const stats = this.getUserStats();
            
            // Update user stats in hug display
            const userHugCount = document.getElementById('userHugCount');
            const userFavoriteHug = document.getElementById('userFavoriteHug');
            const totalShares = document.getElementById('totalShares');
            const viralScore = document.getElementById('viralScore');
            
            if (userHugCount) userHugCount.textContent = stats.totalHugs;
            if (userFavoriteHug) userFavoriteHug.textContent = stats.favoriteHugType;
            if (totalShares) totalShares.textContent = stats.totalHugs;
            if (viralScore) viralScore.textContent = (stats.totalHugs * 10);
            
        } catch (error) {
            console.warn('⚠️ Error updating UI:', error);
        }
    },
    
    // Analytics integration
    getAnalyticsData: function() {
        if (!this.userData) this.loadUserData();
        
        return {
            userId: this.userId,
            totalHugs: this.userData.totalHugs,
            sessionCount: this.userData.sessionCount,
            favoriteHugType: this.userData.favoriteHugType,
            memberSince: this.userData.createdAt,
            lastActive: this.userData.lastActive
        };
    },
    
    // Session management
    updateSessionTime: function() {
        if (!this.userData) this.loadUserData();
        
        const sessionStart = sessionStorage.getItem('aihug_session_start');
        if (sessionStart) {
            const sessionDuration = Date.now() - parseInt(sessionStart);
            this.userData.totalSessionTime = (this.userData.totalSessionTime || 0) + sessionDuration;
            this.saveUserData();
        }
        
        // Start new session timer
        sessionStorage.setItem('aihug_session_start', Date.now().toString());
    }
};

// Enhanced initialization with error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Initializing User Manager...');
        const userData = window.userManager.init();
        
        // Start session timer
        window.userManager.updateSessionTime();
        
        // Update session time every minute
        setInterval(() => {
            window.userManager.updateSessionTime();
        }, 60000);
        
        console.log('✅ User Manager fully initialized:', userData);
        
    } catch (error) {
        console.error('❌ User Manager initialization failed:', error);
        
        // Fallback: Create basic user data
        window.userManager.userData = {
            userId: 'fallback_user',
            totalHugs: 0,
            favoriteHugType: null,
            soundEnabled: true,
            theme: 'default'
        };
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.userManager;
}
