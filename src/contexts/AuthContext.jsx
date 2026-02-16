import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { cookieUtils } from '../utils/cookieUtils';

const AuthContext = createContext(null);

// Cache for token verification results
const VERIFICATION_CACHE_KEY = 'auth_verification_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get verification cache from localStorage
 */
const getVerificationCache = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(VERIFICATION_CACHE_KEY);
    if (!cached) return null;
    const { token, result, timestamp } = JSON.parse(cached);
    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_DURATION) {
      return { token, result };
    }
    // Cache expired, remove it
    localStorage.removeItem(VERIFICATION_CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading verification cache:', error);
    return null;
  }
};

/**
 * Set verification cache in localStorage
 */
const setVerificationCache = (token, result) => {
  if (typeof window === 'undefined') return;
  try {
    const cache = {
      token,
      result,
      timestamp: Date.now(),
    };
    localStorage.setItem(VERIFICATION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error setting verification cache:', error);
  }
};

/**
 * Clear verification cache
 */
const clearVerificationCache = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VERIFICATION_CACHE_KEY);
};

/**
 * Check if JWT token is expired client-side
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired, false if valid
 */
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    
    // Check if token has expiration
    if (decoded.exp) {
      // exp is in seconds, Date.now() is in milliseconds
      const expirationTime = decoded.exp * 1000;
      const now = Date.now();
      
      // Add 5 minute buffer to account for clock skew
      const buffer = 5 * 60 * 1000;
      
      return now >= (expirationTime - buffer);
    }
    
    // No expiration means token doesn't expire (uncommon but possible)
    return false;
  } catch (error) {
    console.error('Error decoding token:', error);
    // If we can't decode, assume expired
    return true;
  }
};

/**
 * Get token from multiple sources (cookies, localStorage)
 * Priority: httpOnly cookie > regular cookie > localStorage
 */
const getTokenFromStorage = () => {
  if (typeof window === 'undefined') return null;
  
  // Try httpOnly cookie first (set by server, not accessible via JS but we check if it exists via API)
  // For now, we'll use regular cookies and localStorage
  // Server can set httpOnly cookie and we'll detect it via API calls
  
  // Try regular cookie
  const cookieToken = cookieUtils.getCookie('auth_token') || cookieUtils.getCookie('token');
  
  // Try localStorage
  const localToken = localStorage.getItem('token') || localStorage.getItem('classroom_token');
  
  // Prefer cookie over localStorage (more secure)
  return cookieToken || localToken;
};

/**
 * Set token in multiple storage locations
 */
const setTokenInStorage = (token) => {
  if (typeof window === 'undefined') return;
  
  if (token) {
    // Set in cookie (7 days expiration)
    cookieUtils.setCookie('auth_token', token, 7, {
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
    });
    
    // Also set in localStorage as fallback
    localStorage.setItem('token', token);
  } else {
    // Clear from both
    cookieUtils.deleteCookie('auth_token');
    cookieUtils.deleteCookie('token');
    localStorage.removeItem('token');
    localStorage.removeItem('classroom_token');
  }
};

/**
 * Centralized authentication context provider
 * 
 * Industry standard approach with:
 * 1. Client-side expiration checking (no server call if expired)
 * 2. Caching of verification results (reduces server load)
 * 3. Cookie support (httpOnly cookies from server + regular cookies)
 * 4. Synchronous token initialization (immediate availability)
 * 5. Loading state while verifying (prevents race conditions)
 */
export const AuthProvider = ({ children }) => {
  // Initialize token synchronously from storage (no async needed)
  const [token, setTokenState] = useState(() => getTokenFromStorage());

  const [username, setUsernameState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('username') || null;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCoTeacher, setIsCoTeacher] = useState(false);
  const [userType, setUserType] = useState(null); // 'teacher' | 'student' | null
  const verificationInProgress = useRef(false);

  // Update storage when token changes
  const setToken = (newToken) => {
    setTokenState(newToken);
    setTokenInStorage(newToken);
    // Clear cache when token changes
    clearVerificationCache();
  };

  const setUsername = (newUsername) => {
    setUsernameState(newUsername);
    if (newUsername) {
      localStorage.setItem('username', newUsername);
    } else {
      localStorage.removeItem('username');
    }
  };

  // Verify token on mount and when token changes
  useEffect(() => {
    const verifyToken = async () => {
      // Prevent concurrent verifications
      if (verificationInProgress.current) return;
      
      if (!token) {
        setIsAuthenticated(false);
        setIsCoTeacher(false);
        setUserType(null);
        setIsLoading(false);
        return;
      }

      // Step 1: Check client-side expiration first (fast, no server call)
      if (isTokenExpired(token)) {
        console.log('Token expired (client-side check)');
        setToken(null);
        setUsername(null);
        setIsAuthenticated(false);
        setIsCoTeacher(false);
        setUserType(null);
        setIsLoading(false);
        clearVerificationCache();
        return;
      }

      // Step 2: Check cache
      const cached = getVerificationCache();
      if (cached && cached.token === token) {
        console.log('Using cached verification result');
        setIsAuthenticated(cached.result.isValid);
        if (cached.result.username) {
          setUsername(cached.result.username);
        }
        setIsCoTeacher(!!cached.result.isCoTeacher);
        setUserType(cached.result.userType || null);
        setIsLoading(false);
        return;
      }

      // Step 3: Verify with server (only if not expired and not cached)
      verificationInProgress.current = true;
      try {
        const response = await fetch(
          `https://www.server.speakeval.org/expired-token?token=${token}`
        );
        const data = await response.json();

        if (data.expired) {
          // Token expired - clear auth state
          setToken(null);
          setUsername(null);
          setIsAuthenticated(false);
          setIsCoTeacher(false);
          setUserType(null);
          clearVerificationCache();
        } else {
          // Token is valid - cache the result
          const isCoTeacherVal = !!data.decoded?.isCoTeacher;
          const userTypeVal = data.decoded?.userType || null;
          const cacheResult = {
            isValid: true,
            username: data.decoded?.username,
            isCoTeacher: isCoTeacherVal,
            userType: userTypeVal,
          };
          setVerificationCache(token, cacheResult);
          
          setIsAuthenticated(true);
          if (data.decoded?.username) {
            setUsername(data.decoded.username);
          }
          setIsCoTeacher(isCoTeacherVal);
          setUserType(userTypeVal);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        // On error, check if we can decode the token client-side
        // If we can decode it and it's not expired, assume valid
        // (might be network issue)
        try {
          const decoded = jwtDecode(token);
          if (decoded && !isTokenExpired(token)) {
            // Token looks valid client-side, assume authenticated
            setIsAuthenticated(true);
            if (decoded.username) {
              setUsername(decoded.username);
            }
            setIsCoTeacher(!!decoded.isCoTeacher);
            setUserType(decoded.userType || null);
          } else {
            setIsAuthenticated(false);
            setIsCoTeacher(false);
            setUserType(null);
          }
        } catch (decodeError) {
          setIsAuthenticated(false);
          setIsCoTeacher(false);
          setUserType(null);
        }
      } finally {
        setIsLoading(false);
        verificationInProgress.current = false;
      }
    };

    verifyToken();
  }, [token]);

  // Logout function
  const logout = async () => {
    // Clear all authentication state
    setToken(null);
    setUsername(null);
    setIsAuthenticated(false);
    setIsCoTeacher(false);
    setUserType(null);
    clearVerificationCache();
    
    // Clear all localStorage items related to authentication
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('classroom_token');
    localStorage.removeItem('username');
    localStorage.removeItem('pin');
    localStorage.removeItem('gold');
    localStorage.removeItem('ultimate');
    localStorage.removeItem('classroom_user');
    localStorage.removeItem('speakeval_student_token');
    localStorage.removeItem('speakeval_room_session');
    
    // Clear all cookies (try all possible cookie names)
    cookieUtils.deleteCookie('auth_token', { path: '/' });
    cookieUtils.deleteCookie('token', { path: '/' });
    cookieUtils.deleteCookie('classroom_token', { path: '/' });
    
    // Try to clear httpOnly cookies via server endpoint
    try {
      await fetch('https://www.server.speakeval.org/logout', {
        method: 'POST',
        credentials: 'include', // Important: include cookies in request
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // If server endpoint doesn't exist or fails, continue with client-side cleanup
      console.log('Server logout endpoint not available, continuing with client-side cleanup');
    }
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('userUpdated'));
  };

  // Periodically check token expiration (every minute)
  useEffect(() => {
    if (!token) return;

    const checkExpiration = () => {
      if (isTokenExpired(token)) {
        console.log('Token expired during periodic check');
        setToken(null);
        setUsername(null);
        setIsAuthenticated(false);
        setIsCoTeacher(false);
        setUserType(null);
        clearVerificationCache();
      }
    };

    // Check immediately
    checkExpiration();

    // Then check every minute
    const interval = setInterval(checkExpiration, 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      username,
      isAuthenticated,
      isLoading,
      isCoTeacher,
      userType,
      setToken,
      setUsername,
      logout,
    }),
    [token, username, isAuthenticated, isLoading, isCoTeacher, userType]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
