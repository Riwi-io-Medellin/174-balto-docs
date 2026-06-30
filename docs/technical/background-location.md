---
id: background-location
title: Background Location
sidebar_position: 7
---

# Background Location

When the walker locks their screen during a walk, the GPS stream must keep running so the owner continues to see position updates. Without special handling, Android and iOS suspend the app process within seconds of backgrounding.

## Android — Foreground Service

Android's solution is a **Foreground Service**: a persistent system notification signals to the OS that this process is actively doing work on behalf of the user and must not be killed.

The `geolocator_android` package integrates directly with the Android foreground service mechanism. When `ForegroundNotificationConfig` is provided to `AndroidSettings`, the plugin automatically starts a foreground service when location streaming begins.

### Permissions required

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

`FOREGROUND_SERVICE_LOCATION` is required on Android 14+ when the foreground service uses location data.

### Flutter code

```dart
// lib/core/services/walker_live_walk_service.dart
if (Platform.isAndroid) {
  settings = AndroidSettings(
    accuracy: LocationAccuracy.high,
    distanceFilter: 10,   // emit only when moved ≥ 10 metres
    foregroundNotificationConfig: const ForegroundNotificationConfig(
      notificationTitle: 'Balto — Walk in progress',
      notificationText: 'Recording your route in the background.',
      enableWakeLock: true,   // prevents CPU sleep
      enableWifiLock: true,   // keeps WiFi radio awake for REST uploads
    ),
  );
}
```

### What the walker sees

While the walk is active the walker will see a persistent notification in their status bar:

```
[Balto icon]  Balto — Walk in progress
              Recording your route in the background.
```

This notification is not dismissable while the service is running. It disappears automatically when the walk ends (`WalkerLiveWalkService.stop()` is called).

### Service lifecycle

```
WalkerLiveWalkCubit.start()
  └── WalkerLiveWalkService.start()
        └── Geolocator.getPositionStream(AndroidSettings)
              └── geolocator_android plugin starts foreground service
                    └── notification appears in status bar

WalkerLiveWalkCubit.endWalk()
  └── WalkerLiveWalkService.stop()
        └── StreamSubscription.cancel()
              └── geolocator_android stops foreground service
                    └── notification disappears
```

## iOS — Background Modes

iOS uses a different mechanism: **background modes** declared in the app bundle. When `location` is declared as a background mode, iOS allows the app to continue receiving `CLLocationManager` updates while in the background, as long as the updates are meaningful.

### Info.plist configuration

```xml
<!-- ios/Runner/Info.plist -->
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
</array>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Balto needs your location to track the walk in real time.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Balto needs your location to track the walk in real time.</string>
```

On iOS, `NSLocationAlwaysAndWhenInUseUsageDescription` is shown when the system prompts the user to allow "Always" location access, which is needed for reliable background updates.

### No extra Flutter code needed for iOS

The standard `LocationSettings` works on iOS once the background mode is declared. The `UIBackgroundModes: location` key is what tells the OS to continue delivering location events.

## Permission flow (both platforms)

`WalkerLiveWalkCubit` checks and requests permissions before starting the GPS stream:

```dart
Future<void> start() async {
  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    emit(WalkerLiveWalkError('Location permission required'));
    return;
  }
  // ... proceed to start session and GPS
}
```

If the walker denies location access the walk cannot start and `WalkerLiveWalkError` is emitted.

## Why not a background isolate?

A background isolate (via `flutter_background_service` or `WorkManager`) adds significant complexity: isolates cannot share memory with the main isolate, requiring bi-directional port communication for state updates. The foreground service approach (`geolocator_android`'s built-in support) achieves the same result with no inter-isolate communication: the stream continues on the main isolate, the UI stays responsive, and position events flow directly into the cubit.
