@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot
set ANDROID_HOME=C:\Users\rajat\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%PATH%

cd /d D:\Projects\otp-relay\OTP-Relay\android

echo === Java Version ===
java -version

echo.
echo === Building APK ===
call gradlew.bat :app:assembleDebug --no-daemon

echo.
echo === Build Complete ===
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo APK: app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Installing on device...
    call "%ANDROID_HOME%\platform-tools\adb.exe" install -r app\build\outputs\apk\debug\app-debug.apk
) else (
    echo BUILD FAILED - check errors above
)
