FROM oven/bun:1 as builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install dependencies
RUN cd frontend && bun install
RUN cd backend && bun install

# Copy source code
COPY frontend ./frontend
COPY backend ./backend

# Build frontend
RUN cd frontend && bun run build

# Build backend
RUN cd backend && bun run build

# Production stage
FROM debian:bookworm-slim

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/backend/community-chat-server .
COPY --from=builder /app/frontend/build ./static

# Make binary executable
RUN chmod +x community-chat-server

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV FRONTEND_URL=http://localhost:5173

# Run the application
CMD ["./community-chat-server"]
