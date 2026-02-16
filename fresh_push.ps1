# Fresh Clean Push Script
# Creates a new orphan branch to push ONLY current files (no history bloat)

Write-Host "Stopping bloated push..." -ForegroundColor Yellow
# (Previous command terminated)

Write-Host "Creating clean deployment branch..." -ForegroundColor Cyan
git checkout --orphan clean_deploy_v2

Write-Host "Adding files (clean)..." -ForegroundColor Cyan
git add .
git commit -m "Fresh Deployment: Clean Code"

Write-Host "Force pushing to 'hospital_man'..." -ForegroundColor Yellow
git remote set-url origin https://github.com/omkhade75/hospital_man.git
git push -u origin clean_deploy_v2:main --force

if ($?) {
    Write-Host "✅ Fresh push successful!" -ForegroundColor Green
}
else {
    Write-Host "❌ Push failed." -ForegroundColor Red
}
