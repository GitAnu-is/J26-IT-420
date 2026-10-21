<#
.SYNOPSIS
  AgriGuard Unified Modular Monolith Orchestrator (Windows PowerShell)
  Research Group: J26-IT-420 - SLIIT
  Phase 9 Architecture: Single Python FastAPI Monolith (Port 8000) + React Vite Frontend (Port 5173)

.DESCRIPTION
  Launches the complete AgriGuard platform in unified modular monolith mode:
  1. Unified FastAPI Backend (Port 8000) - includes C1, C2, C4 models & shared data layer in a single process
  2. React Vite Web Frontend (Port 5173) - connects directly to http://localhost:8000/api/v1
#>

$root = $PSScriptRoot

Write-Host "=================================================================" -ForegroundColor Green
Write-Host " AgriGuard AI Platform - Unified Modular Monolith (Phase 9)" -ForegroundColor Green
Write-Host " Research Group: J26-IT-420 (SLIIT)" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# 1. Verify Prerequisites
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python is not installed or not in PATH. Please install Python 3.10+."
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH. Please install Node.js v18+."
    exit 1
}

# 2. Check Port Availability
function Check-PortOccupied($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

if (Check-PortOccupied 8000) {
    Write-Warning "Port 8000 is currently occupied. Please terminate the process using port 8000 before running."
    exit 1
}

if (Check-PortOccupied 5173) {
    Write-Warning "Port 5173 is currently occupied. The Vite dev server may bind to another port."
}

# 3. Launch Unified FastAPI Monolith (Port 8000)
Write-Host "[1/2] Starting AgriGuard Unified FastAPI Backend on Port 8000..." -ForegroundColor Cyan
$backendProcess = Start-Process python -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory "$root\backend" -PassThru

# Wait briefly for model weights and MongoDB connection to initialize
Start-Sleep -Seconds 4

Write-Host "=================================================================" -ForegroundColor Green
Write-Host " Unified Backend running at: http://localhost:8000" -ForegroundColor Green
Write-Host " OpenAPI Documentation:     http://localhost:8000/docs" -ForegroundColor Green
Write-Host " Backend Health & Status:   http://localhost:8000/api/v1/health" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# 4. Launch React Vite Frontend (Port 5173)
Write-Host "[2/2] Starting AgriGuard React Vite Frontend on Port 5173..." -ForegroundColor Cyan
Write-Host " Frontend will open at:     http://localhost:5173" -ForegroundColor Green
Write-Host " Press Ctrl+C in this terminal to shut down all processes." -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Green

try {
    Set-Location "$root\frontend"
    npm run dev
} finally {
    Write-Host "`nShutting down AgriGuard processes..." -ForegroundColor Yellow
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "AgriGuard services stopped cleanly." -ForegroundColor Green
}
