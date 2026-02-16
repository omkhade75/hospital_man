# Setup Script for Auto-Deployment
# This script prepares your code for deployment automatically

Write-Host "Starting automated setup..." -ForegroundColor Cyan

# 1. Initialize Git Repository
if (-not (Test-Path .git)) {
    Write-Host "Initializing Git..." -ForegroundColor Yellow
    git init
}

# 2. Configure Local Git Identity (Required for auto-commit)
Write-Host "Configuring Git Identity for this repository..." -ForegroundColor Yellow
git config user.email "deploy@auto.bot"
git config user.name "Deploy Bot"

# 3. Add all files
Write-Host "Adding files to version control..." -ForegroundColor Yellow
git add .

# 4. Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "Auto-deploy commit" --allow-empty

# 5. Open Folder (as requested 'open it')
Write-Host "Opening project folder..." -ForegroundColor Green
Start-Process .

Write-Host "Setup complete! Ready for GitHub upload." -ForegroundColor Green
