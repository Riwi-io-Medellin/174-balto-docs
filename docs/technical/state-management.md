---
id: state-management
title: State Management
sidebar_position: 3
---

# State Management

Balto uses the **Cubit** variant of the BLoC pattern from the `flutter_bloc` package. Every feature has one cubit and a sealed state hierarchy. The UI rebuilds only when the cubit emits a new state.

## Pattern overview

```dart
// State hierarchy (one file per feature)
abstract class MyWalksState extends Equatable { ... }
class MyWalksInitial  extends MyWalksState { ... }
class MyWalksLoading  extends MyWalksState { ... }
class MyWalksLoaded   extends MyWalksState {
  final List<WalkBooking> bookings;
  // Computed getters (no extra state classes needed):
  List<WalkBooking> get inProgress => ...
  List<WalkBooking> get upcoming   => ...
  List<WalkBooking> get history    => ...
}
class MyWalksError extends MyWalksState { ... }

// Cubit (one file per feature)
class MyWalksCubit extends Cubit<MyWalksState> {
  MyWalksCubit(this._repo) : super(const MyWalksInitial());

  Future<void> load() async {
    emit(const MyWalksLoading());
    try {
      final bookings = await _repo.getMyBookings();
      emit(MyWalksLoaded(bookings: bookings));
    } catch (e) {
      emit(MyWalksError(message: e.toString()));
    }
  }
}
```

## BlocProvider placement

Each screen that owns a cubit wraps its child in a `BlocProvider`. When a screen needs more than one cubit it uses `MultiBlocProvider`:

```dart
// home_page.dart
return MultiBlocProvider(
  providers: [
    BlocProvider(create: (_) => sl<ProfileCubit>()..load()),
    BlocProvider(create: (_) => sl<MyWalksCubit>()..load()),
  ],
  child: _HomeView(...),
);
```

`sl<T>()` is the GetIt service locator. Cubits are registered as **factories** so every `BlocProvider` creates a fresh instance.

## BlocBuilder vs BlocListener vs BlocConsumer

| Widget | When to use |
|---|---|
| `BlocBuilder` | Rebuild a subtree when state changes (pure UI updates) |
| `BlocListener` | Side effects that don't rebuild UI: navigation, snackbars, toasts |
| `BlocConsumer` | Both at once — common in screens that show data AND navigate on success |

## MyWalksLoaded computed getters

`MyWalksLoaded` holds the full raw list of bookings and exposes read-only computed getters so the UI never has to filter manually:

```dart
List<WalkBooking> get inProgress {
  // A booking is live if the backend explicitly set status = "in_progress"
  // OR if it is "accepted" and currently inside the scheduled time window.
  final now = DateTime.now();
  return bookings.where((b) {
    if (b.status == WalkBookingStatus.inProgress) return true;
    if (b.status != WalkBookingStatus.accepted)   return false;
    final end = b.slotStart.add(Duration(minutes: b.durationMinutes));
    return !b.slotStart.isAfter(now) && !end.isBefore(now);
  }).toList()..sort(...);
}

List<WalkBooking> get upcoming => bookings
    .where((b) => b.status == WalkBookingStatus.accepted
               && b.slotStart.isAfter(DateTime.now()))
    .toList()..sort(...);

List<WalkBooking> get history => bookings
    .where((b) => b.status == WalkBookingStatus.completed
               || b.status == WalkBookingStatus.ownerCancelled
               || b.status == WalkBookingStatus.walkerCancelled
               || b.status == WalkBookingStatus.rejected)
    .toList()..sort(...); // newest first
```

## LiveWalkCubit state machine

The owner's live-walk cubit manages a full state machine:

```
     start()
       │
       ▼
  LiveWalkConnecting
       │
       ├─ sessionId found ──► _connectToSession()
       │                            │
       │                            ▼
       │                     LiveWalkActive  ◄──── location stream
       │                            │
       └─ no sessionId ────► LiveWalkWaiting
                                    │ (polls every 30 s)
                                    └──► LiveWalkConnecting (retry)

LiveWalkActive
    │
    ├─ hub 'WalkCompleted' ──► LiveWalkCompleted
    └─ hub 'Error'         ──► LiveWalkError
```

Key detail: when `LiveWalkActive` is entered, the cubit immediately fetches the existing route from the REST API (`GET /walk-sessions/{id}/route`) to pre-populate the map before the next SignalR update arrives.

## WalkBookingStatus enum

```dart
enum WalkBookingStatus {
  pending,          // created, awaiting walker acceptance
  accepted,         // walker accepted, walk not yet started
  inProgress,       // walker started the walk (backend status: "in_progress")
  completed,        // walk finished
  rejected,         // walker rejected
  walkerCancelled,  // walker cancelled an accepted booking
  ownerCancelled,   // owner cancelled
}
```

The `inProgress` value is critical: the backend sets `booking.Status = "in_progress"` the moment the walker starts. Without this value every in-progress booking would silently fall to the `default` case and appear as `pending`.

## Equatable and state equality

All state classes extend `Equatable` and declare their `props`. This prevents `BlocBuilder` from rebuilding when the cubit emits a state that is structurally identical to the previous one. `MyWalksLoaded` includes the full `bookings` list in its props so even a minor data change (e.g., a `walkSessionId` being populated) triggers a rebuild.
