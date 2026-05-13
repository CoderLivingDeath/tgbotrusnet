@echo off
title Telegram Bot Server [DEBUG]

echo ============================================
echo   Building TypeScript project (DEBUG mode)...
echo ============================================
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed. Check errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================
echo   Build successful! Starting bot with -d
echo   (debug commands, verbose logging)...
echo ============================================
echo.
npm run start -- -d

echo.
echo ============================================
echo   Bot stopped (exit code: %errorlevel%)
echo ============================================
pause
