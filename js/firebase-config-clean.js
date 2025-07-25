// Firebase configuration
// Set this to false to enable Firebase, true for demo mode
const demoMode = true;

console.log('🚫 Firebase disabled - Running in demo mode.');
console.log('📝 Set demoMode = false in firebase-config.js to enable Firebase.');

// Firebase project configuration (not used in demo mode)
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Mock Firebase services for demo mode
const auth = null;
const db = null;

// Mock Firebase functions
const mockFunction = () => Promise.resolve({ success: true });
const mockQuery = () => ({ empty: true, docs: [] });
const mockDoc = () => ({ id: 'mock-id', exists: () => false, data: () => ({}) });

const collection = mockQuery;
const doc = () => mockDoc();
const setDoc = mockFunction;
const getDoc = () => Promise.resolve(mockDoc());
const getDocs = () => Promise.resolve({ empty: true, docs: [] });
const addDoc = mockFunction;
const updateDoc = mockFunction;
const deleteDoc = mockFunction;
const query = mockQuery;
const where = () => {};
const orderBy = () => {};
const onSnapshot = () => () => {};
const limit = () => {};
const createUserWithEmailAndPassword = mockFunction;
const signInWithEmailAndPassword = mockFunction;
const signOut = mockFunction;
const onAuthStateChanged = (callback) => {
    // Call callback immediately with no user for demo mode
    setTimeout(() => callback(null), 100);
    return () => {}; // Return unsubscribe function
};

// Export everything
export { 
    auth, 
    db, 
    demoMode,
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
    onSnapshot,
    limit,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
};

// Demo data initialization (disabled in demo mode)
export async function initializeDemoData() {
    console.log('📱 Demo mode: Skipping Firebase demo data initialization');
    return Promise.resolve();
}

// Service Worker Registration for Notifications (disabled in demo mode)
export function initializeNotifications() {
    console.log('📱 Demo mode: Skipping notification initialization');
    return Promise.resolve();
}

export async function requestNotificationPermission() {
    console.log('📱 Demo mode: Skipping notification permission request');
    return Promise.resolve();
}
