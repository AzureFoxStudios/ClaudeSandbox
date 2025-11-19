#!/bin/bash

# Ngrok tunnel setup for Community Chat remote testing
# This exposes your local server to the internet for testing

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed"
    echo "📦 Install from: https://ngrok.com/download"
    echo ""
    echo "Or on Windows with Chocolatey:"
    echo "  choco install ngrok"
    exit 1
fi

# Set auth token
echo "🔐 Setting ngrok auth token..."
ngrok config add-authtoken 35gmeq0KMq4eGj2R5uMHMJaW9kJ_6BiLcjn6EWqW2dL9nn7WX

# Start ngrok tunnel on port 3000 (backend server)
echo "🚀 Starting ngrok tunnel on port 3000..."
echo ""
echo "📝 Important: Update your frontend/.env file with the ngrok URL:"
echo "   VITE_SOCKET_URL=https://YOUR-NGROK-URL"
echo ""
echo "Press Ctrl+C to stop"
echo ""

ngrok http 3000
