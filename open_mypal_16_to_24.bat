@echo off
set "MYPAL_PATH=C:\Program Files\Mypal\mypal.exe"
set "FIRST_URL=https://ssotp3.online/"

for /L %%i in (16,1,24) do (
    set "PROFILE_NAME=%%i"
    call :openBrowser "%%PROFILE_NAME%%"
)
goto :eof

:openBrowser
start "" "%MYPAL_PATH%" -no-remote -P %1 "%FIRST_URL%"
goto :eof
