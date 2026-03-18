# TradeMind Unified Server - PowerShell Version
# Для запуска: powershell -ExecutionPolicy Bypass -File start-unified.ps1

param(
    [switch]$NoFrontendBuild = $false,
    [int]$Port = 8000
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     TradeMind - Unified Server Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-CommandExists {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Check Python
if (-not (Test-CommandExists python)) {
    Write-Host "ERROR: Python not found!" -ForegroundColor Red
    Write-Host "Please install Python 3.11+ from https://python.org" -ForegroundColor Yellow
    exit 1
}

# Check Node.js (only needed for build)
if (-not $NoFrontendBuild -and -not (Test-CommandExists npm)) {
    Write-Host "ERROR: Node.js/npm not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Activate Python environment
Write-Host "Activating Python environment..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Could not activate Python environment" -ForegroundColor Red
    Write-Host "Create it with: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

# Build frontend if needed
$frontendBuild = "frontend\.next"
if (-not $NoFrontendBuild -and -not (Test-Path $frontendBuild)) {
    Write-Host ""
    Write-Host "[1/3] Building frontend..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Push-Location frontend
    
    # Install dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: npm install failed" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    }
    
    # Build
    Write-Host "Running build..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
    Write-Host "Frontend build complete!" -ForegroundColor Green
    Write-Host ""
}

# Start server
Write-Host "[2/3] Starting Backend Server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:$Port" -ForegroundColor Green
Write-Host "📚 API Docs: http://localhost:$Port/docs" -ForegroundColor Green
Write-Host ""
Write-Host "[3/3] Server is running (press Ctrl+C to stop)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port $Port
