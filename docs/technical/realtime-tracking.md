---
id: realtime-tracking
title: Real-Time Tracking
sidebar_position: 5
---

# Real-Time Tracking

Balto's live walk feature lets the dog owner see the walker's GPS position on a map as the walk happens. Two separate transport layers work together: a **REST fan-out** for the walker's position data and **SignalR** for the owner's delivery.

## Architecture overview

```
[Walker phone]
    Geolocator GPS stream
           │
           ▼
  WalkerLiveWalkService
           │  every GPS event
           ▼
  POST /walk-sessions/{id}/location   ◄── REST
           │
           ▼
      .NET backend
           │  SignalR broadcast to group "walk-{sessionId}"
           ▼
  WalkTrackingService (SignalR client)
           │
           ▼
    LiveWalkCubit.locationStream
           │
           ▼
    LiveWalkScreen (GoogleMap)
```

The walker never connects to SignalR. The backend acts as the bridge: it receives REST position POSTs and broadcasts them to the hub group.

## WalkTrackingService — owner side

`lib/core/services/walk_tracking_service.dart`

```dart
class WalkTrackingService {
  HubConnection? _connection;
  final _locationController   = StreamController<LatLng>.broadcast();
  final _completedController  = StreamController<Map<String, dynamic>?>.broadcast();
  final _errorController      = StreamController<String>.broadcast();

  Stream<LatLng>               get locationStream    => _locationController.stream;
  Stream<Map<String, dynamic>?> get walkCompletedStream => _completedController.stream;
  Stream<String>               get errorStream       => _errorController.stream;
}
```

### Connection options

| Option | Value | Reason |
|---|---|---|
| Transport | `LongPolling` | Nginx reverse proxy does not forward WebSocket `Upgrade` headers |
| `requestTimeout` | 15 000 ms | Default of 2 000 ms causes timeouts on remote servers |
| `withAutomaticReconnect` | true | Recovers silently from transient network drops |
| `accessTokenFactory` | reads JWT | Hub requires authenticated connections |

### Hub events

**Server → Client**

| Event name | Payload | Action |
|---|---|---|
| `WalkLocationUpdated` | `{Latitude, Longitude}` (or lowercase) | Adds LatLng to the location stream |
| `WalkCompleted` | `{distanceMeters, durationSeconds}` (case-insensitive) | Adds to completed stream |
| `Error` | `string` | Adds to error stream; LiveWalkCubit emits `LiveWalkError` |

**Client → Server**

| Method | Args | Purpose |
|---|---|---|
| `JoinWalkGroup` | sessionId | Subscribes to `walk-{sessionId}` group |
| `LeaveWalkGroup` | sessionId | Unsubscribes on dispose |

### Payload parsing

The hub sends `Map<Object?,Object?>` which Dart cannot cast directly to `Map<String,dynamic>`. Safe conversion:

```dart
final data = Map<String, dynamic>.from(raw as Map);
final lat = (data['Latitude'] ?? data['latitude']) as num?;
final lng = (data['Longitude'] ?? data['longitude']) as num?;
```

The double key check (`'Latitude'` and `'latitude'`) handles case differences between .NET serialisation settings.

## LiveWalkCubit — state machine

`lib/presentation/bloc/live_walk/live_walk_cubit.dart`

```
start()
  │
  ├─ fetchCurrentSessionId()   ← GET /walk-bookings/me (fresh from API, not stale prop)
  │      │
  │      ├─ sessionId found ──► _connectToSession(id)
  │      │                           │
  │      │                      parallel:
  │      │                       • fetch walker detail
  │      │                       • fetch pet detail
  │      │                       • connect SignalR + JoinWalkGroup
  │      │                       • seed route from REST
  │      │                       • start 1 s elapsed timer
  │      │                       • start 15 s completion fallback poll
  │      │                           │
  │      │                      emit LiveWalkActive
  │      │
  │      └─ null ──────────────► emit LiveWalkWaiting
  │                              _startPolling (every 8 s)
  │
  └─ error ────────────────────► emit LiveWalkError
```

### Route pre-seeding

After connecting to the SignalR hub, the cubit immediately fetches the existing route:

```dart
Future<void> _seedRouteFromHistory(String sessionId) async {
  final points = await _sessionRepository.getRoute(sessionId);
  if (points.isEmpty) return;
  // Show last known position without waiting for next SignalR update
  emit((state as LiveWalkActive).copyWith(
    currentPosition: points.last,
    routePoints: points,
    distanceKm: _calcDistanceKm(points),
  ));
}
```

This prevents an empty map for the first few seconds after the owner opens the screen.

### Distance calculation

The cubit accumulates distance using the **haversine formula** on consecutive GPS points. Each new location event:
1. Appends the point to `routePoints`
2. Adds the segment distance (from previous point) to `distanceKm`
3. Emits the updated `LiveWalkActive` state

### Completion detection

Walk completion is detected from two sources to handle unreliable SignalR delivery:

1. **SignalR `WalkCompleted` event** — immediate, preferred
2. **REST fallback poll** every 15 s — `GET /walk-bookings/me?status=completed` — checks if the booking transitioned to `completed` status

Whichever fires first cancels both, cancels the elapsed timer, and emits `LiveWalkCompleted`.

## WalkerLiveWalkService — walker side

`lib/core/services/walker_live_walk_service.dart`

```dart
Future<void> start() async {
  final settings = Platform.isAndroid
      ? AndroidSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,   // metres
          foregroundNotificationConfig: const ForegroundNotificationConfig(
            notificationTitle: 'Balto — Walk in progress',
            notificationText: 'Recording your route in the background.',
            enableWakeLock: true,
            enableWifiLock: true,
          ),
        )
      : const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        );

  _positionSub = Geolocator.getPositionStream(locationSettings: settings)
      .listen(_positionController.add);
}
```

`distanceFilter: 10` means a new position event is emitted only after the walker moves ≥10 m. This reduces network calls without noticeably degrading the route.

## WalkerLiveWalkCubit — position upload

`lib/presentation/bloc/walker_live_walk/walker_live_walk_cubit.dart`

On each position event from `WalkerLiveWalkService`:

```dart
void _onPosition(Position position) {
  // 1. Accumulate route
  _routePoints.add(LatLng(position.latitude, position.longitude));
  _distanceKm += _haversine(prev, current);

  // 2. Emit updated state
  emit(WalkerLiveWalkActive(
    currentPosition: LatLng(position.latitude, position.longitude),
    accuracyMeters: position.accuracy,
    elapsedSeconds: _elapsed,
    routePoints: List.from(_routePoints),
    distanceKm: _distanceKm,
  ));

  // 3. Upload to backend (fire-and-forget, errors swallowed)
  _sessionRepository.addLocation(
    _sessionId!,
    position.latitude,
    position.longitude,
  );
}
```

Errors on the position upload are intentionally swallowed — a failed upload skips one GPS point but does not crash the walk or stop the stream.

## LiveWalkScreen — UI

`lib/presentation/screens/walks/live_walk_screen.dart`

The screen has two layers:
- A `BlocListener` that handles navigation (e.g., pushes `WalkRouteSummaryScreen` on `LiveWalkCompleted`)
- A `BlocBuilder` that renders the current state

State → UI mapping:

| State | UI |
|---|---|
| `LiveWalkConnecting` | Spinner overlay "Connecting to walker…" |
| `LiveWalkWaiting` | Green card "Waiting for walker to start" with a retry button |
| `LiveWalkActive` | Full-screen `GoogleMap` with walker marker, route polyline, stats bar |
| `LiveWalkCompleted` | Navigates to `WalkRouteSummaryScreen` |
| `LiveWalkError` | Error card with message + retry button |
