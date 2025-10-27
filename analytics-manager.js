// analytics-manager.js
// Advanced Analytics with Real-time Tracking

class AnalyticsManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.pageStartTime = Date.now();
        this.init();
    }

    init() {
        this.trackPageView();
        this.setupEventListeners();
        this.trackSessionStart();
    }

    generateSessionId() {
        let sessionId = localStorage.getItem('aihug_session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('aihug_session_id', sessionId);
        }
        return sessionId;
    }

    getUserId() {
        let userId = localStorage.getItem('aihug_user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('aihug_user_id', userId);
        }
        return userId;
    }

    // Page View Tracking
    trackPageView() {
        const pageData = {
            page: window.location.pathname,
            title: document.title,
            referrer: document.referrer,
            screen: `${screen.width}x${screen.height}`,
            language: navigator.language,
            userAgent: navigator.userAgent.substring(0, 100)
        };

        window.firebaseDB.trackEvent('page_view', pageData);
    }

    // Hug Event Tracking
    trackHugGenerated(hugType, hugData) {
        const hugEvent = {
            hugType,
            ...hugData,
            sessionId: this.sessionId,
            userId: this.userId,
            pageLoadTime: Date.now() - this.pageStartTime
        };

        window.firebaseDB.trackEvent('hug_generated', hugEvent);
        
        // Also save to hugs collection
        window.firebaseDB.saveHugData(hugEvent);
    }

    // User Engagement Tracking
    trackUserEngagement(action, data = {}) {
        const engagementData = {
            action,
            ...data,
            sessionId: this.sessionId,
            userId: this.userId,
            timestamp: new Date()
        };

        window.firebaseDB.trackEvent('user_engagement', engagementData);
    }

    // Ad Interaction Tracking
    trackAdInteraction(adType, action, adData = {}) {
        const adEvent = {
            adType,
            action,
            ...adData,
            sessionId: this.sessionId,
            userId: this.userId
        };

        window.firebaseDB.trackEvent('ad_interaction', adEvent);
    }

    // Error Tracking
    trackError(errorType, errorMessage, component = '') {
        const errorData = {
            errorType,
            errorMessage,
            component,
            sessionId: this.sessionId,
            userId: this.userId,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        window.firebaseDB.trackEvent('error_occurred', errorData);
    }

    // Setup Event Listeners
    setupEventListeners() {
        // Track clicks
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.matches('button, a, [role="button"]')) {
                this.trackUserEngagement('click', {
                    element: target.tagName,
                    text: target.textContent?.substring(0, 50),
                    id: target.id || target.className
                });
            }
        });

        // Track errors
        window.addEventListener('error', (e) => {
            this.trackError('window_error', e.message, e.filename);
        });

        // Track beforeunload (session end)
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });
    }

    trackSessionStart() {
        const sessionData = {
            sessionId: this.sessionId,
            userId: this.userId,
            startTime: new Date(),
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        window.firebaseDB.trackEvent('session_start', sessionData);
    }

    trackSessionEnd() {
        const sessionDuration = Date.now() - this.pageStartTime;
        const sessionData = {
            sessionId: this.sessionId,
            userId: this.userId,
            endTime: new Date(),
            duration: sessionDuration
        };

        // Use sendBeacon for reliable session end tracking
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(sessionData)], { type: 'application/json' });
            navigator.sendBeacon('/api/track-session-end', blob);
        }

        window.firebaseDB.trackEvent('session_end', sessionData);
    }

    // Get Real-time Stats
    async getRealTimeStats() {
        return new Promise((resolve) => {
            window.firebaseDB.subscribeToAnalytics((analytics) => {
                const stats = this.calculateStats(analytics);
                resolve(stats);
            });
        });
    }

    calculateStats(analytics) {
        const now = new Date();
        const last24Hours = analytics.filter(event => 
            new Date(event.timestamp) > new Date(now - 24 * 60 * 60 * 1000)
        );

        const hugs = last24Hours.filter(e => e.eventType === 'hug_generated');
        const sessions = last24Hours.filter(e => e.eventType === 'session_start');
        const uniqueUsers = [...new Set(last24Hours.map(e => e.userId))];

        return {
            totalHugs: hugs.length,
            totalSessions: sessions.length,
            uniqueUsers: uniqueUsers.length,
            hugsLast24h: hugs.length,
            popularHugType: this.getPopularHugType(hugs),
            avgSessionDuration: this.calculateAvgSessionDuration(analytics)
        };
    }

    getPopularHugType(hugs) {
        const types = hugs.reduce((acc, hug) => {
            acc[hug.hugType] = (acc[hug.hugType] || 0) + 1;
            return acc;
        }, {});

        return Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b, 'emotional');
    }

    calculateAvgSessionDuration(analytics) {
        const sessions = analytics.filter(e => e.eventType === 'session_end');
        if (sessions.length === 0) return 0;

        const totalDuration = sessions.reduce((sum, session) => 
            sum + (session.duration || 0), 0
        );
        
        return Math.round(totalDuration / sessions.length / 1000); // in seconds
    }
}

// Initialize Analytics globally
window.analyticsManager = new AnalyticsManager();