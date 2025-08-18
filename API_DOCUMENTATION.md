# Alt-Web Backend API Documentation

Base URL: `https://alt-web-backend-g6do.onrender.com`

## Authentication Endpoints

### Register User

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Description**: Register a new user and receive a JWT token immediately
- **Authentication**: None

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "isEmailVerified": false,
    "createdAt": "2023-06-18T12:00:00.000Z",
    "updatedAt": "2023-06-18T12:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "User already exists"
}
```

### Verify Email

- **URL**: `/api/auth/verify-email`
- **Method**: `POST`
- **Description**: Verify user's email using the verification code sent to their email
- **Authentication**: Required (JWT Token)

**Request Body:**
```json
{
  "verificationCode": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid or expired verification code"
}
```

### Resend Verification Code

- **URL**: `/api/auth/resend-verification`
- **Method**: `POST`
- **Description**: Resend email verification code
- **Authentication**: Required (JWT Token)

**Request Body:**
None required (user ID is extracted from token)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Email already verified"
}
```

### Login

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Description**: Authenticate user and receive JWT token
- **Authentication**: None

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "isEmailVerified": true,
    "lastLogin": "2023-06-18T14:00:00.000Z",
    "createdAt": "2023-06-18T12:00:00.000Z",
    "updatedAt": "2023-06-18T14:00:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### Logout

- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Description**: Logout user (clears HTTP-only cookie)
- **Authentication**: Required (JWT Token)

**Request Body:**
None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Password Management

### Forgot Password

- **URL**: `/api/auth/forgot-password`
- **Method**: `POST`
- **Description**: Request password reset code
- **Authentication**: None

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset code sent to your email"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

### Verify Reset Code

- **URL**: `/api/auth/verify-reset-code`
- **Method**: `POST`
- **Description**: Verify password reset code
- **Authentication**: None

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "resetCode": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reset code verified successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid or expired reset code"
}
```

### Reset Password

- **URL**: `/api/auth/reset-password`
- **Method**: `POST`
- **Description**: Reset password using verified reset code
- **Authentication**: None

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "resetCode": "123456",
  "newPassword": "newPassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid or expired reset code"
}
```

## User Profile

### Get Current User

- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Description**: Get current user profile
- **Authentication**: Required (JWT Token)

**Request Body:**
None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "isEmailVerified": true,
    "lastLogin": "2023-06-18T14:00:00.000Z",
    "createdAt": "2023-06-18T12:00:00.000Z",
    "updatedAt": "2023-06-18T14:00:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Not authorized"
}
```

### Update Password

- **URL**: `/api/auth/update-password`
- **Method**: `PUT`
- **Description**: Update user password
- **Authentication**: Required (JWT Token)

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

## OAuth Authentication

### Google OAuth

- **URL**: `/api/auth/google`
- **Method**: `GET`
- **Description**: Initiate Google OAuth authentication
- **Authentication**: None

**Response:**
Redirects to Google authentication page

### Google OAuth Callback

- **URL**: `/api/auth/google/callback`
- **Method**: `GET`
- **Description**: Handle Google OAuth callback
- **Authentication**: None

**Response:**
Redirects to frontend with JWT token

## Authentication

All protected endpoints require a valid JWT token to be included in the request headers:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Error Handling

All endpoints return standardized error responses with appropriate HTTP status codes:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication required or invalid credentials
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

## Postman Collection

You can import the following Postman collection to test all API endpoints:

1. Create a new Postman collection named "Alt-Web Backend API"
2. Add a variable named `baseUrl` with value `https://alt-web-backend-g6do.onrender.com`
3. Add a variable named `token` to store the JWT token after login/registration
4. Create requests for each endpoint using the documentation above
5. For authenticated requests, add the following in the Authorization tab:
   - Type: Bearer Token
   - Token: {{token}}

## Integration Notes for Frontend

1. Store the JWT token securely (HttpOnly cookie or secure local storage)
2. Include the token in all authenticated requests
3. Implement token refresh mechanism if needed
4. Handle email verification flow after registration
5. Implement proper error handling based on API responses