$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $root "backend"
$backendPort = 3000
$frontendPort = 4200
$backendHealthUrl = "http://localhost:$backendPort/api/health/storage"
$startedProcesses = @()

function Get-Listener($port) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Test-MaiawallBackend {
  try {
    $response = Invoke-RestMethod -Uri $backendHealthUrl -Method Get -TimeoutSec 2
    return $response.success -eq $true -and $response.data.storage -eq "mongodb"
  }
  catch {
    return $false
  }
}

function Stop-StartedProcesses {
  foreach ($process in $startedProcesses) {
    if ($process -and -not $process.HasExited) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
  }
}

try {
  $backendListener = Get-Listener $backendPort
  if ($backendListener) {
    if (Test-MaiawallBackend) {
      Write-Host "Backend already running on http://localhost:$backendPort"
    }
    else {
      $processName = (Get-Process -Id $backendListener.OwningProcess -ErrorAction SilentlyContinue).ProcessName
      Write-Host "Port $backendPort is already in use by PID $($backendListener.OwningProcess) ($processName)." -ForegroundColor Red
      Write-Host "Stop that process or change the backend PORT before running npm run dev:full."
      exit 1
    }
  }
  else {
    Write-Host "Starting Maiawall Homolog backend on http://localhost:$backendPort"
    $backend = Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "start:local") -WorkingDirectory $backendPath -NoNewWindow -PassThru
    $startedProcesses += $backend

    Start-Sleep -Seconds 3
    $backend.Refresh()

    if ($backend.HasExited) {
      Write-Host "Backend failed to start. Run 'cd backend; npm run start:local' to see the full error." -ForegroundColor Red
      exit 1
    }

    if (-not (Test-MaiawallBackend)) {
      Write-Host "Backend started but health check did not respond at $backendHealthUrl." -ForegroundColor Red
      exit 1
    }
  }

  $frontendListener = Get-Listener $frontendPort
  if ($frontendListener) {
    $processName = (Get-Process -Id $frontendListener.OwningProcess -ErrorAction SilentlyContinue).ProcessName
    Write-Host "Frontend port $frontendPort is already in use by PID $($frontendListener.OwningProcess) ($processName)." -ForegroundColor Yellow
    Write-Host "Keeping existing frontend process."
  }
  else {
    Write-Host "Starting Maiawall Homolog frontend on http://localhost:$frontendPort"
    $frontend = Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "start", "--", "--host", "127.0.0.1", "--port", "$frontendPort") -WorkingDirectory $root -NoNewWindow -PassThru
    $startedProcesses += $frontend
  }

  Write-Host ""
  Write-Host "Frontend: http://localhost:$frontendPort"
  Write-Host "Backend:  $backendHealthUrl"
  Write-Host "Press Ctrl+C to stop processes started by this script."

  while ($true) {
    Start-Sleep -Seconds 1
    foreach ($process in $startedProcesses) {
      $process.Refresh()
      if ($process.HasExited) {
        Write-Host "A started process exited. Stopping the remaining started processes." -ForegroundColor Yellow
        exit 1
      }
    }
  }
}
finally {
  Stop-StartedProcesses
}
