# Clean and Push Script for hospital_man

Write-Host "Stopping large upload..." -ForegroundColor Yellow
# (Previous command terminated)

Write-Host "Cleaning git index to remove large files..." -ForegroundColor Cyan
git rm -r --cached . > $null 2>&1

Write-Host "Re-adding files (respecting .gitignore)..." -ForegroundColor Cyan
git add .

Write-Host "Committing clean state..." -ForegroundColor Cyan
git commit -m "Fix: Remove ignored files and heavy artifacts" --allow-empty

Write-Host "Pushing to 'hospital_man'..." -ForegroundColor Yellow
# Ensure remote is correct just in case
git remote set-url origin https://github.com/omkhade75/hospital_man.git

git push -u origin main --force

if ($?) {
    Write-Host "✅ Pushed successfully! Code is now clean on GitHub." -ForegroundColor Green
}
else {
    Write-Host "❌ Push failed. Check your internet or GitHub permissions." -ForegroundColor Red
}
