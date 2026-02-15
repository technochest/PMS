# ============================================
# Project Management System (PMS) Launcher
# ============================================
# This script starts the PMS application
# Usage: .\start.ps1 [port]
# Example: .\start.ps1 3001
# ============================================

param(
    [int]$Port = 3001
)

$Host.UI.RawUI.WindowTitle = "PMS - Project Management System"

function Write-Banner {
    Write-Host ""
    Write-Host "  ====================================================" -ForegroundColor Cyan
    Write-Host "    Project Management System (PMS)" -ForegroundColor Cyan
    Write-Host "  ====================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    
    switch ($Type) {
        "Success" { Write-Host "  [OK] $Message" -ForegroundColor Green }
        "Warning" { Write-Host "  [!] $Message" -ForegroundColor Yellow }
        "Error"   { Write-Host "  [ERROR] $Message" -ForegroundColor Red }
        default   { Write-Host "  [*] $Message" -ForegroundColor White }
    }
}

# Get script directory and change to it
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Banner

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Status "Node.js version: $nodeVersion" "Success"
} catch {
    Write-Status "Node.js is not installed or not in PATH" "Error"
    Write-Host ""
    Write-Host "  Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "  Press Enter to exit"
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Status "Dependencies not found. Installing..." "Warning"
    Write-Host ""
    
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Status "Failed to install dependencies." "Error"
        Write-Host "  Please run 'npm install' manually." -ForegroundColor Yellow
        Read-Host "  Press Enter to exit"
        exit 1
    }
    
    Write-Host ""
    Write-Status "Dependencies installed successfully." "Success"
}

# Check if Prisma client is generated
if (-not (Test-Path "node_modules\.prisma\client")) {
    Write-Status "Generating Prisma client..." "Warning"
    npx prisma generate
    Write-Host ""
}

# Kill any existing Next.js processes on the target port
$portCheck = netstat -ano | Select-String ":$Port\s+.*LISTENING"
if ($portCheck) {
    Write-Status "Port $Port is in use. Attempting to free it..." "Warning"
    $processLine = $portCheck | Select-Object -First 1
    if ($processLine -match '\s+(\d+)$') {
        $processId = $Matches[1]
        try {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            Write-Status "Freed port $Port" "Success"
        } catch {
            Write-Status "Could not free port $Port. Try a different port." "Warning"
        }
    }
}

Write-Host ""
Write-Status "Starting development server on port $Port..." "Info"
Write-Host ""
Write-Host "  ----------------------------------------------------" -ForegroundColor DarkGray
Write-Host "    Access the application at:" -ForegroundColor White
Write-Host "    " -NoNewline
Write-Host "http://localhost:$Port" -ForegroundColor Green
Write-Host "  ----------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor DarkGray
Write-Host ""

# Start the development server
npx next dev -p $Port
