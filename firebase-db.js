// firebase-db.js
// Database Operations with Error Handling

class FirebaseDB {
    constructor() {
        this.db = window.firebaseApp?.getDB();
        this.collections = {
            USERS: 'users',
            HUGS: 'hugs',
            ANALYTICS: 'analytics',
            SETTINGS: 'settings'
        };
    }

    // User Data Management
    async saveUserData(userId, userData) {
        try {
            if (this.db) {
                await this.db.collection(this.collections.USERS)
                    .doc(userId)
                    .set({
                        ...userData,
                        lastActive: new Date(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                return { success: true };
            } else {
                // Fallback to localStorage
                this.saveToLocalStorage(`user_${userId}`, userData);
                return { success: true };
            }
        } catch (error) {
            console.error('Error saving user data:', error);
            return { success: false, error: error.message };
        }
    }

    // Hug Data Management
    async saveHugData(hugData) {
        try {
            const hugId = `hug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            if (this.db) {
                await this.db.collection(this.collections.HUGS)
                    .doc(hugId)
                    .set({
                        ...hugData,
                        id: hugId,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        userAgent: navigator.userAgent
                    });
                return { success: true, hugId };
            } else {
                // Fallback to localStorage
                const hugs = this.getFromLocalStorage('hugs') || [];
                hugs.push({ ...hugData, id: hugId, timestamp: new Date() });
                this.saveToLocalStorage('hugs', hugs);
                return { success: true, hugId };
            }
        } catch (error) {
            console.error('Error saving hug data:', error);
            return { success: false, error: error.message };
        }
    }

    // Analytics Tracking
    async trackEvent(eventType, eventData = {}) {
        try {
            const eventId = `event_${Date.now()}`;
            const analyticsData = {
                eventType,
                ...eventData,
                timestamp: new Date(),
                page: window.location.pathname,
                referrer: document.referrer
            };

            if (this.db) {
                await this.db.collection(this.collections.ANALYTICS)
                    .doc(eventId)
                    .set(analyticsData);
            } else {
                // Fallback to localStorage
                const events = this.getFromLocalStorage('analytics') || [];
                events.push(analyticsData);
                this.saveToLocalStorage('analytics', events);
                
                // Keep only last 100 events
                if (events.length > 100) {
                    events.splice(0, events.length - 100);
                    this.saveToLocalStorage('analytics', events);
                }
            }
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    }

    // Get Real-time Analytics
    subscribeToAnalytics(callback) {
        if (this.db) {
            return this.db.collection(this.collections.ANALYTICS)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .onSnapshot(snapshot => {
                    const analytics = [];
                    snapshot.forEach(doc => {
                        analytics.push({ id: doc.id, ...doc.data() });
                    });
                    callback(analytics);
                }, error => {
                    console.error('Analytics subscription error:', error);
                    // Fallback to localStorage
                    const localAnalytics = this.getFromLocalStorage('analytics') || [];
                    callback(localAnalytics.slice(-50));
                });
        } else {
            // Fallback to localStorage
            const localAnalytics = this.getFromLocalStorage('analytics') || [];
            callback(localAnalytics.slice(-50));
            return () => {}; // No-op unsubscribe function
        }
    }

    // Local Storage Fallback Methods
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(`aihug_${key}`, JSON.stringify(data));
        } catch (error) {
            console.warn('LocalStorage save failed:', error);
        }
    }

    getFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(`aihug_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('LocalStorage read failed:', error);
            return null;
        }
    }
}

// Initialize DB globally
window.firebaseDB = new FirebaseDB();