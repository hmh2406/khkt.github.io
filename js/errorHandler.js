// 🛡️ GLOBAL ERROR HANDLER - Enhanced Browser Extension Error Suppression

// List of known browser extension files and patterns that cause errors
const EXTENSION_PATTERNS = [
    'onboarding.js',
    'extension',
    'chrome-extension',
    'moz-extension',
    'safari-extension',
    'edge-extension',
    'content-script',
    'inject',
    'contentscript',
    'background',
    'popup',
    'options'
];

// Enhanced error suppression for JavaScript errors
window.addEventListener('error', function(e) {
    // Check if error is from browser extension by filename
    if (e.filename && EXTENSION_PATTERNS.some(pattern => e.filename.includes(pattern))) {
        console.debug('🛡️ Suppressed browser extension error:', e.filename, e.message);
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
    
    // Check if error message contains extension-related keywords
    if (e.message && EXTENSION_PATTERNS.some(pattern => e.message.toLowerCase().includes(pattern.toLowerCase()))) {
        console.debug('🛡️ Suppressed extension-related error:', e.message);
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
    
    // Check stack trace for extension patterns
    if (e.error && e.error.stack && EXTENSION_PATTERNS.some(pattern => e.error.stack.includes(pattern))) {
        console.debug('🛡️ Suppressed extension error from stack:', e.error.stack);
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
    
    // Log legitimate errors for debugging
    if (e.filename && !e.filename.includes('extension')) {
        console.warn('⚠️ Legitimate error detected:', {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno
        });
    }
}, true);

// Enhanced unhandled promise rejection suppression
window.addEventListener('unhandledrejection', function(e) {
    // Suppress undefined promise rejections (very common in extensions)
    if (e.reason === undefined || e.reason === null) {
        console.debug('🛡️ Suppressed undefined/null promise rejection from extension');
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
    
    // Check if rejection reason is a string with extension keywords
    if (typeof e.reason === 'string' && 
        EXTENSION_PATTERNS.some(pattern => e.reason.toLowerCase().includes(pattern.toLowerCase()))) {
        console.debug('🛡️ Suppressed extension promise rejection:', e.reason);
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
    
    // Check if rejection reason is an Error object with extension-related stack
    if (e.reason && e.reason.stack && 
        EXTENSION_PATTERNS.some(pattern => e.reason.stack.includes(pattern))) {
        console.debug('🛡️ Suppressed extension error in promise:', e.reason.message || e.reason);
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
    
    // Check if rejection comes from extension context
    if (e.reason && e.reason.toString && 
        EXTENSION_PATTERNS.some(pattern => e.reason.toString().includes(pattern))) {
        console.debug('🛡️ Suppressed extension-related promise rejection');
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
    
    // Log legitimate promise rejections for debugging
    if (e.reason && typeof e.reason === 'object' && e.reason.stack && 
        !EXTENSION_PATTERNS.some(pattern => e.reason.stack.includes(pattern))) {
        console.warn('⚠️ Legitimate promise rejection:', e.reason);
    }
}, true);

// Enhanced console error filtering
const originalConsoleError = console.error;
console.error = function(...args) {
    // Check if any argument contains extension-related keywords
    const hasExtensionKeyword = args.some(arg => {
        if (typeof arg === 'string') {
            return EXTENSION_PATTERNS.some(pattern => 
                arg.toLowerCase().includes(pattern.toLowerCase())
            );
        }
        if (arg && arg.stack && typeof arg.stack === 'string') {
            return EXTENSION_PATTERNS.some(pattern => arg.stack.includes(pattern));
        }
        return false;
    });
    
    if (hasExtensionKeyword) {
        console.debug('🛡️ Suppressed extension console error:', ...args);
        return;
    }
    
    // Call original console.error for legitimate errors
    originalConsoleError.apply(console, args);
};

// Specific handler for onboarding.js errors
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (typeof listener === 'function') {
        const wrappedListener = function(event) {
            try {
                return listener.call(this, event);
            } catch (error) {
                // Check if error is from onboarding.js or similar extension files
                if (error.stack && error.stack.includes('onboarding.js')) {
                    console.debug('🛡️ Suppressed onboarding.js error:', error.message);
                    return;
                }
                throw error;
            }
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
};

// Additional protection for fetch/XHR errors from extensions
const originalFetch = window.fetch;
window.fetch = function(...args) {
    return originalFetch.apply(this, args).catch(error => {
        // Check if fetch error is from extension
        if (error.stack && EXTENSION_PATTERNS.some(pattern => error.stack.includes(pattern))) {
            console.debug('🛡️ Suppressed extension fetch error:', error.message);
            return Promise.reject(new Error('Extension fetch error suppressed'));
        }
        throw error;
    });
};

// Suppress specific onboarding.js errors
window.addEventListener('load', function() {
    // Wait a bit for extensions to load, then suppress any remaining errors
    setTimeout(() => {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.src && script.src.includes('onboarding.js')) {
                console.debug('🛡️ Detected onboarding.js script, errors will be suppressed');
            }
        });
    }, 1000);
});

console.log('🛡️ Enhanced global error handler initialized');
console.log('🛡️ Browser extension errors (including onboarding.js) will be suppressed');

export { EXTENSION_PATTERNS };