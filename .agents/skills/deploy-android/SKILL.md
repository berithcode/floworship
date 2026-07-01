---
name: deploy-android
description: Complete Android deploy pipeline for Koine (and similar Capacitor apps). Build, sync, install on device. Use when deploying APK to physical device or emulator.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Deploy Android — Complete Pipeline

> Step-by-step instructions for building and deploying Capacitor Android apps.
> Works for Koine and any similar Vite + Capacitor project.

---

## Prerequisites

| Requirement | Path / Version |
|-------------|----------------|
| Java (JBR) | `C:\Program Files\Android\Android Studio\jbr` |
| Android SDK | `C:\Users\marco\AppData\Local\Android\Sdk` |
| ADB | `C:\Users\marco\AppData\Local\Android\Sdk\platform-tools\adb.exe` |
| Node.js | v18+ |
| Capacitor | `@capacitor/cli` in package.json |

---

## Environment Variables (PowerShell)

Always set these before any Android command:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

---

## Full Deploy Pipeline

### Step 1 — Install Dependencies (first time only)

```powershell
npm install
```

### Step 2 — Build the Web App

```powershell
npm run build
```

This runs `tsc && vite build` and outputs to `dist/`.

### Step 3 — Sync Web → Android

```powershell
npx cap sync android
```

This copies `dist/` into `android/app/src/main/assets/public/` and updates Capacitor plugins.

### Step 4 — Build the Debug APK

```powershell
cd android
./gradlew assembleDebug
cd ..
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 5 — Install on Device

```powershell
C:\Users\marco\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk
```

### Step 6 — Verify

```powershell
C:\Users\marco\AppData\Local\Android\Sdk\platform-tools\adb.exe shell am start -n com.berith.koineapp/.MainActivity
```

---

## One-Shot Deploy (all steps)

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npm run build; if ($?) { npx cap sync android }; if ($?) { cd android; ./gradlew assembleDebug; cd .. }; if ($?) { C:\Users\marco\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk }
```

---

## Useful Commands

### Check connected devices

```powershell
C:\Users\marco\AppData\Local\Android\Sdk\platform-tools\adb.exe devices
```

### Uninstall old app first (clean install)

```powershell
C:\Users\marco\AppData\Local\Android\Sdk\platform-tools\adb.exe uninstall com.berith.koineapp
```

### View device logs

```powershell
C:\Users\marco\AppData\Local\Android\Sdk\platform-tools\adb.exe logcat -d | Select-Object -Last 50
```

### Clear logcat buffer

```powershell
C:\Users\marco\AppData\Local\Android\Sdk\platform-tools\adb.exe logcat -c
```

### Open Chrome DevTools for WebView debugging

1. USB debugging ON on device
2. Open Chrome → `chrome://inspect/#devices`
3. Find the WebView under your device
4. Click "Inspect"

---

## Release APK (signed)

For production/play store:

```powershell
cd android
./gradlew assembleRelease
cd ..
```

Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

To sign:

```powershell
# Using keytool (first time)
keytool -genkey -v -keystore koine-release.keystore -alias koine -keyalg RSA -keysize 2048 -validity 10000

# Using jarsigner
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore koine-release.keystore android/app/build/outputs/apk/release/app-release-unsigned.apk koine

# Zipalign
& "$env:ANDROID_HOME\build-tools\34.0.0\zipalign" -v -p 4 android/app/build/outputs/apk/release/app-release-unsigned.apk android/app/build/outputs/apk/release/app-release-aligned.apk

# APK Signer
& "$env:ANDROID_HOME\build-tools\34.0.0\apksigner.bat" sign --ks koine-release.keystore --ks-key-alias koine android/app/build/outputs/apk/release/app-release-aligned.apk
```

---

## Common Issues & Fixes

### `JAVA_HOME is not set`

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

### `SDK location not found`

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

### `adb: device not found`

- Check USB cable connection
- Enable USB debugging on device
- Try `adb kill-server && adb start-server`

### `gradlew permission denied`

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### `Capacitor sync errors`

```powershell
# Clean and re-sync
Remove-Item -Recurse -Force android/app/src/main/assets/public
npx cap sync android
```

### `App crashes on launch`

```powershell
# Check logs
C:\Users\marco\AppData\Local\Android\Sdk\platform-tools\adb.exe logcat -d | Select-String "koine|chromium|AndroidRuntime" | Select-Object -Last 30
```

### `Build fails with memory error`

Edit `android/gradle.properties`:

```
org.gradle.jvmargs=-Xmx4096m
org.gradle.daemon=true
```

---

## Project Structure

```
Koine/
├── src/                    ← Vite + React source
├── dist/                   ← Build output (web)
├── android/                ← Capacitor Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/   ← Synced from dist/
│   │   │   └── java/            ← Native Android code
│   │   └── build/outputs/apk/   ← APK output
│   ├── gradlew.bat
│   └── build.gradle
├── capacitor.config.ts     ← Capacitor config
└── package.json
```

---

## Key Config

From `capacitor.config.ts`:

| Setting | Value |
|---------|-------|
| App ID | `com.berith.koineapp` |
| App Name | `Koiné` |
| Web Dir | `dist` |
| Android Scheme | `https` |
| Splash Duration | 1500ms |
| Splash Background | `#FAF9F6` |

---

## Quick Reference Table

| Action | Command |
|--------|---------|
| Full deploy (debug) | Build → Sync → Gradle → ADB Install |
| Quick rebuild | `npx cap sync android` → Gradle → ADB Install |
| Clean build | `Remove-Item -Recurse -Force android/app/build` → Full |
| Check device | `adb devices` |
| View logs | `adb logcat -d \| Select-Object -Last 50` |
| Uninstall | `adb uninstall com.berith.koineapp` |
| WebView debug | Chrome → `chrome://inspect` |
