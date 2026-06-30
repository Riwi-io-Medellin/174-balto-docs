---
id: di-setup
title: Dependency Injection
sidebar_position: 6
---

# Dependency Injection

Balto uses **GetIt** as a service locator. All registrations live in a single file — `lib/core/di/injection.dart` — and are run once at startup before `runApp`.

## Entry point

```dart
// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  setupDependencies();   // ← registers everything
  // ...
  runApp(BaltoApp(...));
}
```

## Registration strategies

| Strategy | Used for | Behaviour |
|---|---|---|
| `registerLazySingleton` | Infrastructure, datasources, repositories | Created once on first access; same instance returned forever |
| `registerFactory` | Cubits | New instance created on every `sl<T>()` call |

Using factories for cubits means each `BlocProvider.create` receives a fresh cubit with clean state, preventing stale data leaking between screens.

## Registration order

```
FlutterSecureStorage (singleton)
└── TokenStorage(storage)
    └── ApiClient(tokenStorage) → returns configured Dio instance

Auth layer:
  AuthRemoteDataSource(dio)
  AuthRepositoryImpl(datasource, tokenStorage) → registered as AuthRepository

User layer:
  UserRemoteDataSource(dio) → UserRepositoryImpl → UserRepository

Pet layer:
  PetRemoteDataSource(dio) → PetRepositoryImpl → PetRepository

Walking history layer:
  WalkingHistoryRemoteDataSource(dio) → WalkingHistoryRepositoryImpl → WalkingHistoryRepository

Upload layer:
  UploadRemoteDataSource(dio) → UploadRepositoryImpl → UploadRepository

Walker profile layer (apply / update own profile):
  WalkerProfileRemoteDataSource(dio) → WalkerProfileRepositoryImpl → WalkerProfileRepository

Walker listing layer (search / detail):
  WalkerRemoteDataSource(dio) → WalkerRepositoryImpl → WalkerRepository

Walker availability layer:
  WalkerAvailabilityRemoteDataSource(dio) → WalkerAvailabilityRepositoryImpl → WalkerAvailabilityRepository

Walk booking layer:
  WalkBookingRemoteDataSource(dio) → WalkBookingRepositoryImpl → WalkBookingRepository

Walk session layer:
  WalkSessionRemoteDataSource(dio) → WalkSessionRepositoryImpl → WalkSessionRepository

Cubits (factories):
  AuthCubit(authRepository)
  ProfileCubit(userRepo, tokenStorage, petRepo, walkingHistoryRepo, walkerProfileRepo)
  WalkerCubit(walkerRepository)
  WalkBookingCubit(walkBookingRepo, walkerRepo, petRepo)
  WalkerAvailabilityCubit(walkerAvailabilityRepo)
  WalkerBookingCubit(walkBookingRepo)
  MyWalksCubit(walkBookingRepo)
```

## Accessing dependencies

Anywhere in the app:

```dart
import 'package:mobile_pets/core/di/injection.dart';

// In a widget or screen:
BlocProvider(
  create: (_) => sl<MyWalksCubit>()..load(),
  child: ...,
)
```

## Cubits NOT in the service locator

`LiveWalkCubit` and `WalkerLiveWalkCubit` are created directly in their screens instead of being registered in GetIt. The reason: each instance owns a `WalkTrackingService` or `WalkerLiveWalkService` that holds open streams and SignalR connections. Creating them inline makes the lifecycle boundary explicit — the cubit (and its streams) live exactly as long as the screen.

```dart
// live_walk_screen.dart — explicit instantiation
BlocProvider<LiveWalkCubit>(
  create: (_) => LiveWalkCubit(
    booking: widget.booking,
    bookingRepository:  sl<WalkBookingRepository>(),
    sessionRepository:  sl<WalkSessionRepository>(),
    walkerRepository:   sl<WalkerRepository>(),
    petRepository:      sl<PetRepository>(),
    tokenStorage:       sl<TokenStorage>(),
    trackingService:    WalkTrackingService(),
  )..start(),
  child: const _LiveWalkView(),
)
```

## Environment configuration

Base URLs are read from compile-time constants declared in `lib/core/config/env.dart`:

```dart
class Env {
  static const apiBaseUrl    = String.fromEnvironment('API_BASE_URL',
      defaultValue: 'http://api-balto.duckdns.org/api');
  static const signalrHubUrl = String.fromEnvironment('SIGNALR_HUB_URL',
      defaultValue: 'http://api-balto.duckdns.org/hubs');
}
```

To override at build time:

```bash
flutter run --dart-define=API_BASE_URL=https://staging.balto.app/api \
            --dart-define=SIGNALR_HUB_URL=https://staging.balto.app/hubs
```
