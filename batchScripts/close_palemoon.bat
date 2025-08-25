@echo off
echo ======= Closing all Pale Moon instances =======
taskkill /F /T /IM palemoon.exe >nul 2>&1

echo ======= Cleaning session files from all Pale Moon profiles =======
set PROFILE_DIR=%APPDATA%\Moonchild Productions\Pale Moon\Profiles

for /D %%D in ("%PROFILE_DIR%\*") do (
    echo Cleaning profile: %%D
    del /F /Q "%%D\sessionstore.js" >nul 2>&1
    del /F /Q "%%D\recovery.jsonlz4" >nul 2>&1
    del /F /Q "%%D\sessionCheckpoints.json" >nul 2>&1
    del /F /Q "%%D\recovery.baklz4" >nul 2>&1
)

echo ======= Pale Moon will now start fresh without restoring tabs =======