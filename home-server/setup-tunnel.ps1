$ErrorActionPreference = 'Stop'
$cf = @("${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe", "$env:ProgramFiles\cloudflared\cloudflared.exe") | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (!$cf) { throw 'cloudflared is missing. Install Cloudflare.cloudflared with winget first.' }
$tunnelName = 'maseok-dokdo'
$hostname = 'dokdo-api.sangsangbar.com'
$configDir = Join-Path $env:LOCALAPPDATA 'MaseokDokdo\tunnel'
New-Item -ItemType Directory -Force -Path $configDir | Out-Null
if (!(Test-Path -LiteralPath "$env:USERPROFILE\.cloudflared\cert.pem")) {
  Write-Host 'In the browser, sign in to Cloudflare and authorize sangsangbar.com.'
  & $cf tunnel login
  if ($LASTEXITCODE -ne 0) { throw 'Cloudflare login failed.' }
}
$items = & $cf tunnel list --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Could not list tunnels.' }
$tunnel = $items | Where-Object { $_.name -eq $tunnelName } | Select-Object -First 1
if (!$tunnel) {
  & $cf tunnel create $tunnelName
  if ($LASTEXITCODE -ne 0) { throw 'Tunnel creation failed.' }
  $items = & $cf tunnel list --output json | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0) { throw 'Could not list tunnels.' }
  $tunnel = $items | Where-Object { $_.name -eq $tunnelName } | Select-Object -First 1
}
if (!$tunnel) { throw 'Tunnel not found.' }
$credentials = Join-Path $env:USERPROFILE ".cloudflared\$($tunnel.id).json"
if (!(Test-Path -LiteralPath $credentials)) { throw 'Tunnel credentials are missing on this laptop.' }
$config = "tunnel: $($tunnel.id)`ncredentials-file: '$credentials'`ningress:`n  - hostname: $hostname`n    service: http://127.0.0.1:8787`n  - hostname: dokdo-admin.sangsangbar.com`n    service: http://127.0.0.1:8788`n  - service: http_status:404`n"
[IO.File]::WriteAllText((Join-Path $configDir 'config.yml'), $config, [Text.UTF8Encoding]::new($false))
& $cf tunnel --config (Join-Path $configDir 'config.yml') ingress validate
if ($LASTEXITCODE -ne 0) { throw 'Tunnel configuration validation failed.' }
& $cf tunnel route dns $tunnel.id $hostname
if ($LASTEXITCODE -ne 0) { throw 'DNS setup failed. Check for an existing record with the same hostname; do not delete unrelated records.' }
& $cf tunnel route dns $tunnel.id 'dokdo-admin.sangsangbar.com'
if ($LASTEXITCODE -ne 0) { throw 'Remote admin DNS setup failed.' }
Write-Host 'Setup complete. Run start-event.bat to turn the server on.'
Write-Host 'No Windows service or automatic startup has been installed.'
