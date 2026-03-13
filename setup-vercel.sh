#!/bin/bash

# QUIZ-QUEST Vercel Setup Script
# This script helps prepare your project for Vercel deployment

echo "🚀 QUIZ-QUEST - Preparing for Vercel Deployment"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI is not installed."
    read -p "Do you want to install it now? (y/n) " install_vercel
    if [ "$install_vercel" = "y" ]; then
        npm i -g vercel
        echo "✅ Vercel CLI installed"
    fi
else
    echo "✅ Vercel CLI is installed"
fi
echo ""

# Install all dependencies
echo "📦 Installing dependencies..."
npm install
npm install --prefix backend
npm install --prefix frontend
echo "✅ All dependencies installed"
echo ""

# Build frontend
echo "🔨 Building frontend..."
npm run build --prefix frontend
echo "✅ Frontend built successfully"
echo ""

# Check for .env files
echo "🔍 Checking environment configuration..."
if [ -f ".env" ]; then
    echo "⚠️  Root .env file found. Remember to set environment variables in Vercel dashboard:"
    echo "   - MONGODB_URI"
    echo "   - JWT_SECRET"
    echo "   - NODE_ENV"
else
    echo "ℹ️  No root .env file found. Make sure to set environment variables in Vercel."
fi

if [ -f "backend/.env" ]; then
    echo "⚠️  Backend .env found. These values must be set in Vercel environment variables."
fi
echo ""

# Show .env.example
if [ -f ".env.example" ]; then
    echo "📋 Required Environment Variables:"
    echo "-----------------------------------"
    cat .env.example
    echo ""
fi

# Git check
if [ -d ".git" ]; then
    echo "✅ Git repository detected"
    
    # Check for uncommitted changes
    if ! git diff --quiet; then
        echo "⚠️  You have uncommitted changes. Consider committing before deployment:"
        git status --short
    else
        echo "✅ No uncommitted changes"
    fi
else
    echo "⚠️  No Git repository found. Initialize Git for easier Vercel deployment:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
fi
echo ""

echo "✨ Setup Complete!"
echo "==================="
echo ""
echo "Next Steps:"
echo "1. Push your code to GitHub/GitLab/Bitbucket"
echo "2. Go to https://vercel.com and create a new project"
echo "3. Import your repository"
echo "4. Add environment variables in Vercel dashboard:"
echo "   - MONGODB_URI (MongoDB Atlas connection string)"
echo "   - JWT_SECRET (strong random string)"
echo "   - NODE_ENV=production"
echo "5. Deploy!"
echo ""
echo "For detailed instructions, see VERCEL_DEPLOYMENT.md"
echo ""
