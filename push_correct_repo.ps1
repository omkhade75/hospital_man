# Script to push to 'hospital_man' repo
Write-Host "Configuring remote for 'hospital_man'..." -ForegroundColor Cyan

# Remove existing origin to avoid conflicts
git remote remove origin 2>$null

# Add the correct remote
git remote add origin https://github.com/omkhade75/hospital_man.git

# Ensure we are on main branch
git branch -M main

# Add all files (including new refactored structure)
git add .
git commit -m "Final push: Modular backend and Render config" --allow-empty

# Push
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($?) {
    Write-Host "✅ Successfully pushed to hospital_man!" -ForegroundColor Green
}
else {
    Write-Host "❌ Push failed. The repository 'hospital_man' might not exist." -ForegroundColor Red
    Write-Host "Attempting to create it via GitHub CLI..." -ForegroundColor Yellow
    gh repo create hospital_man --public --source=. --remote=origin --push
}
