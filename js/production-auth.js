/**
 * Production Authentication System
 * Real Firebase authentication for Student-Teacher Booking System
 */

import { 
    auth, 
    db, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    collection,
    doc,
    setDoc,
    getDoc
} from './firebase-config.js';

class ProductionAuth {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.init();
    }

    init() {
        // Listen for authentication state changes
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.handleAuthenticatedUser(user);
            } else {
                this.handleUnauthenticatedUser();
            }
        });
    }

    async handleAuthenticatedUser(user) {
        this.currentUser = user;
        
        try {
            // Get user role from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.userRole = userData.role;
                this.redirectToRoleDashboard(userData.role);
            } else {
                console.error('User document not found in Firestore');
                this.signOut();
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            this.showError('Error loading user data. Please try again.');
        }
    }

    handleUnauthenticatedUser() {
        this.currentUser = null;
        this.userRole = null;
        
        // Only redirect if not on main page
        if (!window.location.pathname.includes('index.html') && 
            !window.location.pathname.endsWith('/')) {
            window.location.href = '../index.html';
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Get user role
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                return { success: true, user: user, role: userData.role };
            } else {
                throw new Error('User profile not found');
            }
        } catch (error) {
            console.error('Sign-in error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async signUp(email, password, userData) {
        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user profile in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                name: userData.name,
                role: userData.role,
                department: userData.department || '',
                subject: userData.subject || '',
                createdAt: new Date(),
                isApproved: userData.role === 'student' ? true : false // Teachers need admin approval
            });

            return { success: true, user: user, needsApproval: userData.role === 'teacher' };
        } catch (error) {
            console.error('Sign-up error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async signOut() {
        try {
            await signOut(auth);
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Sign-out error:', error);
        }
    }

    redirectToRoleDashboard(role) {
        const currentPath = window.location.pathname;
        const expectedPath = `dashboards/${role}-dashboard.html`;
        
        if (!currentPath.includes(expectedPath)) {
            window.location.href = expectedPath;
        }
    }

    getErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/user-not-found':
                return 'No user found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/invalid-email':
                return 'Invalid email address.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            default:
                return 'An error occurred. Please try again.';
        }
    }

    showError(message) {
        // Show error notification
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    showSuccess(message) {
        // Show success notification
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserRole() {
        return this.userRole;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Create global instance
const productionAuth = new ProductionAuth();

// Export for use in other modules
export default productionAuth;

// Also make it available globally
window.productionAuth = productionAuth;
