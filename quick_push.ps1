# One-Time Push Helper
# This script connects your local code to GitHub and pushes 'render.yaml'

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Final Step: Connect & Push Code" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$url = Read-Host "Paste the GitHub Repository URL (from your browser address bar)"

if (-not $url) {
    Write-Host "❌ No URL provided. Please run this script again." -ForegroundColor Red
    Pause
    exit
}

Write-Host "🔗 Connecting to GitHub..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $url

Write-Host "📦 Preparing files..." -ForegroundColor Yellow
git add .
git commit -m "Add render.yaml and finalize deployment" --allow-empty
git branch -M main

Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($?) {
    Write-Host "✅ Code pushed successfully!" -ForegroundColor Green
    Write-Host "Now go back to Render Dashboard and click 'Retry'!" -ForegroundColor Green
}
else {
    Write-Host "❌ Push failed. Please check the URL and your internet connection." -ForegroundColor Red
}

Pause
