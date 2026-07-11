# Backend API Documentation

## Project Overview
The **AI Passport** backend is a Node.js/Express API that provides authentication, digital passport management, permission handling, activity logging, AI‑driven risk analysis, analytics, and real‑time consent via Socket.io.

## Folder Structure
```
backend/
├─ config/               # Configuration files (db, Gemini AI)
│   ├─ db.js
│   └─ gemini.js
├─ controllers/          # Request handlers
│   ├─ authController.js
│   ├─ passportController.js
│   ├─ permissionController.js
│   ├─ activityController.js
│   ├─ analyticsController.js
│   └─ notificationController.js
├─ middleware/           # Express middlewares
│   ├─ authMiddleware.js   # JWT protect
│   ├─ errorMiddleware.js  # Global error handler
│   └─ rateLimiter.js      # Express‑rate‑limit wrappers
├─ models/               # Mongoose schemas
│   ├─ User.js
│   ├─ Passport.js
│   ├─ Permission.js
│   ├─ Activity.js
│   └─ Notification.js
├─ routes/               # API route definitions
│   ├─ authRoutes.js
│   ├─ passportRoutes.js
│   ├─ permissionRoutes.js
│   ├─ activityRoutes.js
│   ├─ analyticsRoutes.js
│   └─ notificationRoutes.js
├─ services/             # Business logic helpers
│   ├─ aiGuardianService.js   # Gemini risk evaluation
│   └─ socketService.js       # Socket.io consent flow
├─ utils/                # Helper utilities
│   ├─ apiResponse.js
│   └─ apiError.js
├─ app.js                # Express app configuration
├─ server.js             # HTTP + Socket.io server bootstrap
├─ package.json
└─ .env                  # Environment variables
```

## Environment Variables (`.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | Port the server listens on (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_EXPIRE` | Access token lifetime (e.g., `15m`) |
| `JWT_REFRESH_EXPIRE` | Refresh token lifetime (e.g., `7d`) |
| `GEMINI_API_KEY` | API key for Google Gemini (AI Guardian) |
| `NODE_ENV` | `development` or `production` |

## Authentication Flow
1. **Register** – `POST /api/auth/register` – creates a user and returns **access** & **refresh** JWTs.
2. **Login** – `POST /api/auth/login` – validates credentials, returns JWTs.
3. **Refresh** – `POST /api/auth/refresh` – exchanges a valid refresh token for a new access token.
4. **Protected routes** – Require the `Authorization: Bearer <access_token>` header. The `protect` middleware validates the token and attaches `req.user`.
5. **Logout** – `POST /api/auth/logout` – clears the refresh token cookie (if used) and invalidates the session.

## Standard API Response Format
All successful responses use the helper `successResponse` and follow this shape:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Descriptive text",
  "data": { ... }
}
```
Error responses use `ApiError` and are formatted as:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": [ { "field": "email", "message": "Invalid" }, ... ]
}
```

## API Endpoints
---
### Auth
| Method | Endpoint | Purpose | Auth | Request Body |
|--------|----------|---------|------|--------------|
| `POST` | `/api/auth/register` | Register new user | No | `{ name, email, password, role? }` |
| `POST` | `/api/auth/login` | Login and obtain tokens | No | `{ email, password }` |
| `POST` | `/api/auth/refresh` | Refresh access token | No (refresh token in body) | `{ refreshToken }` |
| `POST` | `/api/auth/forgot-password` | Send password‑reset email | No | `{ email }` |
| `PUT` | `/api/auth/reset-password/:resetToken` | Reset password using token | No | `{ password }` |
| `POST` | `/api/auth/logout` | Invalidate refresh token | Yes | _None_ |
| `PUT` | `/api/auth/change-password` | Change password while logged in | Yes | `{ oldPassword, newPassword }` |
| `GET` | `/api/auth/profile` | Get current user profile | Yes | _None_ |
**Headers (protected routes)**: `Authorization: Bearer <access_token>`

### Passports
| Method | Endpoint | Purpose | Auth | Request Body |
|--------|----------|---------|------|--------------|
| `POST` | `/api/passports` | Create a new passport (generates keys, QR code) | Yes | `{ agentName, agentType }` |
| `GET` | `/api/passports` | List passports of the logged‑in user | Yes | _None_ |
| `GET` | `/api/passports/verify/:passportId` | Verify a passport is active (public) | Yes (kept protected) | _None_ |
| `GET` | `/api/passports/:id` | Get passport details by DB id | Yes | _None_ |
| `PUT` | `/api/passports/:id` | Update mutable fields (agentName, agentType) | Yes | `{ agentName?, agentType? }` |
| `DELETE` | `/api/passports/:id` | Revoke (soft‑delete) a passport | Yes | _None_ |

### Permissions
| Method | Endpoint | Purpose | Auth | Request Body |
|--------|----------|---------|------|--------------|
| `POST` | `/api/permissions` | Create permission rule for a passport | Yes | `{ passportId, targetResource, allowedActions[], dailyLimitUSD?, status? }` |
| `GET` | `/api/permissions/:passportId` | List permissions for a passport | Yes | _None_ |
| `PUT` | `/api/permissions/:id` | Update a permission rule | Yes | `{ allowedActions?, dailyLimitUSD?, status? }` |
| `DELETE` | `/api/permissions/:id` | Delete a permission rule | Yes | _None_ |

### Activities
| Method | Endpoint | Purpose | Auth | Request Body |
|--------|----------|---------|------|--------------|
| `GET` | `/api/activity/:passportId` | Retrieve activity timeline for a passport | Yes | _None_ |
| `POST` | `/api/activity/request` | Submit an action request – AI Guardian evaluates risk | Yes | `{ passportId, actionRequested, actionDetail?, requestPayload? }` |
| `PUT` | `/api/activity/:id/resolve` | Manually resolve (approve/reject) a pending activity | Yes | `{ decision: "approved" | "rejected" }` |

### Analytics
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `GET` | `/api/analytics/summary` | Return dashboard statistics (passport counts, risk distribution, pending approvals, etc.) | Yes |

### Notifications
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `GET` | `/api/notifications` | List user's notifications (sorted newest first) | Yes |
| `PUT` | `/api/notifications/:id/read` | Mark a notification as read | Yes |

## Database Models
### User
- `_id`, `name`, `email`, `password`, `role`, `refreshToken`
### Passport
- `ownerId` (ref User), `passportId` (UUID), `agentName`, `agentType`, `publicKey`, `privateKeyHash`, `qrCodeData`, `trustScore` (0‑1000), `status` (`active`/`suspended`/`revoked`)
### Permission
- `passportId` (ref Passport), `targetResource`, `allowedActions[]`, `dailyLimitUSD`, `status`
### Activity
- `passportId`, `userId`, `actionRequested`, `actionDetail`, `requestPayload`, `riskLevel`, `riskScore`, `geminiReasoning`, `decision`, `triggeredBy`
### Notification
- `userId`, `title`, `message`, `type` (`alert`/`info`/`critical`), `isRead`, `relatedActivityId`

## Error Handling
All errors are thrown as `ApiError` with a status code and message. The global `errorMiddleware` formats them into the standard error JSON shown above.

## Frontend Integration Guide
1. **Configure API base URL** – e.g., `https://api.rift.example.com`.
2. **Store JWTs** – access token in memory or short‑lived storage; refresh token in an http‑only cookie or secure storage.
3. **Attach `Authorization` header** to every request that requires authentication.
4. **Handle token expiry** – intercept 401 responses, call `/api/auth/refresh` to obtain a new access token, retry the original request.
5. **Socket.io** – Connect to the same host (`io('http://localhost:5000')`). Listen for `approvalRequest` events and emit `activityResponse` with `{ activityId, decision }`.
6. **Typical sequence**:
   - Register / Login → store tokens
   - Create a passport → keep returned `passportId`
   - Define permissions for that passport
   - Submit actions via `/api/activity/request`
   - React to socket approval requests if risk > LOW
   - Poll `/api/activity/:passportId` or use socket events for updates
   - Use `/api/analytics/summary` for dashboard widgets

## API Testing Order (recommended)
1. **Auth** – register, login, refresh, profile.
2. **Passports** – create, list, get, verify, update, delete.
3. **Permissions** – create, list, update, delete.
4. **Activity** – submit low‑risk request (auto‑approved), then a high‑risk request (requires socket consent).
5. **Analytics** – fetch summary.
6. **Notifications** – list and mark‑as‑read.

---
**Happy coding!**
