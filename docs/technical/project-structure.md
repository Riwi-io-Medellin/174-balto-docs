---
id: project-structure
title: Project Structure
sidebar_position: 2
---

# Project Structure

```
lib/
├── core/
│   ├── constants/       # App-wide constants (AppColors, Env)
│   ├── di/              # GetIt dependency injection setup
│   ├── network/         # Dio client factory + AuthInterceptor
│   ├── services/        # Platform services (GPS, SignalR wrappers)
│   └── storage/         # TokenStorage (flutter_secure_storage)
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
| `constants/app_colors.dart` | Brand colour palette used across the app |
| `constants/env.dart` | Base URLs for REST API and SignalR hub |
| `di/injection.dart` | Registers all singletons and factories with GetIt |
| `network/dio_client.dart` | Creates a configured Dio instance |
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
| `WalkerProfile` | userId, bio, hourlyRate, rating, reviewCount |
| `WalkBooking` | id, walkerId, clientUserId, slotStart, durationMinutes, status, walkSessionId, totalPrice |
| `WalkSession` | id, bookingId, startedAt, finishedAt, routePoints |
| `WalkBookingStatus` | pending · accepted · inProgress · completed · rejected · walkerCancelled · ownerCancelled |

## domain/repositories/ (interfaces)

| Interface | Responsibilities |
|---|---|
| `UserRepository` | Get user by ID, update profile |
| `PetRepository` | CRUD for owner's pets |
| `WalkBookingRepository` | Create booking, list my bookings (with status filter), cancel, accept/reject |
| `WalkSessionRepository` | Start session, post location, finish session, get route |
| `WalkerProfileRepository` | Get/create walker profile |
| `NotificationRepository` | Unread count |

## presentation/screens/

| Folder | Screens |
|---|---|
| `auth/` | LoginScreen, RegisterScreen |
| `home/` | HomeScreen (live walk card + upcoming + quick care grid) |
| `walks/` | WalksPage (full booking list), LiveWalkScreen (owner map), WalkRouteSummaryScreen |
| `walkers/` | WalkerListPage, WalkerProfilePage, BookingScreen, WalkerBookingsScreen, WalkerLiveWalkScreen |
| `profile/` | ProfileScreen, EditProfileScreen |
| `pets/` | ManagePetsScreen, AddPetScreen |
| `services/` | ServicesPage (walkers · vets · stores tabs) |
| `coach/` | CoachScreen (AI assistant) |

## presentation/bloc/

| Cubit | State | Manages |
|---|---|---|
| `ProfileCubit` | ProfileLoading / ProfileLoaded / ProfileError | User + pets + walk count |
| `MyWalksCubit` | MyWalksLoading / MyWalksLoaded / MyWalksError | Owner's booking list |
| `LiveWalkCubit` | LiveWalkConnecting / LiveWalkWaiting / LiveWalkActive / LiveWalkCompleted / LiveWalkError | Owner's real-time walk map |
| `WalkerBookingCubit` | WalkerBookingLoading / WalkerBookingLoaded / WalkerBookingError | Walker's booking management |
| `WalkerLiveWalkCubit` | WalkerLiveWalkStarting / WalkerLiveWalkActive / WalkerLiveWalkEnding / WalkerLiveWalkCompleted / WalkerLiveWalkError | Walker's live map + GPS upload |
| `BookingCubit` | BookingIdle / BookingLoading / BookingSuccess / BookingError | Creating a new booking |
