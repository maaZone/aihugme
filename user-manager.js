// user-manager.js
// User Management with Preferences & History

class UserManager {
    constructor() {
        this.userId = window.analyticsManager.userId;
        this.userData = this.loadUserData();
        this.init();
    }

    init() {
        this.setupUserPreferences();
        this.migrateOldData();
        this.updateUserActivity();
    }

    loadUserData() {
        const savedData = window.firebaseDB.getFromLocalStorage('user_data') || {};
        return {
            userId: this.userId,
            totalHugs: savedData.totalHugs || 0,
            favoriteHugType: savedData.favoriteHugType || '',
            soundEnabled: savedData.soundEnabled !== false,
            theme: savedData.theme || 'default',
            createdAt: savedData.createdAt || new Date(),
            lastActive: new Date(),
            ...savedData
        };
    }

    async saveUserData() {
        this.userData.lastActive = new Date();
        this.userData.totalHugs = this.userData.totalHugs || 0;

        // Save locally
        window.firebaseDB.saveToLocalStorage('user_data', this.userData);

        // Save to Firebase
        await window.firebaseDB.saveUserData(this.userId, this.userData);
    }

    setupUserPreferences() {
        // Load sound preference
        const soundEnabled = localStorage.getItem('aiSoundEnabled');
        if (soundEnabled !== null) {
            this.userData.soundEnabled = soundEnabled === 'true';
        }

        // Apply theme
        this.applyTheme(this.userData.theme);
    }

    applyTheme(theme) {
        const body = document.body;
        body.classList.remove('theme-default', 'theme-blue', 'theme-green', 'theme-purple', 'theme-dark');
        body.classList.add(`theme-${theme}`);
        this.userData.theme = theme;
        this.saveUserData();
    }

    // Hug Management
    async recordHug(hugData) {
        this.userData.totalHugs++;
        
        // Update favorite hug type
        const hugType = hugData.type || 'emotional';
        const typeCount = this.userData.hugTypeCount || {};
        typeCount[hugType] = (typeCount[hugType] || 0) + 1;
        this.userData.hugTypeCount = typeCount;

        // Update favorite
        const favorite = Object.keys(typeCount).reduce((a, b) => 
            typeCount[a] > typeCount[b] ? a : b
        );
        this.userData.favoriteHugType = favorite;

        await this.saveUserData();

        // Track in analytics
        window.analyticsManager.trackHugGenerated(hugType, {
            ...hugData,
            userTotalHugs: this.userData.totalHugs,
            favoriteHugType: favorite
        });
    }

    // User Preferences
    toggleSound() {
        this.userData.soundEnabled = !this.userData.soundEnabled;
        localStorage.setItem('aiSoundEnabled', this.userData.soundEnabled);
        this.saveUserData();
        return this.userData.soundEnabled;
    }

    setTheme(theme) {
        this.applyTheme(theme);
    }

    // User Statistics
    getUserStats() {
        return {
            totalHugs: this.userData.totalHugs || 0,
            favoriteHugType: this.userData.favoriteHugType || 'None yet',
            memberSince: new Date(this.userData.createdAt).toLocaleDateString(),
            soundEnabled: this.userData.soundEnabled,
            theme: this.userData.theme
        };
    }

    // Migration from old data format
    migrateOldData() {
        // Migrate from old localStorage format if exists
        const oldHugs = localStorage.getItem('aiHugMeUserData');
        if (oldHugs) {
            try {
                const oldData = JSON.parse(oldHugs);
                this.userData.totalHugs = oldData.personalHugs || 0;
                this.userData.viralScore = oldData.viralScore || 0;
                this.saveUserData();
                
                // Clear old data
                localStorage.removeItem('aiHugMeUserData');
            } catch (e) {
                console.warn('Migration failed:', e);
            }
        }
    }

    // Update user activity periodically
    updateUserActivity() {
        setInterval(() => {
            this.userData.lastActive = new Date();
            this.saveUserData();
        }, 30000); // Every 30 seconds
    }

    // Export user data
    exportUserData() {
        return {
            ...this.userData,
            hugHistory: window.firebaseDB.getFromLocalStorage('hugs') || [],
            sessionHistory: window.firebaseDB.getFromLocalStorage('analytics')?.filter(
                e => e.userId === this.userId
            ) || []
        };
    }

    // Clear user data
    async clearUserData() {
        this.userData = {
            userId: this.userId,
            totalHugs: 0,
            favoriteHugType: '',
            soundEnabled: true,
            theme: 'default',
            createdAt: new Date(),
            lastActive: new Date()
        };

        // Clear local storage
        localStorage.removeItem('aihug_user_data');
        localStorage.removeItem('aihug_hugs');
        localStorage.removeItem('aihug_analytics');
        localStorage.removeItem('aiSoundEnabled');

        await this.saveUserData();
        return true;
    }
}

// Initialize User Manager globally
window.userManager = new UserManager();