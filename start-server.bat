@echo off
title Telegram Bot Server

echo ============================================
echo   Building TypeScript project...
echo ============================================
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed. Check errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================
echo   Build successful! Starting bot...
echo ============================================
echo.
npm run start

echo.
echo ============================================
echo   Bot stopped (exit code: %errorlevel%)
echo ============================================
pause
