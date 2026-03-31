@echo off
echo ====================================
echo   GitHub & Firebase Deployment
echo ====================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    echo Then run this script again.
    pause
    exit /b 1
)

echo Step 1: Initializing Git repository...
git init
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git init failed
    pause
    exit /b 1
)

echo.
echo Step 2: Adding all files...
git add .

echo.
echo Step 3: Creating first commit...
git commit -m "Initial commit: CampusHub - College Event Management Platform"

echo.
echo Step 4: Renaming branch to main...
git branch -M main

echo.
echo Step 5: Adding GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/Lokeshh18/MSDP-Assignments.git

echo.
echo Step 6: Pushing to GitHub...
echo IMPORTANT: You may be prompted for GitHub credentials
echo If using 2FA, use a personal access token instead of password
git push -u origin main

echo.
echo ====================================
echo   GitHub Push Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Install Firebase CLI: npm install -g firebase-tools
echo 2. Login to Firebase: firebase login
echo 3. Initialize Firebase: firebase init hosting
echo 4. Build project: npm run build
echo 5. Deploy: firebase deploy
echo.
pause
