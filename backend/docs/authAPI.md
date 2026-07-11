# AI Passport - Authentication API Documentation

This document outlines the authentication endpoints implemented for the AI Passport backend.

**Base URL:** `http://localhost:5000/api/auth`

---

## 1. Register User
Creates a new developer, administrator, or user account and returns JWT access & refresh tokens.

* **URL:** `/register`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "name": "Nagesh Jagtap",
    "email": "nagesh@rift.io",
    "password": "password123",
    "role": "developer"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "64b1f8ef44dfde322a3fa41b",
        "name": "Nagesh Jagtap",
        "email": "nagesh@rift.io",
        "role": "developer",
        "isVerified": false
      },
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    },
    "timestamp": "2026-07-11T12:05:00.000Z"
  }
  ```

---

## 2. Login User
Authenticates user and returns JWT access & refresh tokens.

* **URL:** `/login`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "email": "nagesh@rift.io",
    "password": "password123"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "64b1f8ef44dfde322a3fa41b",
        "name": "Nagesh Jagtap",
        "email": "nagesh@rift.io",
        "role": "developer",
        "isVerified": false
      },
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    },
    "timestamp": "2026-07-11T12:06:00.000Z"
  }
  ```

---

## 3. Refresh Token
Exchanges a valid refresh token for a brand new access token and fresh refresh token (refresh token rotation).

* **URL:** `/refresh`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "refreshToken": "eyJhbGciOi..."
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    },
    "timestamp": "2026-07-11T12:07:00.000Z"
  }
  ```

---

## 4. Forgot Password
Requests a temporary password reset token. (Returned in JSON payload for test accessibility).

* **URL:** `/forgot-password`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "email": "nagesh@rift.io"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password reset token generated successfully",
    "data": {
      "resetToken": "5f8a0023da56fc7ebfce99a8bd36d07d1a293ea8",
      "info": "Normally emailed, provided here for testing. Use this token to reset password."
    },
    "timestamp": "2026-07-11T12:08:00.000Z"
  }
  ```

---

## 5. Reset Password
Resets the password using the token retrieved from the Forgot Password endpoint.

* **URL:** `/reset-password/:resetToken`
* **Method:** `PUT`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "password": "newsecurepassword123"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password reset successfully",
    "data": {},
    "timestamp": "2026-07-11T12:09:00.000Z"
  }
  ```

---

## 6. Change Password (Authenticated)
Changes the password for the currently logged in user.

* **URL:** `/change-password`
* **Method:** `PUT`
* **Headers:** 
  * `Content-Type: application/json`
  * `Authorization: Bearer <accessToken>`
* **Request Body:**
  ```json
  {
    "oldPassword": "password123",
    "newPassword": "newsuperpassword456"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password updated successfully",
    "data": {},
    "timestamp": "2026-07-11T12:10:00.000Z"
  }
  ```

---

## 7. Get Profile (Authenticated)
Retrieves profile information for the authenticated user.

* **URL:** `/profile`
* **Method:** `GET`
* **Headers:** 
  * `Authorization: Bearer <accessToken>`
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile fetched successfully",
    "data": {
      "user": {
        "id": "64b1f8ef44dfde322a3fa41b",
        "name": "Nagesh Jagtap",
        "email": "nagesh@rift.io",
        "role": "developer",
        "isVerified": false,
        "createdAt": "2026-07-11T12:05:00.000Z"
      }
    },
    "timestamp": "2026-07-11T12:11:00.000Z"
  }
  ```

---

## 8. Logout (Authenticated)
Logs out the current session and revokes the refresh token.

* **URL:** `/logout`
* **Method:** `POST`
* **Headers:** 
  * `Authorization: Bearer <accessToken>`
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully",
    "data": {},
    "timestamp": "2026-07-11T12:12:00.000Z"
  }
  ```
