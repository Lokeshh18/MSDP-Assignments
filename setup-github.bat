@echo off
echo ====================================
echo   GitHub Repository Setup
echo ====================================
echo.

cd /d "%~dp0"

echo Step 1: Initializing Git repository...
git init
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git init failed. Make sure Git is installed.
    pause
    exit /b 1
)
echo SUCCESS: Git initialized!

echo.
echo Step 2: Adding all files to git...
git add .
echo SUCCESS: Files added!

echo.
echo Step 3: Creating first commit...
git commit -m "Initial commit: CampusHub - College Event Management Platform"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Commit failed
    pause
    exit /b 1
)
echo SUCCESS: Commit created!

echo.
echo Step 4: Renaming branch to main...
git branch -M main
echo SUCCESS: Branch renamed!

echo.
echo Step 5: Adding GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/Lokeshh18/MSDP-Assignments.git
echo SUCCESS: Remote added!

echo.
echo ====================================
echo   Ready to Push to GitHub!
echo ====================================
echo.
echo IMPORTANT: 
echo 1. Make sure you created the repository on GitHub:
echo    https://github.com/new
echo 2. Repository name: MSDP-Assignments
echo 3. DO NOT initialize with README
echo.
echo Press any key to continue with push...
pause >nul

echo.
echo Step 6: Pushing to GitHub...
echo You may be asked for your GitHub credentials.
echo If using 2FA, use a Personal Access Token.
echo.
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Push failed! Possible reasons:
    echo - Repository doesn't exist on GitHub
    echo - Wrong credentials
    echo - Need to set up SSH keys
    echo.
    echo To create repository, go to:
    echo https://github.com/Lokeshh18/MSDP-Assignments
    echo.
) else (
    echo.
    echo ====================================
    echo   SUCCESS! Pushed to GitHub!
    echo ====================================
    echo.
    echo Your code is now at:
    echo https://github.com/Lokeshh18/MSDP-Assignments
    echo.
)

echo Next: Deploy to Firebase
echo Run: deploy-firebase.bat
echo.
pause
