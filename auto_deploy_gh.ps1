# Auto-Deployment Script
# This script uses the GitHub CLI (gh) to authenticate and deploy

$ErrorActionPreference = "Stop"

function Test-Command ($cmd) {
    return (Get-Command $cmd -ErrorAction SilentlyContinue)
}

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Running GitHub Auto-Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# 1. Verify gh installation
if (-not (Test-Command gh)) {
    Write-Host "Attempting to locate gh..." -ForegroundColor Yellow
    $env:Path += ";C:\Program Files\GitHub CLI\"
    
    if (-not (Test-Command gh)) {
        Write-Host "❌ GitHub CLI (gh) not found in PATH." -ForegroundColor Red
        Write-Host "Please restart your terminal and run this script again."
        Pause
        exit
    }
}

# 2. Authenticate
Write-Host "🔑 Authenticating with GitHub..." -ForegroundColor Yellow
Write-Host "I will open a browser window. Please click 'Connect' or 'Authorize'." -ForegroundColor White
gh auth login --web -p https

# 3. Create Repo
Write-Host "📦 Creating Repository 'hospital-deploy-auto'..." -ForegroundColor Yellow
# Try to create. If name exists, try another.
try {
    gh repo create hospital-deploy-auto --public --source=. --remote=origin
}
catch {
    Write-Host "Repo name might be taken. Trying with timestamp..." -ForegroundColor Yellow
    $suffix = Get-Date -Format "yyyyMMddHHmm"
    gh repo create "hospital-deploy-$suffix" --public --source=. --remote=origin
}

# 4. Push Code
Write-Host "🚀 Pushing code..." -ForegroundColor Yellow
git push -u origin main

# 5. Open Render
Write-Host "🌐 Opening Render Dashboard..." -ForegroundColor Green
Start-Process "https://dashboard.render.com"

Write-Host "✅ DONE! Create a New Web Service in Render and select this repo." -ForegroundColor Green
Pause
