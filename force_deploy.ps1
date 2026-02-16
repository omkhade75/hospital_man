# Force Update Script for 'hospital_man'

$ErrorActionPreference = "Stop"
$gh = "gh" 

Write-Host "Checking GitHub Login..." -ForegroundColor Cyan
& $gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please complete the login in your browser first!" -ForegroundColor Yellow
    & $gh auth login --web -p https
}

Write-Host "Targeting Repo: hospital_man" -ForegroundColor Cyan

# Ensure Repo Exists
try {
    & $gh repo view hospital_man 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating repo..." -ForegroundColor Green
        & $gh repo create hospital_man --public --source=. --remote=origin
    }
    else {
        Write-Host "Repo found. Linking..." -ForegroundColor Green
        $url = & $gh repo view hospital_man --json url --jq .url
        git remote remove origin 2>$null
        git remote add origin $url
    }
}
catch {
    Write-Host "Error checking repo. Proceeding with existing remote if any." -ForegroundColor Red
}

Write-Host "Pushing latest changes..." -ForegroundColor Cyan
git add .
git commit -m "Update deployment files" --allow-empty
git branch -M main
git push -u origin main

Write-Host "✅ GitHub Updated Successfully!" -ForegroundColor Green
Pause
