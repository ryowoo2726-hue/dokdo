$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
# Only obsolete generated/deployment files. Original quiz, design and sheet are preserved.
$targets = @(
  ([string]::Concat([char]0xC774,[char]0xC804,[char]0xBC84,[char]0xC804,'_',[char]0xBCF4,[char]0xAD00)),
  'dokdo-quiz\apps-script', 'dokdo-quiz\.github', 'dokdo-quiz\dist',
  'dokdo-quiz\config.js', 'dokdo-quiz\questions.js',
  'dokdo-quiz\client-storage.js'
)
# The only two root ZIPs are previous deployment packages.
$targets += @(
  ([string]::Concat([char]0xB3C5,[char]0xB3C4,[char]0xD034,[char]0xC988,'_',[char]0xAC04,[char]0xB2E8,[char]0xBC84,[char]0xC804,'.zip')),
  ([string]::Concat([char]0xB3C5,[char]0xB3C4,[char]0xD034,[char]0xC988,'_GitHub_',[char]0xBC30,[char]0xD3EC,[char]0xC900,[char]0xBE44,'.zip'))
)
foreach ($relative in $targets) {
  $target = [IO.Path]::GetFullPath((Join-Path $workspace $relative))
  if (-not $target.StartsWith($workspace + '\',[StringComparison]::OrdinalIgnoreCase)) { throw "Outside workspace: $target" }
  if (Test-Path -LiteralPath $target) {
    $item = Get-Item -LiteralPath $target -Force
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Refusing linked target: $target" }
    Write-Host "Deleting: $target"
    Remove-Item -LiteralPath $target -Recurse -Force
  }
}
Write-Host 'Cleanup complete. Original materials and notebook app are preserved.'
