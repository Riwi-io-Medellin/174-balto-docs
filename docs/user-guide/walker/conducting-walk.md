---
id: conducting-walk
title: Conducting a Walk
sidebar_position: 3
---

# Conducting a Walk

## Before you start

- Make sure your phone has a GPS signal (walk outside or near a window).
- Grant Balto **location permission** if prompted — "While using the app" is sufficient, but "Always allow" provides the most reliable background tracking.
- Charge your phone before long walks. The GPS foreground service keeps the screen or background process active and uses more battery than usual.

## Starting the walk

1. Open Balto and go to **My Bookings → Upcoming** tab.
2. Find the booking. The **Start Walk** button appears up to 15 minutes before the scheduled start time.
3. Tap **Start Walk**. The walk screen opens and the app:
   - Creates a walk session on the server
   - Requests GPS permission if not already granted
   - Starts the GPS stream with a **foreground service notification** ("Balto — Walk in progress")
   - Begins uploading your position to the owner's map

## During the walk

The walk screen shows your live position on a map along with:

- **Elapsed time** — how long you have been walking
- **GPS accuracy** — how precise the current reading is (e.g., ±8 m)

The blue marker on the map follows your actual GPS position. You can lock your screen and put your phone in your pocket — the GPS will keep running and uploading in the background thanks to the foreground service.

:::info Foreground service notification
While the walk is active you will see a persistent notification: **"Balto — Walk in progress — Recording your route in the background."** This is normal and required for background GPS on Android. It disappears automatically when you end the walk.
:::

## Ending the walk

1. When the walk is finished, tap the red **End Walk** button.
2. A confirmation dialog asks "End walk? This will complete the walk and notify the owner."
3. Tap **End walk** to confirm.

The app:
- Stops the GPS stream and dismisses the foreground service notification
- Sends the final session data (total distance, total duration) to the server
- Navigates to the **Walk Summary** screen

## Walk Summary

After ending the walk you see a summary with:
- The full GPS route on a map (green = start, red = end)
- Total distance in kilometres
- Total walk duration

Tap **Done** to close the summary and return to your bookings list. The booking now appears in the **Completed** tab.

## Troubleshooting

### The Start Walk button is not visible
The button only appears within 15 minutes of the scheduled start time. Check the date and time on the booking. If the time has passed and the button never appeared, try pulling down to refresh the list.

### GPS is not acquiring a signal
Move outdoors or away from buildings. The walk screen shows "Acquiring GPS signal…" while it waits. Once a signal is acquired the map and position uploads begin automatically.

### The walk screen shows an error
Tap **Retry**. If the problem persists, check your internet connection — the app needs network access to create the walk session on the server.

### The owner says they can't see my position
Make sure the foreground service notification is visible in your notification bar. If it disappeared unexpectedly, the GPS stream was stopped by the OS. Exit the walk screen and tap Start Walk again.
