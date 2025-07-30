@echo off
setlocal enabledelayedexpansion

set "MYPAL_PATH=C:\Program Files\Mypal\mypal.exe"
set "SCRIPT_SRC=C:\Users\NarahariG\Documents\one\scripts"
set "FIREFOX_BASE=C:\Users\NarahariG\AppData\Roaming\Mypal\Profiles"
set "MAX_PROFILES=2"

:: Loop from 1 to MAX_PROFILES
for /L %%i in (1,1,%MAX_PROFILES%) do (
    set "FOUND_PROFILE="

    :: Find the profile ending with .%%i
    for /D %%P in ("%FIREFOX_BASE%\*") do (
        set "PROFILE_NAME=%%~nxP"
        set "SUFFIX=%%~xP"
        if "!SUFFIX!"==".%%i" (
            set "FOUND_PROFILE=%%~nxP"
        )
    )

    if defined FOUND_PROFILE (
        echo 🚀 Launching Mypal profile: !FOUND_PROFILE!

        :: Loop through each folder and get the *.user.js inside it
        for /D %%F in ("%SCRIPT_SRC%\*") do (
            for %%S in ("%%F\*.user.js") do (
                echo 🌐 Installing: %%~nxS
                start "" "%MYPAL_PATH%" -no-remote -profile "%FIREFOX_BASE%\!FOUND_PROFILE!" "file:///%%~fS"
                timeout /t 2 >nul
            )
        )
    ) else (
        echo ❌ No profile found for suffix .%%i
    )
)

endlocal
pause
