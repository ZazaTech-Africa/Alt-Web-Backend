# Frontend Integration Guide

## Overview

This guide provides instructions for frontend developers to integrate with the Alt-Web Backend API. The backend is deployed at `https://alt-web-backend-g6do.onrender.com`.

## CORS Configuration

The backend has CORS enabled for the following origins:
- http://localhost:3000
- http://localhost:5173
- https://alt-web-phi.vercel.app
- https://alt-web-frontend.vercel.app

If you're experiencing CORS issues:
1. Ensure your frontend is running on one of the allowed origins
2. Check that your requests include the proper headers
3. Test the CORS configuration using the `/api/cors-test` endpoint
4. For development, use the same origin or a proxy server
5. Use the included `cors-test.html` tool to diagnose CORS issues

### CORS Testing Tool

We've included a simple HTML tool to test CORS functionality. To use it:

1. Open the `cors-test.html` file in your browser
2. The tool will attempt to make requests to various API endpoints
3. Check the results to see if CORS is properly configured
4. If you see errors, check the browser console for more details

### Using Proxy in Development

To avoid CORS issues during development, you can set up a proxy in your React application:

#### For Vite (React)

Add the following to your `vite.config.js` file:

```javascript
export default defineConfig({
  // ... other config
  server: {
    proxy: {
      '/api': {
        target: 'https://alt-web-backend-g6do.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

Then in your frontend code, use relative URLs:

```javascript
// Instead of this:
// fetch('https://alt-web-backend-g6do.onrender.com/api/auth/login', ...)

// Do this:
fetch('/api/auth/login', ...)
```

## Authentication Flow

### User Registration and Login

1. **Registration Process**:
   - Send a POST request to `/api/auth/register` with user details
   - Store the returned JWT token for authenticated requests
   - Display a verification prompt to the user
   - The user will receive a 6-digit verification code via email

2. **Email Verification**:
   - After registration, prompt the user to enter the verification code
   - Send a POST request to `/api/auth/verify-email` with just the verification code
   - No authentication token or email is required for this endpoint
   - The backend uses session data to associate the code with the correct user
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

## Error Handling

### Handling CORS Errors

If you encounter CORS errors in your frontend application, implement proper error handling:

#### Using Fetch API

```javascript
async function makeApiRequest(url, options) {
  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    if (error.message === 'Network Error' || error.name === 'TypeError') {
      console.error('CORS or network error:', error);
      // Show user-friendly message
      return {
        success: false,
        message: 'Unable to connect to the server. Please check your internet connection or try again later.'
      };
    }
    throw error;
  }
}
```

#### Using Axios

```javascript
import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: '/api', // Use relative URL with proxy or full URL in production
  timeout: 10000,
  withCredentials: true, // Important for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error') {
      console.error('CORS or network error:', error);
      // Show user-friendly message
      return Promise.resolve({
        data: {
          success: false,
          message: 'Unable to connect to the server. Please check your internet connection or try again later.'
        }
      });
    }
    return Promise.reject(error);
  }
);

export default api;
```

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
    const response = await fetch('https://alt-web-backend-g6do.onrender.com/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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

```javascript
async function forgotPassword(email) {
  try {
    const response = await fetch('https://alt-web-backend-g6do.onrender.com/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
```

2. **Verify Reset Code**:
   - User enters the reset code from email
   - Send a POST request to `/api/auth/verify-reset-code` with only the code
   - If successful, store the returned resetToken for the next step

```javascript
async function verifyResetCode(code) {
  try {
    const response = await fetch('https://alt-web-backend-g6do.onrender.com/api/auth/verify-reset-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });
    
    const data = await response.json();
    
    if (data.success && data.resetToken) {
      // Store the reset token for the password reset step
      localStorage.setItem('passwordResetToken', data.resetToken);
    }
    
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
```

3. **Reset Password**:
   - User enters new password and confirmation
   - Send a POST request to `/api/auth/reset-password` with passwords and the resetToken (automatically retrieved from localStorage)
   - Redirect to login page on success

```javascript
async function resetPassword(password, confirmPassword) {
  try {
    // Get the reset token stored from the previous step
    const resetToken = localStorage.getItem('passwordResetToken');
    
    if (!resetToken) {
      return { success: false, error: 'Reset token not found. Please verify your code again.' };
    }
    
    const response = await fetch('https://alt-web-backend-g6do.onrender.com/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password, confirmPassword, resetToken })
    });
    
    const data = await response.json();
    
    // Clear the reset token after use, regardless of success or failure
    localStorage.removeItem('passwordResetToken');
    
    return data;
  } catch (error) {
    // Clear the reset token on error
    localStorage.removeItem('passwordResetToken');
    return { success: false, error: 'Network error' };
  }
}
```

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