# CLAY Minimal Installer for Windows (PowerShell)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $ScriptDir

$BinaryLocalSource = Join-Path $ScriptDir "bin\clay-sandbox-windows-amd64.exe"
$BinaryUrl = "https://raw.githubusercontent.com/UIZorrot/Clay-Skill-More/main/bin/clay-sandbox-windows-amd64.exe"
$BinaryTarget = Join-Path $ScriptDir "clay-sandbox.exe"

# 1. Prepare Binary
if (!(Test-Path $BinaryTarget)) {
    if (Test-Path $BinaryLocalSource) {
        Copy-Item -Path $BinaryLocalSource -Destination $BinaryTarget
    }
    else {
        Write-Host "Downloading Sandbox Binary from $BinaryUrl ..."
        Invoke-WebRequest -Uri $BinaryUrl -OutFile $BinaryTarget
    }
}

# 2. Launch Daemon
# The sandbox will auto-generate .env.clay if it doesn't exist
Stop-Process -Name "clay-sandbox" -ErrorAction SilentlyContinue
Start-Process -FilePath $BinaryTarget -WindowStyle Hidden

Write-Host "✅ CLAY Sandbox is launching..."
Write-Host "Wait a few seconds, then check .env.clay for your AGENT_TOKEN and URL."


# Note: Identity and config are persistent. To reset, delete .env.clay, identity.json and share3.json.
