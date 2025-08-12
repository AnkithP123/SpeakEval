// Security configuration and environment utilities
// This module centralizes security-related configuration

class SecurityConfig {
  constructor() {
    this.isProduction = import.meta.env.MODE === 'production';
    this.enableConsoleLogging = import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true';
  }

  // Secure server URLs from environment
  getServerUrl() {
    return import.meta.env.VITE_SERVER_URL || 'https://www.server.speakeval.org';
  }

  getWebSocketUrl() {
    return import.meta.env.VITE_WEBSOCKET_URL || 'wss://www.server.speakeval.org/ws';
  }

  // Stripe configuration
  getStripePublishableKey() {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('SECURITY WARNING: Stripe publishable key not configured');
      throw new Error('Stripe configuration missing');
    }
    return key;
  }

  // Google OAuth configuration
  getGoogleClientId() {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  }

  // Input sanitization helper
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 1000); // Limit length
  }

  // Validate room code format
  validateRoomCode(code) {
    if (!code || typeof code !== 'string') return false;
    
    // Room codes should be alphanumeric, 8-12 characters
    const roomCodeRegex = /^[A-Za-z0-9]{8,12}$/;
    return roomCodeRegex.test(code);
  }

  // Validate participant name
  validateParticipantName(name) {
    if (!name || typeof name !== 'string') return false;
    
    // Names should be 1-50 characters, letters, numbers, spaces, hyphens
    const nameRegex = /^[A-Za-z0-9\s\-]{1,50}$/;
    return nameRegex.test(name.trim());
  }

  // Validate email format
  validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }
}

// Secure logging utility
class SecureLogger {
  constructor(securityConfig) {
    this.config = securityConfig;
  }

  // Safe console logging that respects environment settings
  log(message, data = null) {
    if (this.config.enableConsoleLogging) {
      if (data) {
        console.log(message, this._sanitizeLogData(data));
      } else {
        console.log(message);
      }
    }
  }

  error(message, error = null) {
    // Always log errors, but sanitize them
    if (error) {
      console.error(message, this._sanitizeError(error));
    } else {
      console.error(message);
    }
  }

  warn(message, data = null) {
    if (this.config.enableConsoleLogging) {
      if (data) {
        console.warn(message, this._sanitizeLogData(data));
      } else {
        console.warn(message);
      }
    }
  }

  // Sanitize log data to prevent exposure of sensitive information
  _sanitizeLogData(data) {
    if (!data) return data;
    
    const sensitiveKeys = ['token', 'password', 'secret', 'key', 'auth', 'credential'];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      for (const key in sanitized) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          if (typeof sanitized[key] === 'string' && sanitized[key].length > 8) {
            sanitized[key] = sanitized[key].substring(0, 8) + '...';
          } else {
            sanitized[key] = '[REDACTED]';
          }
        }
      }
      
      return sanitized;
    }
    
    if (typeof data === 'string') {
      // If it looks like a token (long string), truncate it
      if (data.length > 50) {
        return data.substring(0, 20) + '...';
      }
    }
    
    return data;
  }

  _sanitizeError(error) {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        // Don't log full stack traces in production
        stack: this.config.enableConsoleLogging ? error.stack : '[REDACTED]'
      };
    }
    return error;
  }
}

// Create singleton instances
const securityConfig = new SecurityConfig();
const logger = new SecureLogger(securityConfig);

export { securityConfig, logger };
export default securityConfig;