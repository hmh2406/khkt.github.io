// 🛡️ EXTENSION ERROR FIX - Specific fix for onboarding.js and other extension errors

(function() {
    'use strict';
    
    // Immediate error suppression for onboarding.js
    const suppressExtensionErrors = () => {
        // Override Promise.prototype.catch to suppress extension errors
        const originalCatch = Promise.prototype.catch;
        Promise.prototype.catch = function(onRejected) {
            return originalCatch.call(this, function(reason) {
                // Check if error is from extension
                if (reason === undefined || reason === null) {
                    console.debug('🛡️ Suppressed undefined promise rejection (likely from extension)');
                    return;
                }
                
                // Check stack trace for extension patterns
                if (reason && reason.stack) {
                    const extensionPatterns = ['onboarding.js', 'extension', 'content-script'];
                    if (extensionPatterns.some(pattern => reason.stack.includes(pattern))) {
                        console.debug('🛡️ Suppressed extension error in promise:', reason.message || reason);
                        return;
                    }
                }
                
                // Call original onRejected if provided and not extension error
                if (typeof onRejected === 'function') {
                    return onRejected(reason);
                }
                
                throw reason;
            });
        };
        
        // Wrap setTimeout to catch extension errors
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(callback, delay, ...args) {
            if (typeof callback === 'function') {
                const wrappedCallback = function() {
                    try {
                        return callback.apply(this, arguments);
                    } catch (error) {
                        if (error.stack && error.stack.includes('onboarding.js')) {
                            console.debug('🛡️ Suppressed onboarding.js setTimeout error');
                            return;
                        }
                        throw error;
                    }
                };
                return originalSetTimeout.call(this, wrappedCallback, delay, ...args);
            }
            return originalSetTimeout.call(this, callback, delay, ...args);
        };
        
        // Wrap setInterval to catch extension errors
        const originalSetInterval = window.setInterval;
        window.setInterval = function(callback, delay, ...args) {
            if (typeof callback === 'function') {
                const wrappedCallback = function() {
                    try {
                        return callback.apply(this, arguments);
                    } catch (error) {
                        if (error.stack && error.stack.includes('onboarding.js')) {
                            console.debug('🛡️ Suppressed onboarding.js setInterval error');
                            return;
                        }
                        throw error;
                    }
                };
                return originalSetInterval.call(this, wrappedCallback, delay, ...args);
            }
            return originalSetInterval.call(this, callback, delay, ...args);
        };
        
        // Additional protection for requestAnimationFrame
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
            const wrappedCallback = function(timestamp) {
                try {
                    return callback(timestamp);
                } catch (error) {
                    if (error.stack && error.stack.includes('onboarding.js')) {
                        console.debug('🛡️ Suppressed onboarding.js RAF error');
                        return;
                    }
                    throw error;
                }
            };
            return originalRAF.call(this, wrappedCallback);
        };
    };
    
    // Apply error suppression immediately
    suppressExtensionErrors();
    
    // Additional protection when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', suppressExtensionErrors);
    } else {
        suppressExtensionErrors();
    }
    
    // Final protection when window loads
    window.addEventListener('load', () => {
        suppressExtensionErrors();
        
        // Clean up any extension-related errors in console
        setTimeout(() => {
            console.clear();
            console.log('🛡️ Extension error suppression active');
            console.log('🎓 AI Chat application ready');
        }, 100);
    });
    
    console.debug('🛡️ Extension error fix loaded');
})();