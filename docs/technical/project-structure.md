---
id: project-structure
title: Project Structure
sidebar_position: 2
---

# Project Structure

## Flutter app (`174-balto`)

```
lib/
├── core/
│   ├── config/          # Env (API base URL, SignalR hub URL)
│   ├── constants/       # AppColors and other app-wide constants
│   ├── di/              # GetIt dependency injection setup
│   ├── network/         # Dio client + AuthInterceptor
│   ├── services/        # Platform services (GPS, SignalR wrappers)
│   ├── storage/         # TokenStorage (flutter_secure_storage)
│   ├── utils/           # JWT decoder and other helpers
│   └── widgets/         # Shared core widgets
│
├── domain/
│   ├── entities/        # Pure Dart business objects
│   └── repositories/    # Abstract repository interfaces
│
├── data/
│   ├── datasources/     # Remote API callers (Dio)
│   ├── models/          # DTOs with fromJson / toJson
│   └── repositories/    # Repository implementations
│
└── presentation/
    ├── bloc/            # Cubits + States (one folder per feature)
    ├── screens/         # Full-page UI (one folder per domain area)
    └── widgets/         # Shared reusable widgets
```

## core/

| File / Folder | Purpose |
|---|---|
| `config/env.dart` | Base URLs for REST API and SignalR hub (compile-time constants) |
| `constants/app_colors.dart` | Brand colour palette used across the app |
| `di/injection.dart` | Registers all singletons and factories with GetIt |
| `network/api_client.dart` | Creates a configured Dio instance |
| `network/auth_interceptor.dart` | Attaches Bearer token to every request; refreshes on 401 |
| `services/walk_tracking_service.dart` | Owner-side SignalR client (receives location updates) |
| `services/walker_live_walk_service.dart` | Walker-side GPS stream with Android foreground service |
| `storage/token_storage.dart` | Read/write access & refresh tokens securely |
| `utils/jwt_decoder.dart` | Extracts `userId` from JWT without a network call |

## domain/entities/

| Entity | Key fields |
|---|---|
| `User` | id, firstName, lastName, email, photoUrl |
| `Pet` | id, name, breed, age, photoUrl |
| `Walker` | id, userId, name, photoUrl, bio, hourlyRate, rating |
| `WalkerProfile` | userId, bio, hourlyRate, rating, reviewCount |
| `Walk` | id, walkerId, clientUserId, scheduledAt, durationMinutes, status |
| `WalkBooking` | id, walkerId, clientUserId, slotStart, durationMinutes, status, walkSessionId, totalPrice |
| `WalkBookingStatus` | pending · accepted · inProgress · completed · rejected · walkerCancelled · ownerCancelled |
| `AuthTokens` | accessToken, refreshToken |
| `Business` | id, name, address, type, photoUrl, rating |
| `AvailabilitySlot` | dayOfWeek, startTime, endTime |
| `AvailabilityException` | date, reason |
| `AvailableSlot` | slotStart, slotEnd |

## domain/repositories/ (interfaces)

| Interface | Responsibilities |
|---|---|
| `AuthRepository` | Login, refresh token, logout |
| `UserRepository` | Get user by ID, update profile |
| `PetRepository` | CRUD for owner's pets |
| `WalkBookingRepository` | Create booking, list my bookings (with status filter), cancel, accept/reject |
| `WalkSessionRepository` | Start session, post location, finish session, get route |
| `WalkerRepository` | List walkers, get walker detail |
| `WalkerProfileRepository` | Get / create / update own walker profile |
| `WalkerAvailabilityRepository` | Get/set walker schedule and exceptions |
| `WalkingHistoryRepository` | Fetch completed walk history |
| `UploadRepository` | Upload images (photos for pets, profile) |

## presentation/screens/

| Folder | Screens |
|---|---|
| `auth/` | LoginScreen |
| `home/` | HomeScreen (live walk card + upcoming + quick care grid) |
| `walks/` | WalksPage (booking list), LiveWalkScreen (owner map), WalkRouteSummaryScreen |
| `walkers/` | WalkerListPage, WalkerProfilePage, BookingScreen, WalkerBookingsScreen, WalkerLiveWalkScreen |
| `profile/` | ProfileScreen, EditProfileScreen |
| `pets/` | ManagePetsScreen, AddPetScreen |
| `services/` | ServicesPage (walkers · vets · stores tabs) |

## presentation/bloc/

| Cubit | States | Manages |
|---|---|---|
| `AuthCubit` | AuthInitial / AuthLoading / AuthAuthenticated / AuthError | Login, logout, token storage |
| `ProfileCubit` | ProfileLoading / ProfileLoaded / ProfileError | User + pets + walk count |
| `MyWalksCubit` | MyWalksLoading / MyWalksLoaded / MyWalksError | Owner's booking list |
| `WalkerCubit` | WalkerLoading / WalkerLoaded / WalkerError | Walker search + detail |
| `WalkBookingCubit` | BookingIdle / BookingLoading / BookingSuccess / BookingError | Creating a new booking |
| `WalkerAvailabilityCubit` | WalkerAvailabilityLoading / Loaded / Error | Walker's schedule management |
| `WalkerBookingCubit` | WalkerBookingLoading / WalkerBookingLoaded / Error | Walker's incoming bookings |
| `LiveWalkCubit` *(inline)* | LiveWalkConnecting / Waiting / Active / Completed / Error | Owner's real-time walk map |
| `WalkerLiveWalkCubit` *(inline)* | WalkerLiveWalkStarting / Active / Ending / Completed / Error | Walker's live GPS upload |

`LiveWalkCubit` and `WalkerLiveWalkCubit` are marked *inline* because they are instantiated directly in their screens rather than registered in GetIt — see [Dependency Injection](/technical/di-setup).
