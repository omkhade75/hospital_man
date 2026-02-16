# Final Deployment Helper
# 1. Copy the URL from the GitHub page that just opened.
# 2. right-click to paste it below.

$repoUrl = Read-Host "Paste your new GitHub Repository URL here"

if (-not $repoUrl) {
    Write-Host "No URL provided. Exiting." -ForegroundColor Red
    exit
}

Write-Host "Linking to GitHub..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $repoUrl
git branch -M main

Write-Host "Pushing code..." -ForegroundColor Yellow
git push -u origin main

if ($?) {
    Write-Host "✅ Success! Opening Render Dashboard..." -ForegroundColor Green
    Start-Process "https://dashboard.render.com"
}
else {
    Write-Host "❌ Push failed. Please check the URL and try again." -ForegroundColor Red
}

Pause
