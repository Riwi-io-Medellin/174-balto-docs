---
id: intro
title: Introduction
sidebar_position: 1
slug: /
---

# Balto

Balto is a mobile application that connects **dog owners** with professional **walkers**. Owners can browse available walkers, book a walk, and watch their dog's route live on a map — in real time, as it happens. Walkers receive booking requests, manage their schedule, and the app tracks their GPS position throughout the walk.

## What Balto does

| Feature | Owner | Walker |
|---|---|---|
| Browse walkers by service | ✅ | — |
| Book a walk slot | ✅ | — |
| Accept / reject bookings | — | ✅ |
| Live GPS map during walk | ✅ (viewer) | ✅ (broadcaster) |
| Walk route summary | ✅ | ✅ |
| Pet profile management | ✅ | — |
| Walker profile & hourly rate | — | ✅ |
| Push notifications | ✅ | ✅ |

## Technology stack

| Layer | Technology |
|---|---|
| Mobile app | Flutter 3.x / Dart |
| State management | flutter\_bloc (Cubit pattern) |
| Real-time tracking | SignalR (WebSocket / Long Polling) |
| REST API client | Dio |
| Maps | google\_maps\_flutter |
| GPS | geolocator + Android Foreground Service |
| Dependency injection | get\_it |
| Secure storage | flutter\_secure\_storage |
| UI fonts | Google Fonts (Inter) |

## How to read these docs

- **[Technical Documentation](/technical/architecture)** — for developers who need to understand or extend the codebase: architecture decisions, data flow, state management patterns, API integration, and real-time tracking internals.
- **[User Guide](/user-guide/overview)** — for end users and product stakeholders: how to use each feature as a dog owner or walker, step by step.
