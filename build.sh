#!/bin/bash

# Community Chat Build Script
# Builds both frontend and backend, and creates a single deployable package

set -e

echo "🚀 Building Community Chat..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first: https://bun.sh"
    exit 1
fi

echo "📦 Installing dependencies..."
cd frontend && bun install && cd ..
cd backend && bun install && cd ..

echo "🏗️  Building frontend..."
cd frontend
bun run build
cd ..

echo "🏗️  Building backend binary..."
cd backend
bun run build
cd ..

echo "📁 Creating deployment package..."
mkdir -p dist
cp backend/community-chat-server dist/
cp -r frontend/build dist/static

echo "✅ Build complete!"
echo ""
echo "Deployment files are in the 'dist' directory:"
echo "  - community-chat-server (binary)"
echo "  - static/ (frontend files)"
echo ""
echo "To run: cd dist && ./community-chat-server"
