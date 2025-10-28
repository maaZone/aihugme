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
    },
    
    getOrCreateUserId: function() {
        let userId = localStorage.getItem('aihug_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('aihug_user_id', userId);
        }
        return userId;
    },
    
    loadUserData: function() {
        const stored = localStorage.getItem(`aihug_user_${this.userId}`);
        if (stored) {
            this.userData = JSON.parse(stored);
        } else {
            this.userData = {
                userId: this.userId,
                totalHugs: 0,
                favoriteHugType: null,
                soundEnabled: true,
                theme: 'default',
                hugHistory: [],
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };
            this.saveUserData();
        }
        return this.userData;
    },
    
    saveUserData: function() {
        if (this.userData) {
            this.userData.lastActive = new Date().toISOString();
            localStorage.setItem(`aihug_user_${this.userId}`, JSON.stringify(this.userData));
        }
    },
    
    recordHug: async function(hugData) {
        if (!this.userData) this.loadUserData();
        
        this.userData.totalHugs++;
        this.userData.hugHistory.unshift({
            ...hugData,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 hugs
        if (this.userData.hugHistory.length > 100) {
            this.userData.hugHistory = this.userData.hugHistory.slice(0, 100);
        }
        
        // Update favorite hug type
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
        this.saveUserData();
        
        return { success: true, hugCount: this.userData.totalHugs };
    },
    
    toggleSound: function() {
        if (!this.userData) this.loadUserData();
        this.userData.soundEnabled = !this.userData.soundEnabled;
        this.saveUserData();
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
    },
    
    getUserStats: function() {
        if (!this.userData) this.loadUserData();
        return {
            totalHugs: this.userData.totalHugs,
            favoriteHugType: this.userData.favoriteHugType,
            soundEnabled: this.userData.soundEnabled,
            theme: this.userData.theme,
            userId: this.userId
        };
    },
    
    exportUserData: function() {
        if (!this.userData) this.loadUserData();
        return {
            ...this.userData,
            exportDate: new Date().toISOString(),
            exportVersion: '1.0'
        };
    },
    
    clearUserData: async function() {
        localStorage.removeItem(`aihug_user_${this.userId}`);
        localStorage.removeItem('aihug_user_id');
        this.userData = null;
        this.userId = null;
        this.init(); // Create new user
        return { success: true };
    }
};

// Initialize user manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.userManager.init();
});