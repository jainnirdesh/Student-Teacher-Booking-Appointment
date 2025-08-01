import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-analytics.js";

// Set to false for real Firebase, true for demo mode
const demoMode = false;

const firebaseConfig = {
    apiKey: "AIzaSyDwjUW2Ozvgn7EvDN3iHYl709r7rcXNPE0",
    authDomain: "student-teacher-booking-2905.firebaseapp.com",
    projectId: "student-teacher-booking-2905",
    storageBucket: "student-teacher-booking-2905.firebasestorage.app",
    messagingSenderId: "249634709318",
    appId: "1:249634709318:web:7f32f02d2989a3816d0f47",
    measurementId: "G-8BZF5WL6QV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export {
    app,
    auth,
    db,
    analytics,
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
