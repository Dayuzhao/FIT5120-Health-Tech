$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot 'backend'
$frontendDir = Join-Path $repoRoot 'Curbi'
$npmPath = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npmPath -and (Test-Path 'C:\Program Files\nodejs\npm.cmd')) {
    $npmPath = 'C:\Program Files\nodejs\npm.cmd'
}
if (-not $npmPath) {
    throw 'npm.cmd was not found. Install Node.js and reopen PowerShell.'
}

$backendArgs = @(
    '-NoExit',
    '-Command',
    "Set-Location '$backendDir'; & '$npmPath' start"
)

$frontendArgs = @(
    '-NoExit',
    '-Command',
    "Set-Location '$frontendDir'; & '$npmPath' run dev"
)

Write-Host 'Starting Curbi backend...'
Start-Process powershell -ArgumentList $backendArgs

Start-Sleep -Seconds 2

Write-Host 'Starting Curbi frontend...'
Start-Process powershell -ArgumentList $frontendArgs

Write-Host 'Opening Curbi in the browser...'
Start-Sleep -Seconds 8
Start-Process 'http://localhost:5173'

Write-Host "Curbi is launching. Open http://localhost:5173 if the browser does not open automatically."
Write-Host "Backend: http://localhost:3000"
