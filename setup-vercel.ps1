# QUIZ-QUEST Vercel Setup Script (PowerShell)
# This script helps prepare your project for Vercel deployment

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " QUIZ-QUEST - Preparing for Vercel Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed. Please install Node.js 14+ first." -ForegroundColor Red
    exit 1
}

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "[OK] Vercel CLI is installed: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Vercel CLI is not installed." -ForegroundColor Yellow
    $install = Read-Host "Do you want to install it now? (y/n)"
    if ($install -eq 'y') {
        Write-Host "Installing Vercel CLI..." -ForegroundColor Cyan
        npm install -g vercel
        Write-Host "[OK] Vercel CLI installed" -ForegroundColor Green
    }
}

Write-Host ""

# Install all dependencies
Write-Host "[STEP] Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit 1 }

npm install --prefix backend
if ($LASTEXITCODE -ne 0) { exit 1 }

npm install --prefix frontend
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[OK] All dependencies installed" -ForegroundColor Green
Write-Host ""

# Build frontend
Write-Host "[STEP] Building frontend..." -ForegroundColor Cyan
npm run build --prefix frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Check for .env files
Write-Host "[INFO] Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "[WARN] Root .env file found. Remember to set environment variables in Vercel dashboard:" -ForegroundColor Yellow
    Write-Host "       - MONGODB_URI" -ForegroundColor Yellow
    Write-Host "       - JWT_SECRET" -ForegroundColor Yellow
    Write-Host "       - NODE_ENV" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] No root .env file found. Make sure to set environment variables in Vercel." -ForegroundColor Gray
}

if (Test-Path "backend\.env") {
    Write-Host "[WARN] Backend .env found. These values must be set in Vercel environment variables." -ForegroundColor Yellow
}
Write-Host ""

# Show .env.example
if (Test-Path ".env.example") {
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host " Required Environment Variables:" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Get-Content .env.example
    Write-Host ""
}

# Git check
if (Test-Path ".git") {
    Write-Host "[OK] Git repository detected" -ForegroundColor Green
    
    # Check for uncommitted changes
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "[WARN] You have uncommitted changes. Consider committing before deployment:" -ForegroundColor Yellow
        git status --short
    } else {
        Write-Host "[OK] No uncommitted changes" -ForegroundColor Green
    }
} else {
    Write-Host "[WARN] No Git repository found. Initialize Git for easier Vercel deployment:" -ForegroundColor Yellow
    Write-Host "    git init" -ForegroundColor Gray
    Write-Host "    git add ." -ForegroundColor Gray
    Write-Host "    git commit -m 'Initial commit'" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Push your code to GitHub/GitLab/Bitbucket" -ForegroundColor White
Write-Host "2. Go to https://vercel.com and create a new project" -ForegroundColor White
Write-Host "3. Import your repository" -ForegroundColor White
Write-Host "4. Add environment variables in Vercel dashboard:" -ForegroundColor White
Write-Host "   - MONGODB_URI (MongoDB Atlas connection string)" -ForegroundColor Gray
Write-Host "   - JWT_SECRET (strong random string)" -ForegroundColor Gray
Write-Host "   - NODE_ENV=production" -ForegroundColor Gray
Write-Host "5. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see VERCEL_DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""
