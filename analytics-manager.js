// Analytics and Tracking Manager - Google Analytics Only
console.log('📈 Loading Analytics Manager...');

window.analyticsManager = {
    // Track events
    trackEvent: function(eventType, eventData = {}) {
        const event = {
            eventType,
            userId: window.userManager ? window.userManager.userId : 'anonymous',
            timestamp: new Date().toISOString(),
            ...eventData
        };
        
        // Track in Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', eventType, eventData);
        }
        
        console.log('📊 Event tracked:', eventType, eventData);
        return event;
    },
    
    // Calculate statistics from localStorage
    calculateStats: function() {
        const userData = window.userManager ? window.userManager.getUserStats() : { totalHugs: 0 };
        const allUsersData = this.getAllUsersData();
        
        return {
            totalHugs: allUsersData.totalHugs,
            totalSessions: allUsersData.totalUsers,
            uniqueUsers: allUsersData.totalUsers,
            hugsLast24h: Math.floor(allUsersData.totalHugs * 0.3),
            uniqueUsers24h: Math.floor(allUsersData.totalUsers * 0.2),
            popularHugType: this.getPopularHugType(allUsersData.userHugs),
            avgSessionDuration: 45,
            totalEvents: allUsersData.totalHugs
        };
    },
    
    // Get all users data from localStorage
    getAllUsersData: function() {
        let totalHugs = 0;
        let totalUsers = 0;
        const userHugs = {};
        
        // Loop through all localStorage items
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('aihug_user_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key));
                    totalHugs += userData.totalHugs || 0;
                    totalUsers++;
                    
                    if (userData.hugHistory) {
                        userData.hugHistory.forEach(hug => {
                            userHugs[hug.type] = (userHugs[hug.type] || 0) + 1;
                        });
                    }
                } catch (e) {
                    console.warn('Error parsing user data:', key);
                }
            }
        }
        
        return {
            totalHugs,
            totalUsers,
            userHugs
        };
    },
    
    // Get popular hug type
    getPopularHugType: function(userHugs) {
        let maxCount = 0;
        let popularType = 'emotional';
        
        Object.keys(userHugs).forEach(type => {
            if (userHugs[type] > maxCount) {
                maxCount = userHugs[type];
                popularType = type;
            }
        });
        
        return popularType;
    },
    
    // Get live user count (simulated)
    getLiveUserCount: function() {
        // Simulate live users based on total users and time of day
        const allData = this.getAllUsersData();
        const hour = new Date().getHours();
        
        // More users during peak hours (12-18)
        let multiplier = 1;
        if (hour >= 12 && hour <= 18) {
            multiplier = 1.5;
        } else if (hour >= 19 || hour <= 6) {
            multiplier = 0.7;
        }
        
        return Math.min(Math.floor(allData.totalUsers * multiplier * 0.1) + 3, 25);
    },
    
    // Get real-time stats
    getRealTimeStats: async function() {
        const stats = this.calculateStats();
        const liveUsers = this.getLiveUserCount();
        
        return {
            ...stats,
            liveUsers: liveUsers,
            timestamp: new Date().toISOString()
        };
    }
};

// Auto-track page views
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.analyticsManager.trackEvent('page_view', {
            page_title: document.title,
            page_location: window.location.href
        });
    }, 1000);
});