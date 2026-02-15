@echo off
REM ============================================
REM Project Management System (PMS) Launcher
REM ============================================
REM This script starts the PMS application
REM ============================================

title PMS - Project Management System

echo.
echo  ====================================================
echo    Project Management System (PMS)
echo  ====================================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Navigate to the script directory
cd /d "%SCRIPT_DIR%"

REM Check if node_modules exists
if not exist "node_modules" (
    echo  [!] Dependencies not found. Installing...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo  [ERROR] Failed to install dependencies.
        echo  Please run 'npm install' manually.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Dependencies installed successfully.
    echo.
)

REM Check if Prisma client is generated
if not exist "node_modules\.prisma\client" (
    echo  [!] Generating Prisma client...
    call npx prisma generate
    echo.
)

REM Set default port (can be overridden by passing a port number)
set PORT=3001
if not "%1"=="" set PORT=%1

echo  [*] Starting development server on port %PORT%...
echo.
echo  ----------------------------------------------------
echo    Access the application at:
echo    http://localhost:%PORT%
echo  ----------------------------------------------------
echo.
echo  Press Ctrl+C to stop the server.
echo.

REM Start the development server
call npx next dev -p %PORT%

pause
