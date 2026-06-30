---
id: backend-architecture
title: Backend Architecture
sidebar_position: 8
---

# Backend Architecture

The Balto backend (`174-balto-backend`) is a **.NET 10 Minimal API** built with Clean Architecture. It exposes REST endpoints and a SignalR hub for the Flutter mobile app.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | .NET 10 |
| API style | Minimal API (no controllers) |
| Database | PostgreSQL |
| ORM | Entity Framework Core + Npgsql |
| Identity | ASP.NET Core Identity |
| Auth | JWT Bearer (HS256) with refresh tokens |
| Real-time | SignalR (planned — hub not yet wired) |
| Containerisation | Docker + docker-compose |

## Solution structure

```
back-end-pets.sln
│
├── BackEndPets.Domain/          # Core — no external dependencies
│   ├── Entities/                # Domain models (planned: Pet, Walker…)
│   ├── Interfaces/              # Repository contracts (ICrudRepository<T>)
│   └── Common/                  # Base classes, value objects
│
├── BackEndPets.Application/     # Business logic
│   ├── DTOs/                    # Request / response objects per module
│   │   ├── Auth/                # LoginRequest, RefreshTokenRequest, AuthResponse…
│   │   ├── Users/               # CreateUserRequest, UpdateUserRequest, UserResponse…
│   │   └── Common/              # ApiErrorResponse
│   ├── Interfaces/              # Service contracts (IAuthService, IUserService)
│   └── DependencyInjection.cs   # Registers application services
│
├── BackEndPets.Infrastructure/  # Data access and external services
│   ├── Identity/                # AppIdentityDbContext, ApplicationUser, IdentitySeeder
│   ├── Repositories/            # InMemoryCrudRepository<T> (generic in-memory store)
│   ├── Services/                # AuthService, UserService
│   └── DependencyInjection.cs   # Registers EF Core, Identity, services
│
└── back-end-pets/ (API)         # HTTP entry point
    ├── Endpoints/               # Endpoint groups (AuthEndpoints, UsersEndpoints)
    ├── Dockerfile               # Multi-stage Docker build
    └── Program.cs               # App startup
```

## Layer dependency rule

```
API → Application → Domain ← Infrastructure
```

Each layer only references the layer directly inside it. `Domain` has **no external package references**.

## Identity and database

`AppIdentityDbContext` extends `IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>`. The `ApplicationUser` entity maps to the `users` table with snake_case column names:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `first_name` | text | |
| `last_name` | text | |
| `email` | text | Unique |
| `id_number` | text | National ID number |
| `id_type` | text | e.g. CC, Passport |
| `location` | text | City / region |
| `address` | text | |
| `phone` | text | |
| `phone_extra` | text | Optional second phone |
| `photo_url` | text | |
| `created_at` | timestamptz | |

ASP.NET Identity tables (`identity_roles`, `identity_user_roles`, etc.) are also mapped to snake_case.

## Infrastructure DI registration

```csharp
// BackEndPets.Infrastructure/DependencyInjection.cs
services.AddDbContext<AppIdentityDbContext>(options =>
    options.UseNpgsql(connectionString));

services.AddIdentityCore<ApplicationUser>(options => { ... })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppIdentityDbContext>()
    .AddDefaultTokenProviders();

services.AddScoped<IAuthService, AuthService>();
services.AddScoped<IUserService, UserService>();

// Generic in-memory CRUD used for entities not yet persisted to PostgreSQL
services.AddSingleton(typeof(ICrudRepository<>), typeof(InMemoryCrudRepository<>));
```

## Startup flow

`Program.cs` runs on start:

1. Configures JWT Bearer authentication (issuer, audience, signing key)
2. Calls `AddApplicationServices()` + `AddInfrastructureServices()`
3. **Runs EF Core migrations** automatically (`db.Database.MigrateAsync()`)
4. **Seeds the demo admin user** (`IdentitySeeder.SeedDemoUserAsync`)
5. Maps endpoints: `/health`, Swagger (dev only), `/api/auth/*`, `/api/users/*`

## Demo seed user

On every cold start the seeder creates this user if it doesn't exist:

| Field | Value |
|---|---|
| Email | `admin@pawexplorers.com` |
| Password | `Password123!` |

Use this account to obtain a JWT token when testing the API locally.

## Local setup

### Prerequisites

- .NET 10 SDK
- PostgreSQL running locally (or via Docker)

### Connection string

Create `back-end-pets/appsettings.Development.json` (not committed):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=pets_db;Username=postgres_pets;Password=YOUR_PASSWORD"
  }
}
```

### Run

```bash
dotnet run --project back-end-pets/back-end-pets.csproj
```

API available at `http://localhost:5000`. Swagger UI at `http://localhost:5000/swagger` (development only).

### Docker

```bash
cd back-end-pets
docker build -t balto-backend .
docker run -p 5000:8080 \
  -e ConnectionStrings__DefaultConnection="Host=host.docker.internal;..." \
  balto-backend
```

## Branch flow

```
feature/* → dev → staging → main
```

- `feature/*` always branches from `dev`
- Never commit directly to `main` or `staging`
- Merge to `main` only after `staging` is validated
