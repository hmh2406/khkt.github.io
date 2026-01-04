// 🎓 PHẦN MỀM HỖ TRỢ HỌC TẬP CHỦ ĐỘNG - Authentication Module

import { auth, db } from './firebase.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Authentication state management
let currentUser = null;
let isRedirecting = false; // Prevent redirect loops

// Initialize authentication state listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (!isRedirecting) {
        handleAuthStateChange(user);
    }
});

// Handle authentication state changes
function handleAuthStateChange(user) {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Prevent redirect loops
    if (isRedirecting) {
        console.log('🔄 Already redirecting, skipping...');
        return;
    }
    
    if (user) {
        console.log('👤 User authenticated:', user.email);
        
        // Only redirect to dashboard if currently on login page
        if (currentPage === 'index.html' || currentPage === 'login.html') {
            console.log('🔄 Redirecting to dashboard...');
            isRedirecting = true;
            window.location.href = 'dashboard.html';
            return; // Exit early to prevent further execution
        }
        
        // Update UI with user info (for other pages)
        updateUserUI(user);
        
        // Start session tracking
        if (window.startSessionTracking) {
            window.startSessionTracking();
        }
    } else {
        console.log('👤 User not authenticated');
        
        // Only redirect to login if not already on login page
        if (currentPage !== 'index.html' && currentPage !== 'login.html') {
            console.log('🔄 Redirecting to login...');
            isRedirecting = true;
            window.location.href = 'index.html';
        }
    }
}

// Update UI with user information
function updateUserUI(user) {
    const userNameElements = document.querySelectorAll('[data-user-name]');
    const userEmailElements = document.querySelectorAll('[data-user-email]');
    
    const displayName = user.displayName || user.email.split('@')[0] || 'Học sinh';
    
    userNameElements.forEach(el => {
        el.textContent = displayName;
    });
    
    userEmailElements.forEach(el => {
        el.textContent = user.email;
    });
}

// Login with email and password
export async function loginWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Login successful:', userCredential.user.email);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('❌ Login error:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// Register with email and password
export async function registerWithEmail(email, password, displayName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user profile to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: displayName || user.email.split('@')[0],
            createdAt: new Date().toISOString(),
            role: 'student'
        });

        console.log('✅ Registration successful:', user.email);
        return { success: true, user };
    } catch (error) {
        console.error('❌ Registration error:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// Login with Google
export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user profile exists, create if not
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                createdAt: new Date().toISOString(),
                role: 'student'
            });
        }

        console.log('✅ Google login successful:', user.email);
        return { success: true, user };
    } catch (error) {
        console.error('❌ Google login error:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// Logout
export async function logout() {
    try {
        await signOut(auth);
        console.log('✅ Logout successful');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('❌ Logout error:', error);
        // Force redirect even if logout fails
        window.location.href = 'index.html';
    }
}

// Get user-friendly error messages
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
        'auth/wrong-password': 'Mật khẩu không đúng.',
        'auth/email-already-in-use': 'Email này đã được sử dụng.',
        'auth/weak-password': 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.',
        'auth/invalid-email': 'Email không hợp lệ.',
        'auth/popup-closed-by-user': 'Đăng nhập bị hủy.',
        'auth/network-request-failed': 'Lỗi kết nối mạng. Vui lòng thử lại.',
        'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng đợi một chút.',
        'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa.',
        'auth/invalid-credential': 'Thông tin đăng nhập không hợp lệ.'
    };
    
    return errorMessages[errorCode] || 'Có lỗi xảy ra. Vui lòng thử lại.';
}

// Initialize auth UI event listeners
export function initAuthUI() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            showLoading(true);
            const result = await loginWithEmail(email, password);
            showLoading(false);
            
            if (!result.success) {
                showError(result.error);
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const displayName = document.getElementById('regName').value;
            
            showLoading(true);
            const result = await registerWithEmail(email, password, displayName);
            showLoading(false);
            
            if (!result.success) {
                showError(result.error);
            }
        });
    }

    // Google login button
    const googleLoginBtn = document.getElementById('googleLogin');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            showLoading(true);
            const result = await loginWithGoogle();
            showLoading(false);
            
            if (!result.success) {
                showError(result.error);
            }
        });
    }

    // Logout buttons
    const logoutBtns = document.querySelectorAll('[data-logout]');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', logout);
    });

    // Form toggle buttons
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    
    if (showRegisterBtn && showLoginBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms('register');
        });
        
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms('login');
        });
    }
}

// Toggle between login and register forms
function toggleForms(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginToggle = document.getElementById('loginToggle');
    const registerToggle = document.getElementById('registerToggle');
    
    if (mode === 'register') {
        loginForm?.classList.add('hidden');
        registerForm?.classList.remove('hidden');
        loginToggle?.classList.add('hidden');
        registerToggle?.classList.remove('hidden');
    } else {
        registerForm?.classList.add('hidden');
        loginForm?.classList.remove('hidden');
        registerToggle?.classList.add('hidden');
        loginToggle?.classList.remove('hidden');
    }
}

// Show loading state
function showLoading(show) {
    const loadingElements = document.querySelectorAll('[data-loading]');
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    
    loadingElements.forEach(el => {
        el.style.display = show ? 'block' : 'none';
    });
    
    submitButtons.forEach(btn => {
        btn.disabled = show;
        btn.textContent = show ? 'Đang xử lý...' : btn.dataset.originalText || btn.textContent;
        if (!btn.dataset.originalText) {
            btn.dataset.originalText = btn.textContent;
        }
    });
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    } else {
        alert(message);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthUI);
} else {
    initAuthUI();
}