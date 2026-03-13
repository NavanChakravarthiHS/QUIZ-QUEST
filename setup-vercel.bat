@echo off
REM QUIZ-QUEST Vercel Setup Script (Windows PowerShell)
REM This script helps prepare your project for Vercel deployment

echo.
echo ================================================
echo  QUIZ-QUEST - Preparing for Vercel Deployment
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 14+ first.
    exit /b 1
)

echo [OK] Node.js version:
node -v
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Vercel CLI is not installed.
    set /p install_vercel="Do you want to install it now? (y/n): "
    if /i "%install_vercel%"=="y" (
        call npm install -g vercel
        echo [OK] Vercel CLI installed
    )
) else (
    echo [OK] Vercel CLI is installed
)
echo.

REM Install all dependencies
echo [STEP] Installing dependencies...
call npm install
call npm install --prefix backend
call npm install --prefix frontend
echo [OK] All dependencies installed
echo.

REM Build frontend
echo [STEP] Building frontend...
call npm run build --prefix frontend
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed
    exit /b 1
)
echo [OK] Frontend built successfully
echo.

REM Check for .env files
echo [INFO] Checking environment configuration...
if exist ".env" (
    echo [WARN] Root .env file found. Remember to set environment variables in Vercel dashboard:
    echo        - MONGODB_URI
    echo        - JWT_SECRET
    echo        - NODE_ENV
) else (
    echo [INFO] No root .env file found. Make sure to set environment variables in Vercel.
)

if exist "backend\.env" (
    echo [WARN] Backend .env found. These values must be set in Vercel environment variables.
)
echo.

REM Show .env.example
if exist ".env.example" (
    echo ================================================
    echo  Required Environment Variables:
    echo ================================================
    type .env.example
    echo.
)

REM Git check
if exist ".git" (
    echo [OK] Git repository detected
    
    REM Check for uncommitted changes
    git diff --quiet
    if %ERRORLEVEL% NEQ 0 (
        echo [WARN] You have uncommitted changes. Consider committing before deployment:
        git status --short
    ) else (
        echo [OK] No uncommitted changes
    )
) else (
    echo [WARN] No Git repository found. Initialize Git for easier Vercel deployment:
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit"
)
echo.

echo ================================================
echo  Setup Complete!
echo ================================================
echo.
echo Next Steps:
echo 1. Push your code to GitHub/GitLab/Bitbucket
echo 2. Go to https://vercel.com and create a new project
echo 3. Import your repository
echo 4. Add environment variables in Vercel dashboard:
echo    - MONGODB_URI ^(^MongoDB Atlas connection string^)
echo    - JWT_SECRET ^(^strong random string^)
echo    - NODE_ENV=production
echo 5. Deploy!
echo.
echo For detailed instructions, see VERCEL_DEPLOYMENT.md
echo.

pause
