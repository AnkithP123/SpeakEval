/**
 * Cookie utility functions
 * Handles both httpOnly cookies (set by server) and regular cookies
 */

export const cookieUtils = {
  /**
   * Get a cookie value by name
   */
  getCookie: (name) => {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  },

  /**
   * Set a cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} days - Expiration in days (default: 30)
   * @param {object} options - Additional options (path, domain, secure, sameSite)
   */
  setCookie: (name, value, days = 30, options = {}) => {
    if (typeof document === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    
    const cookieOptions = {
      expires: expires.toUTCString(),
      path: options.path || '/',
      ...(options.domain && { domain: options.domain }),
      ...(options.secure && { secure: true }),
      ...(options.sameSite && { sameSite: options.sameSite }),
    };

    const cookieString = Object.entries(cookieOptions)
      .map(([key, val]) => `${key}=${val}`)
      .join('; ');

    document.cookie = `${name}=${value}; ${cookieString}`;
  },

  /**
   * Delete a cookie
   */
  deleteCookie: (name, options = {}) => {
    if (typeof document === 'undefined') return;
    
    const cookieOptions = {
      expires: 'Thu, 01 Jan 1970 00:00:00 UTC',
      path: options.path || '/',
      ...(options.domain && { domain: options.domain }),
    };

    const cookieString = Object.entries(cookieOptions)
      .map(([key, val]) => `${key}=${val}`)
      .join('; ');

    document.cookie = `${name}=; ${cookieString}`;
  },

  /**
   * Check if cookies are available (not in SSR)
   */
  isAvailable: () => typeof document !== 'undefined',
};

