---
id: architecture
title: Architecture
sidebar_position: 1
---

# Architecture

Balto follows **Clean Architecture** principles, separating the codebase into three concentric layers. Each layer depends only inward — the domain layer has zero Flutter dependencies.

## Layer diagram

```
┌────────────────────────────────────────────┐
│              Presentation                  │
│  Screens · Widgets · BLoC Cubits · States │
├────────────────────────────────────────────┤
│                 Domain                     │
│  Entities · Repository interfaces          │
├────────────────────────────────────────────┤
│                  Data                      │
│  DTOs · Remote datasources · Repo impls    │
└────────────────────────────────────────────┘
        ↓ external services
   REST API · SignalR · GPS · SecureStorage
```

## Domain layer

The domain layer defines the **what**, not the **how**. It contains:

- **Entities** — plain Dart classes with no Flutter or serialisation imports (`WalkBooking`, `WalkerProfile`, `Pet`, `User`, …).
- **Repository interfaces** — abstract classes that declare what data operations are possible without specifying how they are performed.

Nothing in the domain layer imports `package:flutter`, `package:dio`, or any third-party package. This makes the business logic fully testable in isolation.

## Data layer

The data layer implements the repository interfaces and handles all network and storage concerns:

- **DTOs (Data Transfer Objects)** — model classes with `fromJson` / `toJson` that map raw API responses to domain entities. For example, `WalkBookingDto.fromJson()` parses the `status` field string (`"in_progress"`) into the `WalkBookingStatus.inProgress` enum value.
- **Remote datasources** — classes that call specific Dio endpoints. They own the URL paths and return DTOs.
- **Repository implementations** — wire a datasource to a domain repository interface; transform DTOs into entities before handing them to the presentation layer.

## Presentation layer

The presentation layer is split into:

- **Screens** — full-page widgets that provide a `BlocProvider` and host the visual tree.
- **Widgets** — reusable UI components (skeleton loaders, bottom nav, walk cards, …).
- **Cubits** — thin state-machine classes that call repositories and emit states. A cubit never calls a datasource directly; it always goes through a domain repository interface.
- **States** — sealed/abstract classes that represent every possible UI state for a feature (loading, loaded, error, …).

## Data flow example — booking a walk

```
UI taps "Book"
  → BookingCubit.book(walkerId, slotStart, duration)
    → WalkBookingRepository.createBooking(...)   ← domain interface
      → WalkBookingRemoteDatasource.create(...)  ← data layer
        → Dio POST /walk-bookings               ← network
      ← WalkBookingDto response
    ← WalkBooking entity
  ← BookingCubit emits BookingSuccess state
UI shows confirmation
```

## Dependency rule

- Presentation imports Domain ✅
- Data imports Domain ✅
- Domain imports nothing outside itself ✅
- Presentation imports Data ❌ (only via DI — see [Dependency Injection](/technical/di-setup))

## Key architectural decisions

### Why Cubit and not Bloc?

The app's state transitions are deterministic and don't need event-sourcing. Cubit offers the same separation of concerns with less boilerplate: you call a method on the cubit instead of dispatching an event object.

### Why Long Polling for SignalR?

The backend's nginx reverse proxy is not configured to forward WebSocket upgrade headers. Long Polling goes over standard HTTP and works through any proxy without infrastructure changes. This choice is made per-connection in `WalkTrackingService` via `HttpTransportType.LongPolling`.

### Why GetIt instead of Riverpod / Provider?

GetIt is a simple service locator that works outside the widget tree. Cubits are registered as factories so each BlocProvider gets a fresh instance; repositories and datasources are singletons. This avoids accidentally sharing mutable state between screens.
