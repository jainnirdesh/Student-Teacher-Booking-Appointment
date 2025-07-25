// Firebase Authentication Module
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
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot
} from './firebase-config.js';

import { logUserAction } from './logger-firebase.js';

// Authentication state management
export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.authStateListeners = [];
        this.setupAuthStateListener();
    }

    // Setup Firebase auth state listener
    setupAuthStateListener() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                this.userProfile = await this.getUserProfile(user.uid);
                this.notifyAuthStateChange(true);
            } else {
                this.currentUser = null;
                this.userProfile = null;
                this.notifyAuthStateChange(false);
            }
        });
    }

    // Add auth state listener
    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
    }

    // Notify all listeners of auth state change
    notifyAuthStateChange(isAuthenticated) {
        this.authStateListeners.forEach(callback => {
            callback(isAuthenticated, this.userProfile);
        });
    }

    // Login function
    async login(email, password) {
        try {
            // Real Firebase authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Get user profile from Firestore
            const userProfile = await this.getUserProfile(user.uid);
            
            if (!userProfile) {
                throw new Error('User profile not found');
            }

            // Removed approval check
            logUserAction(user.uid, 'LOGIN', `User ${email} logged in`);
            return { success: true, role: userProfile.role };

        } catch (error) {
            console.error('Login error:', error);
            logUserAction(null, 'LOGIN_FAILED', `Failed login attempt for ${email}: ${error.message}`);
            throw new Error(error.message || 'Login failed');
        }
    }

    // Register new user
    async register(userData) {
        try {
            const { email, password, name, role, ...additionalData } = userData;

            // Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user profile in Firestore
            const userProfile = {
                uid: user.uid,
                email: email,
                name: name,
                role: role,
                approved: true, // Auto-approve all users
                createdAt: new Date().toISOString(),
                lastLogin: null,
                ...additionalData
            };

            await setDoc(doc(db, 'users', user.uid), userProfile);

            logUserAction(user.uid, 'REGISTER', `New ${role} registered: ${email}`);

            return { success: true, message: 'Registration successful' };

        } catch (error) {
            console.error('Registration error:', error);
            logUserAction(null, 'REGISTER_FAILED', `Registration failed for ${userData.email}: ${error.message}`);
            throw new Error(error.message || 'Registration failed');
        }
    }

    // Get user profile from Firestore
    async getUserProfile(uid) {
        try {
            // Removed demo user/session logic
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    // Update user profile
    async updateUserProfile(uid, updates) {
        try {
            await updateDoc(doc(db, 'users', uid), {
                ...updates,
                updatedAt: new Date().toISOString()
            });

            // Update local profile
            if (this.currentUser && this.currentUser.uid === uid) {
                this.userProfile = { ...this.userProfile, ...updates };
            }

            logUserAction(uid, 'PROFILE_UPDATE', 'Profile updated');
            return { success: true };
        } catch (error) {
            console.error('Error updating profile:', error);
            throw new Error('Failed to update profile');
        }
    }

    // Logout
    async logout() {
        try {
            // Removed demo user/session logic
            if (this.currentUser) {
                logUserAction(this.currentUser.uid, 'LOGOUT', 'User logged out');
            }
            await signOut(auth);
            this.currentUser = null;
            this.userProfile = null;
            return { success: true };
        } catch (error) {
            console.error('Error logging out:', error);
            throw new Error('Logout failed');
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get current user profile
    getCurrentUserProfile() {
        return this.userProfile;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Check user role
    hasRole(role) {
        return this.userProfile && this.userProfile.role === role;
    }

    // Get all users (admin only)
    async getAllUsers() {
        try {
            if (!this.hasRole('admin')) {
                throw new Error('Unauthorized access');
            }

            const usersSnapshot = await getDocs(collection(db, 'users'));
            return usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting users:', error);
            throw new Error('Failed to get users');
        }
    }

    // Approve/reject user (admin only)
    async updateUserApproval(userId, approved) {
        try {
            if (!this.hasRole('admin')) {
                throw new Error('Unauthorized access');
            }

            await updateDoc(doc(db, 'users', userId), {
                approved: approved,
                approvedAt: approved ? new Date().toISOString() : null,
                approvedBy: this.currentUser.uid
            });

            logUserAction(this.currentUser.uid, 'USER_APPROVAL', 
                `User ${userId} ${approved ? 'approved' : 'rejected'}`);

            return { success: true };
        } catch (error) {
            console.error('Error updating user approval:', error);
            throw new Error('Failed to update user approval');
        }
    }

    // Get teachers list
    async getTeachers() {
        try {
            const teachersQuery = query(
                collection(db, 'users'),
                where('role', '==', 'teacher'),
                where('approved', '==', true)
            );
            const teachersSnapshot = await getDocs(teachersQuery);
            return teachersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting teachers:', error);
            return [];
        }
    }

    // Get students list
    async getStudents() {
        try {
            const studentsQuery = query(
                collection(db, 'users'),
                where('role', '==', 'student'),
                where('approved', '==', true)
            );
            const studentsSnapshot = await getDocs(studentsQuery);
            return studentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting students:', error);
            return [];
        }
    }
}

// Export singleton instance
export const authManager = new AuthManager();

// Export convenience functions
export const login = (email, password) => authManager.login(email, password);
export const register = (userData) => authManager.register(userData);
export const logout = () => authManager.logout();
export const getCurrentUser = () => authManager.getCurrentUser();
export const getCurrentUserProfile = () => authManager.getCurrentUserProfile();
export const isAuthenticated = () => authManager.isAuthenticated();
export const hasRole = (role) => authManager.hasRole(role);
