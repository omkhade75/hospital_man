# Vercel Deployment Script
Write-Host "Starting Vercel Deployment..." -ForegroundColor Cyan
Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
npm install -g vercel

Write-Host "Deploying..." -ForegroundColor Cyan
Write-Host "If asked to log in, please check your email or browser." -ForegroundColor Yellow
npx vercel --prod

Write-Host "Deployment Complete!" -ForegroundColor Green
Pause
