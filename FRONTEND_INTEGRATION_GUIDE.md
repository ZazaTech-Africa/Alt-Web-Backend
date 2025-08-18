# Frontend Integration Guide

## Overview

This guide provides instructions for frontend developers to integrate with the Alt-Web Backend API. The backend is deployed at `https://alt-web-backend-g6do.onrender.com`.

## Authentication Flow

### User Registration and Login

1. **Registration Process**:
   - Send a POST request to `/api/auth/register` with user details
   - Store the returned JWT token for authenticated requests
   - Display a verification prompt to the user
   - The user will receive a 6-digit verification code via email

2. **Email Verification**:
   - After registration, prompt the user to enter the verification code
   - Send a POST request to `/api/auth/verify-email` with the verification code
   - Include the JWT token in the Authorization header
   - Update the UI to reflect the verified status

3. **Login Process**:
   - Send a POST request to `/api/auth/login` with user credentials
   - Store the returned JWT token for authenticated requests

### Token Management

1. **Storing the Token**:
   - Store the JWT token securely (localStorage, sessionStorage, or HttpOnly cookie)
   - For better security, consider using an HttpOnly cookie approach

2. **Using the Token**:
   - Include the token in the Authorization header for all authenticated requests:
     ```
     Authorization: Bearer <token>
     ```

3. **Handling Token Expiration**:
   - Implement a mechanism to detect 401 Unauthorized responses
   - Redirect to the login page when the token expires

## API Integration Examples

### User Registration

```javascript
async function registerUser(name, email, password, confirmPassword) {
  try {
    const response = await fetch('https://alt-web-backend-g6do.onrender.com/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, confirmPassword })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token
      localStorage.setItem('token', data.token);
      // Store user info
      localStorage.setItem('user', JSON.stringify(data.user));
      // Redirect to verification page
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
```

### Email Verification

```javascript
async function verifyEmail(verificationCode) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('https://alt-web-backend-g6do.onrender.com/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ verificationCode })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update user verification status
      const user = JSON.parse(localStorage.getItem('user'));
      user.isEmailVerified = true;
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
```

### User Login

```javascript
async function loginUser(email, password) {
  try {
    const response = await fetch('https://alt-web-backend-g6do.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token
      localStorage.setItem('token', data.token);
      // Store user info
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
```

### Get User Profile

```javascript
async function getUserProfile() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('https://alt-web-backend-g6do.onrender.com/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, user: data.data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
```

## Error Handling

Implement consistent error handling across your application:

```javascript
function handleApiError(error) {
  if (error.status === 401) {
    // Unauthorized - token expired or invalid
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    window.location.href = '/login';
  } else if (error.status === 400) {
    // Bad request - validation error
    return error.message || 'Invalid input';
  } else if (error.status === 404) {
    // Not found
    return 'Resource not found';
  } else {
    // Other errors
    return 'Something went wrong. Please try again later.';
  }
}
```

## Password Reset Flow

1. **Forgot Password**:
   - User enters email address
   - Send a POST request to `/api/auth/forgot-password`
   - Display a message to check email for reset code

2. **Verify Reset Code**:
   - User enters the reset code from email
   - Send a POST request to `/api/auth/verify-reset-code`
   - If successful, proceed to password reset form

3. **Reset Password**:
   - User enters new password
   - Send a POST request to `/api/auth/reset-password`
   - Redirect to login page on success

## Best Practices

1. **Security**:
   - Never store sensitive information in localStorage
   - Implement CSRF protection if using cookies
   - Use HTTPS for all API requests

2. **User Experience**:
   - Provide clear feedback for all API operations
   - Implement loading states during API calls
   - Handle offline scenarios gracefully

3. **Performance**:
   - Minimize unnecessary API calls
   - Implement caching where appropriate
   - Use debouncing for search inputs

4. **Maintenance**:
   - Centralize API calls in a service layer
   - Use environment variables for API URLs
   - Document all API integrations

## Testing

1. Use the provided Postman collection to test API endpoints
2. Implement end-to-end tests for critical user flows
3. Test error scenarios and edge cases

## Support

For any questions or issues regarding API integration, please contact the backend team.