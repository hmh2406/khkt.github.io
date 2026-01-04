// 🎓 PHẦN MỀM HỖ TRỢ HỌC TẬP CHỦ ĐỘNG - Firebase Configuration

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC27pJ9r-BKyZ7_UPs4a6pf8JEOa2PKH2E",
  authDomain: "khkt-hmh.firebaseapp.com",
  projectId: "khkt-hmh",
  storageBucket: "khkt-hmh.firebasestorage.app",
  messagingSenderId: "705311623212",
  appId: "1:705311623212:web:267164e13b784f33f2a989",
  measurementId: "G-322BM8YNKW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('🔥 Firebase initialized successfully');