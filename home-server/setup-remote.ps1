$ErrorActionPreference = 'Stop'
$cf = @("${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe", "$env:ProgramFiles\cloudflared\cloudflared.exe") | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (!$cf) { throw 'cloudflared is missing.' }
$configDir = Join-Path $env:LOCALAPPDATA 'MaseokDokdo\tunnel'
$configPath = Join-Path $configDir 'config.yml'
if (!(Test-Path -LiteralPath $configPath)) { throw 'Run setup-tunnel.bat first.' }
$configText = [IO.File]::ReadAllText($configPath)
$tunnelMatch = [regex]::Match($configText, '(?m)^tunnel:\s*([a-f0-9-]+)\s*$')
if (!$tunnelMatch.Success) { throw 'Tunnel ID not found.' }
if ($configText -notmatch 'hostname:\s*dokdo-admin\.sangsangbar\.com') {
  if ($configText -notmatch '  - service: http_status:404') { throw 'Tunnel fallback not found; existing configuration was preserved.' }
  $configText = $configText.Replace('  - service: http_status:404', "  - hostname: dokdo-admin.sangsangbar.com`n    service: http://127.0.0.1:8788`n  - service: http_status:404")
}
$candidatePath = Join-Path $configDir 'remote-candidate.yml'
[IO.File]::WriteAllText($candidatePath, $configText, [Text.UTF8Encoding]::new($false))
& $cf tunnel --config $candidatePath ingress validate
if ($LASTEXITCODE -ne 0) { throw 'Tunnel configuration validation failed; original preserved.' }
& $cf tunnel route dns $tunnelMatch.Groups[1].Value 'dokdo-admin.sangsangbar.com'
if ($LASTEXITCODE -ne 0) { throw 'DNS setup failed; original configuration preserved.' }
Copy-Item -LiteralPath $configPath -Destination (Join-Path $configDir ('config-before-remote-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.yml'))
Move-Item -LiteralPath $candidatePath -Destination $configPath -Force
Write-Host 'Remote management configured: https://dokdo-admin.sangsangbar.com/'
