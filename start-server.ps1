Set-Location $PSScriptRoot
Write-Host "Starting PrintEase on http://localhost:8000"
python -m http.server 8000
