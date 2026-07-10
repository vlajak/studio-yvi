# Yvi Fotografie - Start-Skript
$port = 3000
$serverScript = Join-Path $PSScriptRoot "server.js"

# ngrok-Pfad explizit setzen falls nicht im PATH
$ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
$ngrokPath = if ($ngrokCmd) { $ngrokCmd.Source } else { $null }
if (-not $ngrokPath) {
    $candidates = @(
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source*\ngrok.exe",
        "$env:ProgramFiles\ngrok\ngrok.exe",
        "$env:LOCALAPPDATA\ngrok\ngrok.exe"
    )
    foreach ($c in $candidates) {
        $found = Get-Item $c -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) { $ngrokPath = $found.FullName; break }
    }
}
if (-not $ngrokPath) {
    Write-Host "ngrok nicht gefunden. Bitte neues Terminal oeffnen und erneut versuchen." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Yvi Fotografie" -ForegroundColor Cyan
Write-Host "---------------------------------" -ForegroundColor DarkGray

# Alten Node-Prozess auf dem Port beenden
$oldProc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
           Select-Object -ExpandProperty OwningProcess -Unique |
           ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue }
if ($oldProc) {
    Write-Host "Port $port belegt - beende alten Prozess..." -ForegroundColor Yellow
    $oldProc | Stop-Process -Force
    Start-Sleep -Seconds 1
}

# Server starten
Write-Host "Server startet auf Port $port..." -ForegroundColor Gray
$serverProc = Start-Process node -ArgumentList $serverScript -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2

try {
    Invoke-WebRequest "http://localhost:$port" -UseBasicParsing -TimeoutSec 3 | Out-Null
    Write-Host "Server laeuft: http://localhost:$port" -ForegroundColor Green
} catch {
    Write-Host "Server konnte nicht gestartet werden." -ForegroundColor Red
    exit 1
}

# ngrok starten
Write-Host "Tunnel wird geoeffnet..." -ForegroundColor Gray
$ngrokProc = Start-Process $ngrokPath -ArgumentList "http", $port -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3

# URL aus ngrok-API lesen
$url = $null
for ($i = 0; $i -lt 12; $i++) {
    try {
        $tunnels = Invoke-RestMethod "http://localhost:4040/api/tunnels" -TimeoutSec 2
        $url = ($tunnels.tunnels | Where-Object { $_.proto -eq "https" }).public_url
        if ($url) { break }
    } catch {}
    Start-Sleep -Seconds 1
}

Write-Host ""
if ($url) {
    Write-Host "Oeffentliche URL:" -ForegroundColor Green
    Write-Host "  $url" -ForegroundColor White
    Write-Host ""
    Write-Host "ngrok-Dashboard: http://localhost:4040" -ForegroundColor DarkGray
} else {
    Write-Host "Tunnel laeuft - URL unter http://localhost:4040 einsehen." -ForegroundColor Yellow
    Write-Host "Tipp: ngrok config add-authtoken DEIN_TOKEN falls noch nicht gemacht." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "CTRL+C zum Beenden." -ForegroundColor DarkGray
Write-Host "---------------------------------" -ForegroundColor DarkGray

# Laufen lassen bis CTRL+C
try {
    while ($true) {
        Start-Sleep -Seconds 5
        if ($serverProc.HasExited) {
            Write-Host "Server unerwartet beendet - wird neu gestartet..." -ForegroundColor Yellow
            $serverProc = Start-Process node -ArgumentList $serverScript -PassThru -WindowStyle Hidden
        }
    }
} finally {
    if (-not $serverProc.HasExited) { $serverProc.Kill() }
    if (-not $ngrokProc.HasExited)  { $ngrokProc.Kill() }
    Write-Host "Beendet." -ForegroundColor DarkGray
}
