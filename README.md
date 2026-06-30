# Balto — Documentation

This repository contains the official documentation for **Balto**, a Flutter mobile application that connects dog owners with professional walkers and streams the walker's live GPS position to the owner in real time.

The docs are built with [Docusaurus 3](https://docusaurus.io/) and are published to GitHub Pages at:

> **https://riwi-io-medellin.github.io/174-balto-docs/**

---

## Documentation structure

```
docs/
├── intro.md                        # Project overview and feature table
├── technical/
│   ├── architecture.md             # Clean Architecture layers, data flow, ADRs
│   ├── project-structure.md        # Folder map, screens, cubits, entities, repositories
│   ├── state-management.md         # Cubit pattern, state machines, WalkBookingStatus enum
│   ├── api-integration.md          # Dio client, AuthInterceptor, all REST endpoints, DTO mapping
│   ├── realtime-tracking.md        # SignalR architecture, GPS fan-out, distance calculation
│   ├── di-setup.md                 # GetIt registrations, factory vs singleton, env config
│   └── background-location.md      # Android foreground service, iOS background modes
└── user-guide/
    ├── overview.md                 # Roles, navigation tabs
    ├── owner/
    │   ├── getting-started.md      # Account, profile, adding pets
    │   ├── booking-walks.md        # Booking wizard, statuses, cancellation
    │   ├── live-tracking.md        # Live map, connection states
    │   └── walk-history.md         # Walk summary, route view, Walks tab sections
    └── walker/
        ├── getting-started.md      # Application, profile setup
        ├── managing-bookings.md    # Availability, accept/reject, booking tabs
        └── conducting-walk.md      # Start walk, background GPS, end walk, troubleshooting
```

---

## Running locally

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- npm 9 or higher

### Setup

```bash
# 1. Clone this repository
git clone https://github.com/Riwi-io-Medellin/174-balto-docs.git
cd 174-balto-docs

# 2. Install dependencies
npm install

# 3. Start the local dev server (hot reload enabled)
npm run start
```

The site opens automatically at `http://localhost:3000/174-balto-docs/`.

### Build

```bash
npm run build
```

The static output is generated in the `build/` directory. Test the production build locally with:

```bash
npm run serve
```

---

## Deploying to GitHub Pages

The site is deployed to GitHub Pages from the `gh-pages` branch. To publish:

```bash
# Using npm (requires GIT_USER to be set)
GIT_USER=<your-github-username> npm run deploy
```

Or push to the `main` branch and let the GitHub Actions workflow handle it automatically if one is configured.

---

## Tech stack

| Tool | Version | Purpose |
|---|---|---|
| [Docusaurus](https://docusaurus.io/) | 3.10.x | Static site generator |
| [React](https://react.dev/) | 18.x | UI runtime (bundled by Docusaurus) |
| [Prism](https://prismjs.com/) | 2.x | Syntax highlighting (Dart, YAML, JSON, Bash) |

---

## Related repositories

| Repo | Description |
|---|---|
| [174-balto](https://github.com/Riwi-io-Medellin/174-balto) | Flutter mobile app (main codebase) |
| [174-balto-docs](https://github.com/Riwi-io-Medellin/174-balto-docs) | This repository — Docusaurus documentation |

---

## Contributing

1. Create a branch from `main` — `docs/your-topic`
2. Edit or add Markdown files inside `docs/`
3. Run `npm run start` to preview changes locally
4. Open a pull request against `main`

Page IDs must match the `id` field in the frontmatter and the entry in `sidebars.js`. When adding a new page, register it in the appropriate sidebar array in `sidebars.js`.
