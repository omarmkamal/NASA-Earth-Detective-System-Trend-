@echo off
title NASA-EARTH Detective Trend - Local Preview
echo ========================================================
echo   NASA-EARTH Detective Trend - NASA Space Apps
echo ========================================================
echo.
echo Starting local web server on port 8765...
echo.
start "" "http://localhost:8765"
node "C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js" http-server -p 8765 -c-1
pause
