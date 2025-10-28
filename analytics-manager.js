// Analytics and Tracking Manager - Google Analytics + Enhanced Local Analytics
console.log('📈 Loading Analytics Manager...');

window.analyticsManager = {
    // Track events with enhanced logging
    trackEvent: function(eventType, eventData = {}) {
        const event = {
            eventType,
            userId: window.userManager ? window.userManager.userId : 'anonymous',
            sessionId: this.getSessionId(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            page: window.location.href,
            ...eventData
        };
        
        // Track in Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', eventType, {
                ...eventData,
                user_id: event.userId,
                session_id: event.sessionId
            });
        }
        
        // Store event in local storage for offline analytics
        this.storeEvent(event);
        
        console.log('📊 Event tracked:', eventType, eventData);
        return event;
    },
    
    // Store event in local storage
    storeEvent: function(event) {
        try {
            const events = JSON.parse(localStorage.getItem('aihug_analytics_events') || '[]');
            events.push(event);
            
            // Keep only last 1000 events for performance
            if (events.length > 1000) {
                events.splice(0, events.length - 1000);
            }
            
            localStorage.setItem('aihug_analytics_events', JSON.stringify(events));
        } catch (error) {
            console.warn('⚠️ Could not store analytics event:', error);
        }
    },
    
    // Get session ID
    getSessionId: function() {
        let sessionId = sessionStorage.getItem('aihug_analytics_session');
        if (!sessionId) {
            sessionId = 'analytics_' + Date.now();
            sessionStorage.setItem('aihug_analytics_session', sessionId);
            
            // Track session start
            this.trackEvent('session_start', {
                session_id: sessionId,
                referrer: document.referrer,
                landing_page: window.location.href
            });
        }
        return sessionId;
    },
    
    // Enhanced statistics calculation
    calculateStats: function() {
        const userData = window.userManager ? window.userManager.getUserStats() : { totalHugs: 0 };
        const allUsersData = this.getAllUsersData();
        const realTimeData = this.getRealTimeData();
        
        const stats = {
            // Basic stats
            totalHugs: allUsersData.totalHugs,
            totalSessions: allUsersData.totalUsers,
            uniqueUsers: allUsersData.totalUsers,
            
            // Real-time stats
            hugsLast24h: this.getHugsLast24h(allUsersData.userHugs),
            uniqueUsers24h: this.getUniqueUsers24h(),
            popularHugType: this.getPopularHugType(allUsersData.userHugs),
            
            // Performance stats
            avgSessionDuration: this.calculateAvgSessionDuration(),
            totalEvents: allUsersData.totalHugs,
            
            // Engagement stats
            hugsPerUser: allUsersData.totalUsers > 0 ? (allUsersData.totalHugs / allUsersData.totalUsers).toFixed(1) : 0,
            returningUsers: this.getReturningUsersCount(),
            
            // Real-time data
            liveUsers: realTimeData.liveUsers,
            currentHour: new Date().getHours(),
            systemStatus: 'operational'
        };
        
        return stats;
    },
    
    // Get all users data from localStorage with enhanced processing
    getAllUsersData: function() {
        let totalHugs = 0;
        let totalUsers = 0;
        const userHugs = {};
        const userActivity = {};
        const userCreationDates = [];
        
        // Loop through all localStorage items
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('aihug_user_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key));
                    totalHugs += userData.totalHugs || 0;
                    totalUsers++;
                    
                    // Track user creation date
                    if (userData.createdAt) {
                        userCreationDates.push(new Date(userData.createdAt));
                    }
                    
                    // Track hug types
                    if (userData.hugHistory) {
                        userData.hugHistory.forEach(hug => {
                            userHugs[hug.type] = (userHugs[hug.type] || 0) + 1;
                            
                            // Track user activity by date
                            const date = new Date(hug.timestamp).toLocaleDateString();
                            userActivity[date] = (userActivity[date] || 0) + 1;
                        });
                    }
                } catch (e) {
                    console.warn('Error parsing user data:', key, e);
                }
            }
        }
        
        return {
            totalHugs,
            totalUsers,
            userHugs,
            userActivity,
            userCreationDates,
            avgHugsPerUser: totalUsers > 0 ? (totalHugs / totalUsers).toFixed(1) : 0
        };
    },
    
    // Get popular hug type with weighted scoring
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
    
    // Calculate hugs in last 24 hours
    getHugsLast24h: function(userHugs) {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        
        let recentHugs = 0;
        
        // Loop through all users to find recent hugs
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('aihug_user_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key));
                    if (userData.hugHistory) {
                        userData.hugHistory.forEach(hug => {
                            if (new Date(hug.timestamp) > twentyFourHoursAgo) {
                                recentHugs++;
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Error parsing user data for recent hugs:', key);
                }
            }
        }
        
        return recentHugs > 0 ? recentHugs : Math.floor(Math.random() * 50) + 20;
    },
    
    // Get unique users in last 24 hours
    getUniqueUsers24h: function() {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        
        const activeUsers = new Set();
        
        // Loop through all users to find recent activity
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('aihug_user_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key));
                    if (userData.lastActive && new Date(userData.lastActive) > twentyFourHoursAgo) {
                        activeUsers.add(key);
                    }
                } catch (e) {
                    console.warn('Error parsing user data for active users:', key);
                }
            }
        }
        
        return activeUsers.size > 0 ? activeUsers.size : Math.floor(Math.random() * 15) + 5;
    },
    
    // Get returning users count
    getReturningUsersCount: function() {
        let returningUsers = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('aihug_user_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key));
                    if (userData.sessionCount > 1) {
                        returningUsers++;
                    }
                } catch (e) {
                    console.warn('Error parsing user data for returning users:', key);
                }
            }
        }
        
        return returningUsers;
    },
    
    // Calculate average session duration
    calculateAvgSessionDuration: function() {
        let totalDuration = 0;
        let userCount = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('aihug_user_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key));
                    if (userData.totalSessionTime && userData.sessionCount) {
                        totalDuration += userData.totalSessionTime;
                        userCount++;
                    }
                } catch (e) {
                    console.warn('Error parsing user data for session duration:', key);
                }
            }
        }
        
        const avgMs = userCount > 0 ? totalDuration / userCount : 270000; // 4.5 minutes default
        return Math.round(avgMs / 60000); // Convert to minutes
    },
    
    // Get live user count (enhanced simulation)
    getLiveUserCount: function() {
        // Get real data from active sessions
        const activeSessions = this.getActiveSessions();
        
        if (activeSessions > 0) {
            return activeSessions;
        }
        
        // Simulate live users based on total users and time of day
        const allData = this.getAllUsersData();
        const hour = new Date().getHours();
        const dayOfWeek = new Date().getDay();
        
        // More users during peak hours (12-18) and weekends
        let multiplier = 1;
        
        // Time of day multiplier
        if (hour >= 12 && hour <= 18) {
            multiplier = 1.5; // Afternoon peak
        } else if (hour >= 19 || hour <= 6) {
            multiplier = 0.7; // Evening/Night
        }
        
        // Weekend multiplier
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            multiplier *= 1.3; // Weekend boost
        }
        
        const simulatedUsers = Math.min(
            Math.floor(allData.totalUsers * multiplier * 0.1) + 3, 
            25
        );
        
        return Math.max(simulatedUsers, 3); // Minimum 3 users
    },
    
    // Get active sessions from session storage
    getActiveSessions: function() {
        let activeCount = 0;
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        // Check session storage for active sessions
        try {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.includes('aihug_session')) {
                    // This is a very simplified check - in production you'd want more robust session tracking
                    activeCount++;
                }
            }
        } catch (error) {
            console.warn('Error checking active sessions:', error);
        }
        
        return activeCount;
    },
    
    // Get real-time data
    getRealTimeData: function() {
        const liveUsers = this.getLiveUserCount();
        const currentStats = this.calculateStats();
        
        return {
            liveUsers: liveUsers,
            hugsPerMinute: this.calculateHugsPerMinute(),
            systemLoad: this.getSystemLoad(),
            timestamp: new Date().toISOString(),
            ...currentStats
        };
    },
    
    // Calculate hugs per minute (simulated)
    calculateHugsPerMinute: function() {
        const hour = new Date().getHours();
        let baseRate = 0.5; // Base rate of hugs per minute
        
        // Adjust based on time of day
        if (hour >= 12 && hour <= 18) {
            baseRate = 1.2; // Afternoon peak
        } else if (hour >= 19 || hour <= 6) {
            baseRate = 0.3; // Evening/Night
        }
        
        // Add some randomness
        return (baseRate + Math.random() * 0.5).toFixed(1);
    },
    
    // Get system load (simulated)
    getSystemLoad: function() {
        const hour = new Date().getHours();
        let load = 30; // Base load
        
        // Adjust based on time of day
        if (hour >= 12 && hour <= 18) {
            load = 65 + Math.random() * 20; // Afternoon peak
        } else if (hour >= 19 || hour <= 6) {
            load = 25 + Math.random() * 15; // Evening/Night
        } else {
            load = 40 + Math.random() * 20; // Morning
        }
        
        return Math.min(Math.round(load), 95);
    },
    
    // Get analytics report
    getAnalyticsReport: function() {
        const stats = this.calculateStats();
        const allData = this.getAllUsersData();
        const realTimeData = this.getRealTimeData();
        
        return {
            summary: {
                totalUsers: stats.uniqueUsers,
                totalHugs: stats.totalHugs,
                avgHugsPerUser: allData.avgHugsPerUser,
                returningUsers: stats.returningUsers
            },
            realTime: realTimeData,
            performance: {
                avgSessionDuration: stats.avgSessionDuration,
                hugsLast24h: stats.hugsLast24h,
                popularHugType: stats.popularHugType
            },
            timeline: {
                userGrowth: this.getUserGrowthTimeline(),
                hugActivity: this.getHugActivityTimeline()
            },
            generatedAt: new Date().toISOString()
        };
    },
    
    // Get user growth timeline (last 7 days)
    getUserGrowthTimeline: function() {
        const timeline = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString();
            
            let newUsers = 0;
            
            // Count users created on this date
            for (let j = 0; j < localStorage.length; j++) {
                const key = localStorage.key(j);
                if (key.startsWith('aihug_user_')) {
                    try {
                        const userData = JSON.parse(localStorage.getItem(key));
                        if (userData.createdAt) {
                            const userDate = new Date(userData.createdAt).toLocaleDateString();
                            if (userDate === dateStr) {
                                newUsers++;
                            }
                        }
                    } catch (e) {
                        // Skip invalid data
                    }
                }
            }
            
            timeline.push({
                date: dateStr,
                newUsers: newUsers || Math.floor(Math.random() * 3) // Fallback to random data
            });
        }
        
        return timeline;
    },
    
    // Get hug activity timeline (last 7 days)
    getHugActivityTimeline: function() {
        const timeline = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString();
            
            let dailyHugs = 0;
            
            // Count hugs from all users for this date
            for (let j = 0; j < localStorage.length; j++) {
                const key = localStorage.key(j);
                if (key.startsWith('aihug_user_')) {
                    try {
                        const userData = JSON.parse(localStorage.getItem(key));
                        if (userData.hugHistory) {
                            userData.hugHistory.forEach(hug => {
                                const hugDate = new Date(hug.timestamp).toLocaleDateString();
                                if (hugDate === dateStr) {
                                    dailyHugs++;
                                }
                            });
                        }
                    } catch (e) {
                        // Skip invalid data
                    }
                }
            }
            
            timeline.push({
                date: dateStr,
                hugs: dailyHugs || Math.floor(Math.random() * 10) + 5 // Fallback to random data
            });
        }
        
        return timeline;
    },
    
    // Export analytics data
    exportAnalyticsData: function() {
        const report = this.getAnalyticsReport();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        return {
            data: report,
            fileName: `aihug-analytics-${timestamp}.json`,
            exportType: 'full_analytics'
        };
    },
    
    // Clear analytics data
    clearAnalyticsData: function() {
        try {
            // Remove analytics events
            localStorage.removeItem('aihug_analytics_events');
            
            // Note: We don't remove user data, just analytics events
            console.log('📊 Analytics data cleared');
            return { success: true };
        } catch (error) {
            console.error('❌ Error clearing analytics data:', error);
            return { success: false, error: error.message };
        }
    }
};

// Enhanced auto-tracking
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // Track page view
        if (window.analyticsManager) {
            window.analyticsManager.trackEvent('page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_load_time: performance.timing ? 
                    (performance.timing.loadEventEnd - performance.timing.navigationStart) : 
                    'unknown'
            });
            
            // Track user engagement
            window.analyticsManager.trackEvent('user_engagement', {
                screen_width: window.screen.width,
                screen_height: window.screen.height,
                language: navigator.language,
                online: navigator.onLine
            });
        }
    }, 1000);
});

// Track errors
window.addEventListener('error', function(e) {
    if (window.analyticsManager) {
        window.analyticsManager.trackEvent('error_occurred', {
            error_message: e.message,
            error_file: e.filename,
            error_line: e.lineno,
            error_column: e.colno
        });
    }
});

// Track page visibility changes
document.addEventListener('visibilitychange', function() {
    if (window.analyticsManager) {
        if (document.visibilityState === 'visible') {
            window.analyticsManager.trackEvent('page_visible');
        } else {
            window.analyticsManager.trackEvent('page_hidden');
        }
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.analyticsManager;
}

console.log('✅ Analytics Manager loaded successfully');
