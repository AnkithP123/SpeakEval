# Security Guidelines for SpeakEval

## Overview

This document outlines security measures implemented in the SpeakEval application and provides guidelines for maintaining security standards.

## Security Improvements Implemented

### 1. Environment Configuration
- **Issue**: Hardcoded API keys and server URLs exposed in source code
- **Solution**: Created environment variable system
- **Files**: `.env.example`, `.env`, `src/utils/securityConfig.js`
- **Impact**: Sensitive configuration now managed through environment variables

### 2. Secure Logging System
- **Issue**: 239+ console.log statements exposing sensitive data like tokens
- **Solution**: Implemented SecureLogger with data sanitization
- **Features**:
  - Automatically redacts sensitive fields (tokens, passwords, secrets)
  - Configurable based on environment (disabled in production)
  - Truncates long strings that might be tokens
- **Usage**: Import `logger` from `securityConfig.js` instead of using `console.log`

### 3. Input Validation and Sanitization
- **Issue**: No client-side input validation
- **Solution**: Added validation utilities in `securityConfig.js`
- **Validations**:
  - Room codes: 8-12 alphanumeric characters
  - Participant names: 1-50 characters, letters/numbers/spaces/hyphens
  - Email addresses: Standard email format validation
  - Input sanitization: Removes HTML tags, script injections

### 4. Dependency Security
- **Issue**: 10 known vulnerabilities in npm packages
- **Solution**: Updated packages where possible
- **Remaining**: 4 vulnerabilities require breaking changes (monitored)

## Security Configuration Usage

### Environment Variables

```javascript
// Get secure server URL
const serverUrl = securityConfig.getServerUrl();

// Get secure WebSocket URL  
const wsUrl = securityConfig.getWebSocketUrl();

// Get Stripe key (throws error if not configured)
const stripeKey = securityConfig.getStripePublishableKey();
```

### Secure Logging

```javascript
import { logger } from '../utils/securityConfig';

// Safe logging (respects environment settings)
logger.log('User action', { action: 'login', user: 'john' });

// Error logging (always logs, but sanitizes)
logger.error('Failed operation', error);

// Warning logging  
logger.warn('Potential issue', data);
```

### Input Validation

```javascript
import { securityConfig } from '../utils/securityConfig';

// Validate and sanitize inputs
const roomCode = securityConfig.sanitizeInput(userInput);
const isValidRoom = securityConfig.validateRoomCode(roomCode);
const isValidName = securityConfig.validateParticipantName(name);
const isValidEmail = securityConfig.validateEmail(email);
```

## Security Best Practices

### 1. Token Storage
- **Current**: localStorage (XSS vulnerable)
- **Recommendation**: Implement HttpOnly cookies for production
- **Mitigation**: Input sanitization, CSP headers

### 2. Network Security
- All API calls use HTTPS
- Server URLs centralized in configuration
- Input sanitization before sending to server

### 3. Client-Side Security
- Input validation before processing
- Secure logging prevents data exposure
- Environment-based feature flags

### 4. Development vs Production
- Console logging disabled in production builds
- Environment variables for configuration
- Different security policies per environment

## Remaining Security Considerations

### High Priority
1. **Token Storage**: Consider HttpOnly cookies instead of localStorage
2. **CSP Headers**: Implement Content Security Policy
3. **Rate Limiting**: Add client-side rate limiting for API calls

### Medium Priority
1. **Input Validation**: Server-side validation is primary defense
2. **WebSocket Security**: Add message validation and rate limiting
3. **Error Handling**: Avoid exposing internal errors to users

### Low Priority
1. **Code Splitting**: Reduce bundle size for better performance
2. **Dependency Updates**: Regular security updates
3. **Audit Trail**: Enhanced logging for security events

## Environment Setup

### Development
```bash
# Copy example environment file
cp .env.example .env

# Configure your values
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_SERVER_URL=https://www.server.speakeval.org
VITE_WEBSOCKET_URL=wss://www.server.speakeval.org/ws
VITE_ENABLE_CONSOLE_LOGS=true
```

### Production
```bash
# Production environment variables
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key
VITE_SERVER_URL=https://api.speakeval.org
VITE_WEBSOCKET_URL=wss://api.speakeval.org/ws
VITE_ENABLE_CONSOLE_LOGS=false
```

## Security Testing

### Regular Tasks
1. Run `npm audit` monthly
2. Review console logging in development
3. Test input validation with edge cases
4. Verify environment variable usage

### Code Review Checklist
- [ ] No hardcoded secrets or URLs
- [ ] Input validation for user data
- [ ] Secure logging instead of console.log
- [ ] Environment variables for configuration
- [ ] Error handling doesn't expose internals

## Incident Response

### If API Keys Are Exposed
1. Rotate affected keys immediately
2. Update environment variables
3. Review git history for exposure
4. Update production deployments

### If Vulnerabilities Are Found
1. Assess impact and severity
2. Apply patches or workarounds
3. Update dependencies
4. Test thoroughly before deployment

## Contact

For security concerns or questions about these guidelines, please contact the development team.

## Changelog

- **2024**: Initial security implementation
  - Environment variable system
  - Secure logging utility  
  - Input validation framework
  - Dependency vulnerability fixes