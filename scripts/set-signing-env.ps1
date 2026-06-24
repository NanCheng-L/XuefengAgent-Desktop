# Set Tauri signing env vars
# IMPORTANT: Run with dot-source prefix: . .\scripts\set-signing-env.ps1

$privateKey = Get-Content .\src-tauri\tauri.key -Raw
$env:TAURI_SIGNING_PRIVATE_KEY = $privateKey
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "123456"

Write-Host "OK - Signing env vars set. Ready for: pnpm tauri build" -ForegroundColor Green
