@echo off
title Telegram Bot - Database Reset

echo ============================================
echo   WARNING: This will DELETE ALL DATA!
echo ============================================
echo.
set /p confirm="Are you sure? (y/N): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo ============================================
echo   Resetting database...
echo ============================================
npm run bot db:init -- --force
if %errorlevel% neq 0 (
    echo [ERROR] Database reset failed.
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================
echo   Database reset complete!
echo   Run start-server.bat to launch the bot.
echo ============================================
pause
