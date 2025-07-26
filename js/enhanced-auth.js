// Enhanced Firebase Authentication for Students and Teachers
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
    updateDoc,
    query,
    where
} from './firebase-config.js';

import { logUserAction } from './logger-firebase.js';

// Admin credentials for demo purposes (in production, this should be environment variables)
const ADMIN_CREDENTIALS = {
    email: 'admin@edubook.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin'
};

export class EnhancedAuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.authStateListeners = [];
        this.setupAuthStateListener();
        this.initializeAdminIfNeeded();
    }

    // Initialize admin user in localStorage if not exists
    async initializeAdminIfNeeded() {
        const adminExists = localStorage.getItem('adminInitialized');
        if (!adminExists) {
            localStorage.setItem('adminData', JSON.stringify(ADMIN_CREDENTIALS));
            localStorage.setItem('adminInitialized', 'true');
            console.log('Admin account initialized');
        }
    }

    // Setup Firebase auth state listener
    setupAuthStateListener() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                this.userProfile = await this.getUserProfile(user.uid);
                
                if (this.userProfile) {
                    logUserAction(user.uid, 'AUTH_STATE_CHANGED', `User authenticated: ${this.userProfile.role}`);
                    this.notifyAuthStateChange(true);
                } else {
                    // If no profile found, sign out the user
                    await signOut(auth);
                }
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

    // Enhanced login function for Students and Teachers (Firebase) + Admin (Local)
    async login(email, password, userType) {
        try {
            // Special handling for admin login
            if (userType === 'admin') {
                return await this.loginAdmin(email, password);
            }

            // Firebase authentication for students and teachers
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Get user profile from Firestore
            const userProfile = await this.getUserProfile(user.uid);
            
            if (!userProfile) {
                throw new Error('User profile not found. Please contact administrator.');
            }

            // Verify user type matches
            if (userType && userProfile.role !== userType) {
                await signOut(auth);
                throw new Error(`Invalid login credentials for ${userType} account.`);
            }

            // Check if account is approved (for teachers)
            if (userProfile.role === 'teacher' && !userProfile.approved) {
                await signOut(auth);
                throw new Error('Your teacher account is pending approval. Please contact the administrator.');
            }

            logUserAction(user.uid, 'LOGIN_SUCCESS', `${userProfile.role} logged in successfully`);
            
            return { 
                success: true, 
                user: userProfile,
                message: `Welcome back, ${userProfile.name}!`
            };

        } catch (error) {
            console.error('Login error:', error);
            logUserAction(null, 'LOGIN_FAILED', `Failed login attempt for ${email}: ${error.message}`);
            throw new Error(this.getErrorMessage(error.code) || error.message);
        }
    }

    // Admin login using local storage (for demo purposes)
    async loginAdmin(email, password) {
        try {
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            
            if (adminData.email === email && adminData.password === password) {
                // Create a mock user object for admin
                const adminUser = {
                    uid: 'admin-uid',
                    email: adminData.email,
                    name: adminData.name,
                    role: adminData.role,
                    isAdmin: true
                };

                // Store admin session
                localStorage.setItem('adminSession', JSON.stringify(adminUser));
                this.userProfile = adminUser;
                
                logUserAction('admin-uid', 'ADMIN_LOGIN_SUCCESS', 'Admin logged in successfully');
                
                return {
                    success: true,
                    user: adminUser,
                    message: 'Admin login successful!'
                };
            } else {
                throw new Error('Invalid admin credentials');
            }
        } catch (error) {
            logUserAction(null, 'ADMIN_LOGIN_FAILED', `Failed admin login: ${error.message}`);
            throw new Error('Invalid admin credentials');
        }
    }

    // Enhanced registration for Students and Teachers
    async register(userData) {
        try {
            const { email, password, name, role, department, subject, phone } = userData;

            // Prevent admin registration through this method
            if (role === 'admin') {
                throw new Error('Admin accounts cannot be created through registration.');
            }

            // Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create detailed user profile in Firestore
            const userProfile = {
                uid: user.uid,
                email: email,
                name: name,
                role: role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                approved: role === 'student' ? true : false, // Students auto-approved, teachers need approval
                active: true,
                lastLogin: null,
                phone: phone || '',
                
                // Role-specific fields
                ...(role === 'teacher' && {
                    department: department || '',
                    subject: subject || '',
                    availableHours: [],
                    appointmentCount: 0
                }),
                
                ...(role === 'student' && {
                    enrollmentNumber: this.generateEnrollmentNumber(),
                    appointmentHistory: [],
                    preferredSubjects: []
                })
            };

            // Save to Firestore
            await setDoc(doc(db, 'users', user.uid), userProfile);

            // Create additional role-specific collections
            if (role === 'teacher') {
                await setDoc(doc(db, 'teachers', user.uid), {
                    uid: user.uid,
                    availability: {
                        monday: [],
                        tuesday: [],
                        wednesday: [],
                        thursday: [],
                        friday: [],
                        saturday: [],
                        sunday: []
                    },
                    bio: '',
                    rating: 0,
                    totalAppointments: 0,
                    specializations: []
                });
            } else if (role === 'student') {
                await setDoc(doc(db, 'students', user.uid), {
                    uid: user.uid,
                    academicInfo: {
                        year: '',
                        branch: '',
                        semester: ''
                    },
                    preferences: {
                        notifications: true,
                        emailUpdates: true
                    }
                });
            }

            logUserAction(user.uid, 'REGISTRATION_SUCCESS', `New ${role} registered: ${email}`);

            // Auto-logout after registration (they need to login)
            await signOut(auth);

            return {
                success: true,
                message: role === 'teacher' 
                    ? 'Registration successful! Your account is pending approval from the administrator.'
                    : 'Registration successful! You can now login with your credentials.',
                requiresApproval: role === 'teacher'
            };

        } catch (error) {
            console.error('Registration error:', error);
            logUserAction(null, 'REGISTRATION_FAILED', `Failed registration: ${error.message}`);
            throw new Error(this.getErrorMessage(error.code) || error.message);
        }
    }

    // Logout function
    async logout() {
        try {
            const currentUser = this.getCurrentUser();
            
            if (currentUser?.isAdmin) {
                // Admin logout
                localStorage.removeItem('adminSession');
                this.userProfile = null;
                logUserAction('admin-uid', 'ADMIN_LOGOUT', 'Admin logged out');
            } else {
                // Firebase logout
                await signOut(auth);
                logUserAction(currentUser?.uid, 'LOGOUT', 'User logged out');
            }

            return { success: true, message: 'Logged out successfully!' };
        } catch (error) {
            console.error('Logout error:', error);
            throw new Error('Failed to logout');
        }
    }

    // Get current user
    getCurrentUser() {
        // Check for admin session first
        const adminSession = localStorage.getItem('adminSession');
        if (adminSession) {
            return JSON.parse(adminSession);
        }
        
        // Return Firebase user with profile
        return this.userProfile;
    }

    // Get user profile from Firestore
    async getUserProfile(uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return { id: userDoc.id, ...userDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getCurrentUser();
    }

    // Check user role
    hasRole(role) {
        const user = this.getCurrentUser();
        return user?.role === role;
    }

    // Admin functions
    async approveTeacher(teacherId) {
        try {
            await updateDoc(doc(db, 'users', teacherId), {
                approved: true,
                updatedAt: new Date().toISOString()
            });

            logUserAction(this.getCurrentUser()?.uid, 'TEACHER_APPROVED', `Teacher ${teacherId} approved`);
            return { success: true, message: 'Teacher approved successfully!' };
        } catch (error) {
            console.error('Error approving teacher:', error);
            throw new Error('Failed to approve teacher');
        }
    }

    async rejectTeacher(teacherId) {
        try {
            await updateDoc(doc(db, 'users', teacherId), {
                approved: false,
                active: false,
                updatedAt: new Date().toISOString()
            });

            logUserAction(this.getCurrentUser()?.uid, 'TEACHER_REJECTED', `Teacher ${teacherId} rejected`);
            return { success: true, message: 'Teacher application rejected' };
        } catch (error) {
            console.error('Error rejecting teacher:', error);
            throw new Error('Failed to reject teacher');
        }
    }

    // Get all teachers for admin
    async getAllTeachers() {
        try {
            const teachersQuery = query(
                collection(db, 'users'),
                where('role', '==', 'teacher')
            );
            const snapshot = await getDocs(teachersQuery);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting teachers:', error);
            throw new Error('Failed to fetch teachers');
        }
    }

    // Get all students for admin
    async getAllStudents() {
        try {
            const studentsQuery = query(
                collection(db, 'users'),
                where('role', '==', 'student')
            );
            const snapshot = await getDocs(studentsQuery);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting students:', error);
            throw new Error('Failed to fetch students');
        }
    }

    // Utility functions
    generateEnrollmentNumber() {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `STU${year}${random}`;
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };
        return errorMessages[errorCode];
    }
}

// Create singleton instance
export const enhancedAuthManager = new EnhancedAuthManager();

// Export convenience functions
export const login = (email, password, userType) => enhancedAuthManager.login(email, password, userType);
export const register = (userData) => enhancedAuthManager.register(userData);
export const logout = () => enhancedAuthManager.logout();
export const getCurrentUser = () => enhancedAuthManager.getCurrentUser();
export const isAuthenticated = () => enhancedAuthManager.isAuthenticated();
export const hasRole = (role) => enhancedAuthManager.hasRole(role);

// Admin functions
export const approveTeacher = (teacherId) => enhancedAuthManager.approveTeacher(teacherId);
export const rejectTeacher = (teacherId) => enhancedAuthManager.rejectTeacher(teacherId);
export const getAllTeachers = () => enhancedAuthManager.getAllTeachers();
export const getAllStudents = () => enhancedAuthManager.getAllStudents();
