# Ngrok Remote Testing Setup

This guide helps you expose your local Community Chat server to the internet for remote testing.

## Prerequisites

1. **Install ngrok**: Download from https://ngrok.com/download
   - Or with Chocolatey (Windows): `choco install ngrok`
   - Or with Homebrew (Mac): `brew install ngrok`

## Quick Start

### Windows
```bash
start-ngrok.bat
```

### Linux/Mac
```bash
chmod +x start-ngrok.sh
./start-ngrok.sh
```

## Manual Setup

1. **Set auth token** (only needed once):
```bash
ngrok config add-authtoken 35gmeq0KMq4eGj2R5uMHMJaW9kJ_6BiLcjn6EWqW2dL9nn7WX
```

2. **Start your backend server**:
```bash
cd backend
bun run dev
```

3. **Start ngrok tunnel** (in a new terminal):
```bash
ngrok http 3000
```

4. **Copy the ngrok URL** from the output:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:3000
```

5. **Update frontend/.env**:
```env
VITE_SOCKET_URL=https://abc123.ngrok.io
```

6. **Start frontend** (in a new terminal):
```bash
cd frontend
bun run dev
```

7. **Share the URL**: Give your ngrok URL to others for testing!

## Important Notes

- 🔄 **The ngrok URL changes each time** you restart ngrok (unless you have a paid plan)
- 🔒 **HTTPS is automatic** with ngrok - perfect for WebRTC/screen sharing
- ⏰ **Free tier sessions expire** after 2 hours - just restart the tunnel
- 🌐 **Both you and remote testers** can access via the ngrok URL

## Troubleshooting

**"Session Expired"**: Restart ngrok and update VITE_SOCKET_URL

**CORS errors**: Make sure backend/.env has:
```env
FRONTEND_URL=https://your-ngrok-url.ngrok.io
```

**Socket connection fails**: Verify VITE_SOCKET_URL matches your ngrok URL exactly (including https://)

## Production Alternative

For longer-term remote hosting without ngrok restarting:
- Railway: https://railway.app
- Fly.io: https://fly.io
- Render: https://render.com

All provide free tiers with persistent URLs and HTTPS.
