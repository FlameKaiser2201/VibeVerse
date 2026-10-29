@echo off
echo ========================================================
echo  🚀 VibeVerse - Automated GitHub & Render Deployment
echo  Target Repo: https://github.com/FlameKaiser2201/vibeverse
echo ========================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not found in your PATH.
    echo Please download and install Git from https://git-scm.com/download/win
    echo Then re-run this script!
    pause
    exit /b 1
)

echo [1/5] Initializing Git repository...
if not exist ".git" (
    git init
)

echo [2/5] Adding all files to staging...
git add .

echo [3/5] Creating commit...
git commit -m "Launch VibeVerse: Complete social app with Python FastAPI backend, MySQL, React Native mobile, camera filters, mic voice notes & CI/CD APK builder"

echo [4/5] Setting main branch and remote repository...
git branch -M main
git remote remove origin >nul 2>nul
git remote add origin https://github.com/FlameKaiser2201/vibeverse.git

echo [5/5] Pushing to GitHub...
echo If prompted, please enter your GitHub credentials or Personal Access Token.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  🎉 SUCCESS! All codes pushed to your GitHub repository!
    echo.
    echo  1. APK Build: GitHub Actions is now compiling your APK!
    echo     Visit: https://github.com/FlameKaiser2201/vibeverse/actions
    echo.
    echo  2. Render Deployment: Connect your repo at:
    echo     https://dashboard.render.com/select-repo?type=blueprint
    echo ========================================================
) else (
    echo.
    echo [NOTE] Push failed. If the repository 'vibeverse' does not exist yet on GitHub:
    echo 1. Go to https://github.com/new
    echo 2. Create a new public or private repository named 'vibeverse'
    echo 3. Run this script again!
)

pause
