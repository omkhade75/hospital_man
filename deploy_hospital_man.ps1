# Deploy Script for 'hospital_man'
# This script handles GitHub authentication and pushing code.

$ErrorActionPreference = "Stop"

function Get-GhPath {
    if (Get-Command gh -ErrorAction SilentlyContinue) { return "gh" }
    if (Test-Path "C:\Program Files\GitHub CLI\gh.exe") { return "C:\Program Files\GitHub CLI\gh.exe" }
    return $null
}

$gh = Get-GhPath

if (-not $gh) {
    Write-Host "❌ GitHub CLI (gh) not found. Please re-run the installer." -ForegroundColor Red
    Pause
    exit
}

Write-Host "Checking GitHub authentication..." -ForegroundColor Cyan
& $gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔑 Please login to GitHub..." -ForegroundColor Yellow
    & $gh auth login --web -p https
}

Write-Host "Configuring Repository 'hospital_man'..." -ForegroundColor Cyan

# Try to create or link
try {
    # Check if repo exists remotely
    & $gh repo view hospital_man 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Repo 'hospital_man' found. Linking..." -ForegroundColor Green
        git remote remove origin 2>$null
        & $gh repo set-default hospital_man
        # Get URL
        $url = & $gh repo view hospital_man --json url --jq .url
        git remote add origin $url
    }
    else {
        Write-Host "Creating new repo 'hospital_man'..." -ForegroundColor Green
        & $gh repo create hospital_man --public --source=. --remote=origin
    }
}
catch {
    Write-Host "⚠️ Error during repo setup. Check if 'hospital_man' already exists." -ForegroundColor Yellow
}

Write-Host "🚀 Pushing code to main branch..." -ForegroundColor Cyan
git add .
git commit -m "Deploy to Render" --allow-empty
git branch -M main
git push -u origin main

Write-Host "✅ Code pushed successfully!" -ForegroundColor Green
Write-Host "Opening Render Dashboard for final step..." -ForegroundColor Green
Start-Process "https://dashboard.render.com"

Pause
