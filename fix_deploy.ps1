# Deploy Fix Script
# This script ensures you are logged in and pushes the render.yaml file.

$ErrorActionPreference = "Stop"

Write-Host "Step 1: GitHub Login" -ForegroundColor Cyan
Write-Host "Checking authentication..." -ForegroundColor Yellow

# Try to authenticate
if (-not (gh auth status)) {
    Write-Host "Please authorize GitHub in your browser..." -ForegroundColor Yellow
    gh auth login --web -p https
}

Write-Host "Step 2: Configuring Repository" -ForegroundColor Cyan
# Ensure remote is correct
$currentRemote = git remote get-url origin 2>$null
if (-not $currentRemote) {
    Write-Host "Remote URL missing. Please enter your GitHub repo URL:" -ForegroundColor Red
    $url = Read-Host "GitHub URL (e.g., https://github.com/user/repo.git)"
    git remote add origin $url
    git branch -M main
}

Write-Host "Step 3: Pushing 'render.yaml'..." -ForegroundColor Cyan
git add render.yaml
git commit -m "Add render.yaml for deployment" --allow-empty
git push -u origin main

Write-Host "✅ Success! Code looks good." -ForegroundColor Green
Write-Host "Now go to Render Dashboard and deploy!" -ForegroundColor Green
Start-Process "https://dashboard.render.com"
Pause
