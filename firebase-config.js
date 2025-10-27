// firebase-config.js
// Firebase Configuration with REAL Credentials

class FirebaseConfig {
    constructor() {
        this.config = {
            apiKey: "AIzaSyC20qaf-HgD5hXNr4N12P_ciLxqTHID5jg",
            authDomain: "websitetestings-a9a4e.firebaseapp.com",
            projectId: "websitetestings-a9a4e",
            storageBucket: "websitetestings-a9a4e.firebasestorage.app",
            messagingSenderId: "639135035451",
            appId: "1:639135035451:web:56743f056081a1590e6c1e",
            measurementId: "G-KTD42YBM3W"
        };
        this.isInitialized = false;
        this.init();
    }

    init() {
        try {
            // Check if Firebase is available
            if (typeof firebase === 'undefined' || !firebase.apps.length) {
                console.warn('Firebase SDK not loaded');
                this.loadFirebaseSDK();
                return;
            }
            
            // Initialize Firebase
            this.app = firebase.initializeApp(this.config);
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.isInitialized = true;
            
            console.log('✅ Firebase initialized successfully with Project: websitetestings-a9a4e');
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            this.handleFirebaseError(error);
        }
    }

    loadFirebaseSDK() {
        const firebaseScript = document.createElement('script');
        firebaseScript.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js';
        firebaseScript.onload = () => {
            const firestoreScript = document.createElement('script');
            firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js';
            firestoreScript.onload = () => {
                const authScript = document.createElement('script');
                authScript.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js';
                authScript.onload = () => this.init();
                document.head.appendChild(authScript);
            };
            document.head.appendChild(firestoreScript);
        };
        document.head.appendChild(firebaseScript);
    }

    handleFirebaseError(error) {
        // Fallback to localStorage if Firebase fails
        console.warn('Using localStorage fallback');
        this.isInitialized = false;
    }

    getDB() {
        return this.isInitialized ? this.db : null;
    }

    getAuth() {
        return this.isInitialized ? this.auth : null;
    }
}

// Initialize Firebase globally
window.firebaseApp = new FirebaseConfig();