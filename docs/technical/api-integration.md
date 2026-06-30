---
id: api-integration
title: API Integration
sidebar_position: 4
---

# API Integration

Balto communicates with a .NET backend via REST. All HTTP calls are made through a single configured **Dio** instance with an authentication interceptor.

## Dio client setup

`lib/core/network/api_client.dart`

```dart
class ApiClient {
  ApiClient(TokenStorage tokenStorage) {
    dio = Dio(BaseOptions(
      baseUrl: Env.apiBaseUrl,   // e.g. http://api-balto.duckdns.org/api
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      contentType: 'application/json',
      responseType: ResponseType.json,
      validateStatus: (status) => status != null && status < 500,
    ));
    dio.interceptors.add(
      AuthInterceptor(tokenStorage: tokenStorage, dio: dio),
    );
  }

  late final Dio dio;
}
```

## AuthInterceptor

`lib/core/network/auth_interceptor.dart`

Every outgoing request has the `Authorization: Bearer <token>` header injected automatically. On a 401 response the interceptor attempts a silent token refresh using a **separate** `Dio` instance (preventing a refresh loop), stores the new tokens, and retries the original request exactly once.

```dart
class AuthInterceptor extends QueuedInterceptorsWrapper {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await tokenStorage.readAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // On 401: try silent refresh, retry once, then clear tokens and propagate
    ...
  }
}
```

`QueuedInterceptorsWrapper` ensures concurrent requests all wait for the single refresh call instead of each triggering their own.

## Backend endpoint status

:::info
The .NET backend (`174-balto-backend`) is under active development. The table below marks which endpoints are **live** in the backend today versus **planned** (datasources exist in the Flutter app but the backend hasn't implemented them yet). See [Backend API Reference](/technical/backend-api) for request/response details on live endpoints.
:::

### Auth — live ✅

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Returns access + refresh tokens |
| POST | `/api/auth/refresh` | Issues new token pair from a valid refresh token |
| POST | `/api/auth/logout` | Revokes the refresh token |

### Users — live ✅

| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | List all users (requires auth) |
| GET | `/api/users/{id}` | Fetch user by GUID (requires auth) |
| POST | `/api/users` | Create a user (requires auth) |
| PUT | `/api/users/{id}` | Update user profile (requires auth) |
| DELETE | `/api/users/{id}` | Delete a user (requires auth) |

### Pets — planned 🔜

| Method | Path | Description |
|---|---|---|
| GET | `/api/pets/my-pets` | List owner's pets |
| POST | `/api/pets` | Add a pet |
| PUT | `/api/pets/{id}` | Edit a pet |
| DELETE | `/api/pets/{id}` | Remove a pet |

### Walk bookings — planned 🔜

| Method | Path | Description |
|---|---|---|
| GET | `/api/walk-bookings/my-bookings` | List bookings (optional `?status=` filter) |
| POST | `/api/walk-bookings` | Create a new booking |
| POST | `/api/walk-bookings/{id}/cancel` | Owner cancels |
| POST | `/api/walk-bookings/{id}/accept` | Walker accepts |
| POST | `/api/walk-bookings/{id}/reject` | Walker rejects |

### Walk sessions — planned 🔜

| Method | Path | Description |
|---|---|---|
| POST | `/api/walk-sessions/start-from-booking/{bookingId}` | Walker starts; returns `sessionId` |
| POST | `/api/walk-sessions/{id}/location` | Walker posts GPS position (body: `{latitude, longitude, accuracy}`) |
| POST | `/api/walk-sessions/{id}/finish` | Walker ends; returns distance + duration |
| GET | `/api/walk-sessions/{id}/route` | Returns `[{latitude, longitude}]` array |

### Walker profiles — planned 🔜

| Method | Path | Description |
|---|---|---|
| GET | `/api/walker-profiles` | List all walkers |
| GET | `/api/walker-profiles/{id}` | Get a specific walker |
| GET | `/api/walker-profiles/me` | Get own walker profile |
| POST | `/api/walker-profiles` | Create walker profile |

### Walker availability — planned 🔜

| Method | Path | Description |
|---|---|---|
| GET | `/api/walker-availability/{walkerId}` | Get walker's schedule |
| PUT | `/api/walker-availability/{walkerId}` | Update schedule |

## DTO → Entity mapping

Raw JSON from the API is parsed in DTO classes before being exposed to the domain:

```dart
// data/models/walk_booking_dto.dart
class WalkBookingDto {
  static WalkBookingStatus _parseStatus(String? raw) => switch (raw) {
    'pending'          => WalkBookingStatus.pending,
    'accepted'         => WalkBookingStatus.accepted,
    'in_progress'      => WalkBookingStatus.inProgress,
    'completed'        => WalkBookingStatus.completed,
    'rejected'         => WalkBookingStatus.rejected,
    'walker_cancelled' => WalkBookingStatus.walkerCancelled,
    'owner_cancelled'  => WalkBookingStatus.ownerCancelled,
    _                  => WalkBookingStatus.pending,
  };

  WalkBooking toEntity() => WalkBooking(
    id: id,
    status: _parseStatus(status),
    walkSessionId: walkSessionId,
    // ...
  );
}
```

:::caution Field name differences
Some backend field names differ from Flutter entity names. Always check the DTO when adding new fields.
:::

## Error handling

Backend error responses follow the format:

```json
{ "error": "User not found.", "code": "USER_NOT_FOUND" }
```

Repository implementations catch `DioException` and convert it to a domain-level failure:

```dart
try {
  final response = await _datasource.getMyBookings();
  return response.map((dto) => dto.toEntity()).toList();
} on DioException catch (e) {
  throw WalkBookingFailure(
    code: e.response?.statusCode?.toString() ?? 'NETWORK',
    message: e.message ?? 'Unknown error',
  );
}
```

The cubit catches the domain failure and emits an error state, which the UI renders with a retry button.
