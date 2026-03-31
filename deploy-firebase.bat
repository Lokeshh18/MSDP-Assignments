@echo off
echo ====================================
echo   Firebase Deployment Script
echo ====================================
echo.

REM Check if firebase is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Firebase CLI is not installed!
    echo Installing Firebase CLI...
    npm install -g firebase-tools
)

echo.
echo Step 1: Building project for production...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Checking Firebase login...
firebase login:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Not logged in to Firebase. Logging in...
    firebase login
)

echo.
echo Step 3: Deploying to Firebase Hosting...
firebase deploy --only hosting

echo.
echo ====================================
echo   Deployment Complete!
echo ====================================
echo.
echo Your app is now deployed to Firebase Hosting
echo Check the URL above (usually https://your-project.web.app)
echo.
pause
