@echo off
echo ======= Closing all Mypal browser instances =======
taskkill /F /T /IM mypal.exe >nul 2>&1

echo ======= Cleaning session files from all Mypal profiles =======
set PROFILE_DIR=%APPDATA%\Mypal\Profiles

for /D %%D in ("%PROFILE_DIR%\*") do (
    echo Cleaning profile: %%D
    del /F /Q "%%D\sessionstore.js" >nul 2>&1
    del /F /Q "%%D\recovery.jsonlz4" >nul 2>&1
    del /F /Q "%%D\sessionCheckpoints.json" >nul 2>&1
    del /F /Q "%%D\recovery.baklz4" >nul 2>&1
)

echo ======= Mypal will now start fresh without restoring tabs =======
pause
