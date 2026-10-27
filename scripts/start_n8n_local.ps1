[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is required. Install a supported Node.js LTS release, then reopen PowerShell.'
}
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw 'npm/npx is required. Verify that npm is included with Node.js and available on PATH.'
}

$nodeVersion = (node --version).Trim()
Write-Host "Node.js detected: $nodeVersion"
Write-Host 'Starting n8n 2.44.7 locally. The first run downloads the package to the npm cache; Docker is not used.'
Write-Host 'The editor will be available at http://127.0.0.1:5678. Press Ctrl+C in this terminal to stop n8n.'

$env:N8N_HOST = '127.0.0.1'
$env:N8N_LISTEN_ADDRESS = '127.0.0.1'
$env:N8N_PORT = '5678'
$env:N8N_PROTOCOL = 'http'
$env:N8N_DIAGNOSTICS_ENABLED = 'false'
$env:N8N_PERSONALIZATION_ENABLED = 'false'
$env:N8N_TEMPLATES_ENABLED = 'false'
$env:N8N_VERSION_NOTIFICATIONS_ENABLED = 'false'

& npx --yes n8n@2.44.7 start
if ($LASTEXITCODE -ne 0) {
    throw "n8n exited with code $LASTEXITCODE. Review the preceding output before retrying."
}
