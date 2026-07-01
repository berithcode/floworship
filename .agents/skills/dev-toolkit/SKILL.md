---
name: dev-toolkit
description: Development environment paths for building and deploying the Koine Android app. Java, Android SDK, ADB locations. Use when building APK, deploying to device, or running gradle commands.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Dev Toolkit — Koine Android Environment

> Fixed paths for this development machine. Do NOT search — use directly.

---

## Environment Variables

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

## Tool Paths

| Tool | Path |
|------|------|
| `adb` | `C:\Users\marco\AppData\Local\Android\Sdk\platform-tools\adb.exe` |
| `java` | `C:\Program Files\Android\Android Studio\jbr\bin\java.exe` |
| `gradle` | Project-local (`android\gradlew.bat`) |
| Android SDK | `C:\Users\marco\AppData\Local\Android\Sdk` |
| Android Studio | `C:\Program Files\Android\Android Studio` |

## Device

- **ID:** `kzusv85t5xhqpvdu`
- **Type:** Physical Android device (USB)

## Build & Deploy Sequence

```powershell
# 1. Set Java (always required)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# 2. Sync web → Android
npx cap sync android

# 3. Build debug APK
cd android; ./gradlew assembleDebug

# 4. Install on device
C:\Users\marco\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk
```

> **Note:** Working directory is always `C:\Users\marco\Documents\BerithCode\Koine`
