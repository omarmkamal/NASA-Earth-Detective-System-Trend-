@echo off
title Push to GitHub - NASA-EARTH Detective Trend
echo ========================================================
echo   Push NASA-EARTH Detective Trend to GitHub
echo ========================================================
echo.
echo Make sure you have created an empty repository on GitHub:
echo https://github.com/new
echo Recommended repository name: nasa-earth-detective-trend
echo.
set /p REPO_URL="Paste your GitHub repository URL (e.g. https://github.com/USER/REPO.git): "
echo.
if "%REPO_URL%"=="" (
    echo No URL provided. Aborting.
    pause
    exit /b
)

echo Adding remote origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Pushing code to GitHub...
git push -u origin main

echo.
echo ========================================================
echo   Done! Next step:
echo   1. Go to your repo on GitHub: Settings -^> Pages
echo   2. Source: "Deploy from a branch"
echo   3. Branch: "main", Folder: "/ (root)" -^> Click Save!
echo   Your site will be live at:
echo   https://YOUR_USERNAME.github.io/YOUR_REPO/
echo ========================================================
echo.
pause
