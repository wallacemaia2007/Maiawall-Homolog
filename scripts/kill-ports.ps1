$ErrorActionPreference = "Stop"

$defaultPorts = @(3000, 4200)
$ports = if ($args.Count -gt 0) { $args } else { $defaultPorts }
$normalizedPorts = @()

foreach ($port in $ports) {
  $parsedPort = 0
  if (-not [int]::TryParse($port, [ref]$parsedPort) -or $parsedPort -lt 1 -or $parsedPort -gt 65535) {
    Write-Host "Invalid port: $port" -ForegroundColor Red
    exit 1
  }

  $normalizedPorts += $parsedPort
}

foreach ($port in ($normalizedPorts | Select-Object -Unique)) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

  if (-not $listeners) {
    Write-Host "Port $port is already free."
    continue
  }

  $processIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $processIds) {
    if ($processId -le 0) {
      continue
    }

    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    $processName = if ($process) { $process.ProcessName } else { "unknown" }

    Write-Host "Stopping PID $processId ($processName) on port $port..."
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
}
