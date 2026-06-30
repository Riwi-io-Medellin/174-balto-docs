---
id: api-integration
title: API Integration
sidebar_position: 4
---

# API Integration

Balto communicates with a .NET backend via REST. All HTTP calls are made through a single configured **Dio** instance with an authentication interceptor.

## Dio client setup

```dart
// core/network/dio_client.dart
Dio createDio(TokenStorage tokenStorage) {
  final dio = Dio(BaseOptions(
    baseUrl: Env.apiBaseUrl,   // e.g. https://api.balto.app/api
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));
  dio.interceptors.add(AuthInterceptor(tokenStorage));
  return dio;
}
```

## AuthInterceptor

Every outgoing request has the `Authorization: Bearer <token>` header injected automatically:

```dart
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _tokenStorage.readAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}
```

## Endpoints used by the app

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Returns access + refresh tokens |
| POST | `/auth/register` | Creates account |

### Users

| Method | Path | Description |
|---|---|---|
| GET | `/users/{id}` | Fetch user profile |
| PUT | `/users/{id}` | Update profile (name, photo URL) |

### Pets

| Method | Path | Description |
|---|---|---|
| GET | `/pets/my-pets` | List owner's pets |
| POST | `/pets` | Add a pet |
| PUT | `/pets/{id}` | Edit a pet |
| DELETE | `/pets/{id}` | Remove a pet |

### Walk bookings

| Method | Path | Description |
|---|---|---|
| GET | `/walk-bookings/my-bookings` | List bookings (optional `?status=` filter) |
| POST | `/walk-bookings` | Create a new booking |
| POST | `/walk-bookings/{id}/cancel` | Owner cancels |
| POST | `/walk-bookings/{id}/accept` | Walker accepts |
| POST | `/walk-bookings/{id}/reject` | Walker rejects |

### Walk sessions

| Method | Path | Description |
|---|---|---|
| POST | `/walk-sessions/start-from-booking/{bookingId}` | Walker starts; returns `sessionId` |
| POST | `/walk-sessions/{id}/location` | Walker posts GPS position (body: `{latitude, longitude, accuracy}`) |
| POST | `/walk-sessions/{id}/finish` | Walker ends; returns distance + duration |
| GET | `/walk-sessions/{id}/route` | Returns `[{latitude, longitude}]` array |

### Walker profiles

| Method | Path | Description |
|---|---|---|
| GET | `/walker-profiles/me` | Get own walker profile |
| POST | `/walker-profiles` | Create walker profile |
| GET | `/walker-profiles/{id}` | Get a specific walker |
| GET | `/walker-profiles` | List all walkers |

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
    actualDistanceMeters: json['totalDistanceMeters'],  // backend field name differs
    actualDurationSeconds: json['totalDurationSeconds'],
    // ...
  );
}
```

:::caution Field name differences
Some backend field names differ from the Flutter entity names. `totalDistanceMeters` (backend) maps to `actualDistanceMeters` (entity), and `totalDurationSeconds` maps to `actualDurationSeconds`. Always check the DTO when adding new fields.
:::

## Error handling

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
