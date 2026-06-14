$repoPath = "D:\air-canvas-ai-main\air-canvas-ai-main"
$oldRepoPath = "C:\Users\arora\.gemini\antigravity\scratch\old_repo\Air-Writting-system-4f10133da2d528c3e5233bfa4bba0f4de72696c7"
$tempPath = "C:\Users\arora\.gemini\antigravity\scratch\temp_frontend"

# 1. Create temp directory for new frontend
if (Test-Path $tempPath) { Remove-Item $tempPath -Recurse -Force }
New-Item -ItemType Directory -Path $tempPath

# 2. Move all current repo contents (except .git) to temp
Get-ChildItem -Path $repoPath -Force | Where-Object { $_.Name -ne ".git" } | Move-Item -Destination $tempPath -Force

# 3. Copy all old repo contents to the repo root
Copy-Item -Path "$oldRepoPath\*" -Destination $repoPath -Recurse -Force
Copy-Item -Path "$oldRepoPath\.gitignore" -Destination $repoPath -Force
Copy-Item -Path "$oldRepoPath\.python-version" -Destination $repoPath -Force
Copy-Item -Path "$oldRepoPath\.env.example" -Destination $repoPath -Force

# 4. Delete the old frontend from the repo
if (Test-Path "$repoPath\frontend") { Remove-Item "$repoPath\frontend" -Recurse -Force }

# 5. Move the temp frontend back into the repo as 'frontend'
Move-Item -Path $tempPath -Destination "$repoPath\frontend" -Force

Write-Host "Repository restructured successfully!"
