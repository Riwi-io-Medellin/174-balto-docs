---
id: backend-api
title: Backend API Reference
sidebar_position: 9
---

# Backend API Reference

This page documents the endpoints currently implemented in the `.NET 10` backend. For the full planned endpoint list and Flutter integration details see [API Integration](/technical/api-integration).

## Base URL

```
http://api-balto.duckdns.org/api
```

Swagger UI (development only): `http://localhost:5000/swagger`  
OpenAPI JSON (development only): `http://localhost:5000/swagger/v1/swagger.json`

## Authentication

All protected endpoints require a JWT Bearer token:

```
Authorization: Bearer <accessToken>
```

### Token lifetimes

| Token | Lifetime | Storage |
|---|---|---|
| Access token | 1 hour | Flutter `flutter_secure_storage` |
| Refresh token | 7 days | In-memory on server (lost on restart) |

:::caution
Refresh tokens are stored in a server-side `ConcurrentDictionary`. They are lost on every server restart. This is the current dev behaviour and will be replaced with persistent storage in a later iteration.
:::

---

## Auth endpoints

### POST `/api/auth/login`

Exchange email + password for a token pair.

**Request body**
```json
{
  "email": "admin@pawexplorers.com",
  "password": "Password123!"
}
```

**Response 200**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "a3f7...",
  "expiresAt": "2025-07-01T15:30:00Z"
}
```

**Response 401** — invalid credentials (no body).

---

### POST `/api/auth/refresh`

Issue a new token pair from a valid refresh token. The old refresh token is invalidated immediately.

**Request body**
```json
{ "refreshToken": "a3f7..." }
```

**Response 200** — same shape as `/login`.  
**Response 401** — token expired or not found.

---

### POST `/api/auth/logout`

Revoke a refresh token so it can no longer be used.

**Request body**
```json
{ "refreshToken": "a3f7..." }
```

**Response 204** — revoked successfully.  
**Response 404** — token not found.

---

## Users endpoints

All `/api/users` endpoints require `Authorization: Bearer`.

### GET `/api/users`

Returns all users.

**Response 200**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "firstName": "María",
    "lastName": "López",
    "email": "maria@example.com",
    "photoUrl": null
  }
]
```

---

### GET `/api/users/{id}`

**Response 200** — `UserResponse` object.  
**Response 404**
```json
{ "error": "User not found.", "code": "USER_NOT_FOUND" }
```

---

### POST `/api/users`

Create a new user record.

**Request body**
```json
{
  "firstName": "María",
  "lastName": "López",
  "email": "maria@example.com"
}
```

**Response 201** — `UserResponse` with `Location: /api/users/{id}` header.  
**Response 400**
```json
{ "error": "Unable to create user.", "code": "USER_CREATE_FAILED" }
```

---

### PUT `/api/users/{id}`

Update an existing user.

**Request body**
```json
{
  "firstName": "María",
  "lastName": "López",
  "photoUrl": "https://cdn.example.com/photo.jpg"
}
```

**Response 200** — updated `UserResponse`.  
**Response 404**
```json
{ "error": "User not found or request is invalid.", "code": "USER_UPDATE_FAILED" }
```

---

### DELETE `/api/users/{id}`

**Response 204** — deleted.  
**Response 404**
```json
{ "error": "User not found.", "code": "USER_NOT_FOUND" }
```

---

## Health check

### GET `/health`

No auth required. Returns `200 OK` with body `"OK"`. Used by load balancers and Docker health checks.

---

## Error format

All error responses use a consistent envelope:

```json
{ "error": "Human-readable message.", "code": "SNAKE_CASE_CODE" }
```

HTTP status codes:

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Resource created |
| 204 | Success, no body (delete / logout) |
| 400 | Bad request (validation or business rule failure) |
| 401 | Unauthenticated |
| 404 | Resource not found |

---

## Module implementation status

The backend is structured around 64 use cases across 12 modules:

| Module | Use cases | Status |
|---|---|---|
| User management & access | UC-01–08 | In Progress |
| Pet profiles | UC-09–14 | Pending |
| Walk Planner | UC-15–20 | Pending |
| Walker Hub | UC-21–27 | Pending |
| Matching & recommendations | UC-28–31 | Pending |
| Booking & service management | UC-32–38 | Pending |
| Real-time GPS tracking | UC-39–44 | Pending |
| Lost & found dog alerts | UC-45–49 | Pending |
| AI Coach | UC-50–55 | Pending |
| Activity dashboard | UC-56–58 | Pending |
| Reputation & ratings | UC-59–61 | Pending |
| Administration | UC-62–64 | Pending |
