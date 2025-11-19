@echo off
REM Ngrok tunnel setup for Community Chat remote testing (Windows)
REM This exposes your local server to the internet for testing

echo Checking for ngrok...
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ngrok is not installed
    echo 📦 Install from: https://ngrok.com/download
    echo.
    echo Or with Chocolatey:
    echo   choco install ngrok
    pause
    exit /b 1
)

echo 🔐 Setting ngrok auth token...
ngrok config add-authtoken 35gmeq0KMq4eGj2R5uMHMJaW9kJ_6BiLcjn6EWqW2dL9nn7WX

echo.
echo 🚀 Starting ngrok tunnel on port 3000...
echo.
echo 📝 Important: Update your frontend/.env file with the ngrok URL:
echo    VITE_SOCKET_URL=https://YOUR-NGROK-URL
echo.
echo Press Ctrl+C to stop
echo.

ngrok http 3000
