@echo off
setlocal enabledelayedexpansion

:: List of IPs to test (from both p1 and p2 VMs)
set IPs=(
    35.244.37.107
    34.93.164.36
    35.244.62.73
    35.200.216.107
    34.131.175.254
    34.131.216.43
    34.131.101.112
    34.131.237.95
    34.93.14.98
    34.100.199.60
    34.100.130.110
    35.244.19.126
    34.131.176.255
    34.131.2.110
    34.131.126.86
    34.131.92.41
)

:: Loop through IPs and call test function
for %%I in %IPs% do (
    call :test_ip %%I
)

pause
exit /b

:: Function to test each IP
:test_ip
set ip=%1
set retries=0

:retry
echo Testing %ip%:3128 ... (attempt !retries!)

powershell -Command "try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('%ip%', 3128); if ($c.Connected) { Write-Host 'Success' -ForegroundColor Green; $c.Close(); exit 0 } else { throw 'Failed' } } catch { Write-Host 'Failed' -ForegroundColor Red; exit 1 }"
if errorlevel 1 (
    set /a retries+=1
    if !retries! lss 3 (
        echo Retry !retries! for %ip%...
        timeout /t 2 >nul
        goto retry
    ) else (
        echo Failed to connect to %ip%:3128 after 3 tries.
    )
)
exit /b
