# Wabi Docker Setup

This project uses a **multi-container Docker architecture** with separate containers for frontend and backend.

## Architecture

```
┌─────────────────┐
│   Frontend      │  Nginx serving static Svelte build
│   (Port 80)     │  Proxies API/WebSocket to backend
└────────┬────────┘
         │
         ├─── /api/*        → backend:3000
         ├─── /socket.io/*  → backend:3000
         └─── /uploads/*    → backend:3000

┌────────▼────────┐
│   Backend       │  Bun runtime serving API + WebSockets
│   (Port 3000)   │  Internal only (not exposed)
└─────────────────┘
```

## Files

- **Dockerfile.frontend** - Builds Svelte app, serves with Nginx
- **Dockerfile.backend** - Runs Bun backend server
- **docker-compose.yml** - Orchestrates both containers
- **nginx.conf** - Nginx configuration for frontend + reverse proxy

## Quick Start

### Development (Local)

```bash
# Build and start both containers
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

Access the app at: http://localhost

### Production Deployment

```bash
# Build optimized images
docker-compose build --no-cache

# Start with production settings
docker-compose up -d

# Check health
docker-compose ps
```

## Container Details

### Frontend Container
- **Base Image**: `nginx:alpine` (~50MB)
- **Build Stage**: `oven/bun:1` (builds Svelte app)
- **Exposed Port**: 80
- **Health Check**: `GET /health`
- **Features**:
  - Gzip compression
  - Static file caching (1 year for assets)
  - SPA routing (fallback to index.html)
  - Reverse proxy to backend

### Backend Container
- **Base Image**: `oven/bun:1`
- **Exposed Port**: 3000 (internal only)
- **Health Check**: `GET /health`
- **Volumes**: `./backend/uploads` (persisted)
- **Features**:
  - Production dependencies only
  - Auto-restart on failure
  - Upload persistence across restarts

## Commands

```bash
# Rebuild specific service
docker-compose build frontend
docker-compose build backend

# Scale backend (if needed)
docker-compose up -d --scale backend=3

# Execute commands in containers
docker-compose exec backend bun --version
docker-compose exec frontend nginx -v

# View resource usage
docker-compose stats

# Clean up everything
docker-compose down -v --rmi all
```

## Environment Variables

Create a `.env` file in the root:

```env
# Backend
NODE_ENV=production
PORT=3000

# Frontend (if needed for build-time vars)
PUBLIC_API_URL=http://localhost:3000
```

Then update docker-compose.yml:

```yaml
backend:
  env_file:
    - .env
```

## Volumes

### Uploads Persistence
Uploaded files are stored in `./backend/uploads` and mounted as a volume:

```yaml
volumes:
  - ./backend/uploads:/app/uploads
```

This ensures uploads persist even when containers are recreated.

## Networking

Containers communicate via the `wabi-network` bridge network:
- Frontend can reach backend at `http://backend:3000`
- Backend is **not exposed** to the host (only accessible via frontend proxy)

## Troubleshooting

### Frontend can't reach backend
```bash
# Check network connectivity
docker-compose exec frontend ping backend

# Check backend logs
docker-compose logs backend
```

### Port already in use
```bash
# Use different port
docker-compose down
# Edit docker-compose.yml: "8080:80" instead of "80:80"
docker-compose up
```

### Build cache issues
```bash
# Clean rebuild
docker-compose build --no-cache
docker-compose up --force-recreate
```

### View container details
```bash
# Inspect backend
docker inspect wabi-backend

# Inspect frontend
docker inspect wabi-frontend
```

## Benefits of This Architecture

✅ **Smaller Images**: Frontend is ~50MB (Nginx), Backend is Bun runtime only
✅ **Independent Scaling**: Scale backend separately from frontend
✅ **Faster Builds**: Only rebuild changed service
✅ **Better Security**: Backend not directly exposed
✅ **Easier Deployment**: Deploy to services that support docker-compose
✅ **Development Flexibility**: Can run services separately during dev

## Migration from Old Single Dockerfile

The old Dockerfile has been renamed to `Dockerfile.old` as a backup.

**Key Differences:**
- Frontend now served by Nginx (not Bun)
- Backend doesn't serve frontend static files
- API requests proxied through Nginx
- Uploads persisted via volume (not in container)

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build and push
        run: |
          docker-compose build
          docker-compose push

      - name: Deploy
        run: docker-compose up -d
```

### Railway / Render
Both services now support docker-compose deployments. Point your service to this repo and it will auto-detect the docker-compose.yml.

## Production Considerations

1. **HTTPS/TLS**: Use a reverse proxy (Traefik, Caddy) or cloud load balancer
2. **Secrets**: Use Docker secrets or environment variables, never commit
3. **Logging**: Configure log aggregation (ELK, Loki, CloudWatch)
4. **Monitoring**: Add Prometheus + Grafana for metrics
5. **Backups**: Backup the `uploads` volume regularly

## Development Mode (Optional)

For local development with hot-reload, use bind mounts:

```yaml
# Add to docker-compose.yml
backend:
  volumes:
    - ./backend:/app
  command: bun run --watch src/server.ts

frontend:
  volumes:
    - ./frontend:/app
  command: bun run dev --host
```
