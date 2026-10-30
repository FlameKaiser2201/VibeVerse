Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " 🚀 VibeVerse - Automated GitHub & Render Deployment" -ForegroundColor Green
Write-Host " Target Repo: https://github.com/FlameKaiser2201/vibeverse" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCheck) {
    Write-Host "[ERROR] Git is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "Or run: winget install --id Git.Git -e --source winget" -ForegroundColor Yellow
    Exit 1
}

Write-Host "[1/5] Initializing Git repository..." -ForegroundColor White
if (-not (Test-Path ".git")) {
    git init
}

Write-Host "[2/5] Adding all files to staging..." -ForegroundColor White
git add .

Write-Host "[3/5] Creating commit..." -ForegroundColor White
git commit -m "Launch VibeVerse: Complete social app with Python FastAPI backend, MySQL, React Native mobile, camera filters, mic voice notes & CI/CD APK builder"

Write-Host "[4/5] Setting main branch and remote repository..." -ForegroundColor White
git branch -M main
git remote remove origin 2>$null
git remote add origin https://github.com/FlameKaiser2201/vibeverse.git

Write-Host "[5/5] Pushing to GitHub..." -ForegroundColor White
Write-Host "If prompted, please enter your GitHub credentials or Personal Access Token." -ForegroundColor Gray
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host " 🎉 SUCCESS! All codes pushed to your GitHub repository!" -ForegroundColor Green
    Write-Host ""
    Write-Host " 1. Permanent APK Build: GitHub Actions is now building your APK!" -ForegroundColor Cyan
    Write-Host "    Check progress at: https://github.com/FlameKaiser2201/vibeverse/actions" -ForegroundColor White
    Write-Host ""
    Write-Host " 2. Render Deployment: Deploy on Render via your GitHub account at:" -ForegroundColor Magenta
    Write-Host "    https://dashboard.render.com/select-repo?type=blueprint" -ForegroundColor White
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[NOTE] If the repository does not exist on your account yet:" -ForegroundColor Yellow
    Write-Host "1. Create a repository named 'vibeverse' at: https://github.com/new" -ForegroundColor White
    Write-Host "2. Then run this script again!" -ForegroundColor White
}
