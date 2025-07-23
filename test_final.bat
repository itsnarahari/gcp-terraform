@echo off
set "MYPAL_PATH=C:\Program Files\Mypal\mypal.exe"
set "FIRST_URL=https://ssotp3.online/"
set "FINAL_URL=https://sand.telangana.gov.in/TGSandBazaar/Masters/OuterHome.aspx"

echo Mypalలో మొదటి URLను ప్రారంభిస్తున్నాము...
REM ఇది Mypal యొక్క మొదటి ఇన్‌స్టాన్స్‌ను తెరుస్తుంది.
REM -no-remote మరియు -P ఆప్షన్‌లను తొలగించడం ద్వారా,
REM తదుపరి 'start' కమాండ్‌లు అదే ఇన్‌స్టాన్స్‌లో కొత్త ట్యాబ్‌లను తెరుస్తాయి.
start "" "%MYPAL_PATH%" "%FIRST_URL%"

REM మొదటి URL పూర్తిగా లోడ్ కావడానికి కొంత సమయం ఇవ్వండి.
REM వెబ్‌సైట్ మరియు మీ ఇంటర్నెట్ వేగాన్ని బట్టి ఈ సమయాన్ని పెంచాల్సి రావచ్చు.
timeout /nobreak /t 10 >nul 

echo అదే Mypal ఇన్‌స్టాన్స్‌లో రెండవ URLను కొత్త ట్యాబ్‌గా ప్రారంభిస్తున్నాము...
start "" "%MYPAL_PATH%" "%FINAL_URL%"

echo.
echo స్క్రిప్ట్ పూర్తయింది. దయచేసి Mypal విండోను తనిఖీ చేయండి.