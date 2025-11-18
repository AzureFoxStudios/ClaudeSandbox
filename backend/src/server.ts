import { Server } from "socket.io";
import { serve } from "bun";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// In-memory data store
const messages: Array<{
  id: string;
  user: string;
  text: string;
  timestamp: number;
  type: 'text' | 'gif';
  gifUrl?: string;
}> = [];

const users = new Map<string, {
  id: string;
  username: string;
  color: string;
}>();

const typingUsers = new Set<string>();

// WebRTC signaling state
const screenSharers = new Map<string, {
  userId: string;
  username: string;
}>();

// Excalidraw state
let excalidrawState: any = null;

const PORT = process.env.PORT || 3000;
const STATIC_DIR = process.env.STATIC_DIR || join(import.meta.dir, "../../static");

// Create HTTP server
const server = serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "ok",
        users: users.size,
        messages: messages.length,
        uptime: process.uptime()
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Serve static files in production
    if (existsSync(STATIC_DIR)) {
      let filePath = join(STATIC_DIR, url.pathname === "/" ? "index.html" : url.pathname);

      // If file doesn't exist, serve index.html for client-side routing
      if (!existsSync(filePath)) {
        filePath = join(STATIC_DIR, "index.html");
      }

      if (existsSync(filePath)) {
        const file = readFileSync(filePath);
        const ext = filePath.split('.').pop();
        const contentTypes: Record<string, string> = {
          'html': 'text/html',
          'js': 'application/javascript',
          'css': 'text/css',
          'json': 'application/json',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'svg': 'image/svg+xml',
          'ico': 'image/x-icon'
        };

        return new Response(file, {
          headers: { "Content-Type": contentTypes[ext || 'html'] || 'text/plain' }
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
});

// Create Socket.IO server attached to HTTP server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user join
  socket.on("join", (username: string) => {
    const color = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    users.set(socket.id, {
      id: socket.id,
      username,
      color
    });

    // Send existing messages and users to the new user
    socket.emit("init", {
      messages,
      users: Array.from(users.values()),
      excalidrawState
    });

    // Broadcast new user to others
    socket.broadcast.emit("user-joined", {
      id: socket.id,
      username,
      color
    });

    console.log(`${username} joined the chat`);
  });

  // Handle chat messages
  socket.on("message", (data: { text: string; type: 'text' | 'gif'; gifUrl?: string }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: `${Date.now()}-${socket.id}`,
      user: user.username,
      text: data.text,
      timestamp: Date.now(),
      type: data.type,
      gifUrl: data.gifUrl
    };

    messages.push(message);

    // Keep only last 500 messages (memory management)
    if (messages.length > 500) {
      messages.shift();
    }

    io.emit("message", message);

    // Clear typing indicator
    if (typingUsers.has(socket.id)) {
      typingUsers.delete(socket.id);
      io.emit("typing", Array.from(typingUsers).map(id => users.get(id)?.username).filter(Boolean));
    }
  });

  // Handle typing indicator
  socket.on("typing", (isTyping: boolean) => {
    const user = users.get(socket.id);
    if (!user) return;

    if (isTyping) {
      typingUsers.add(socket.id);
    } else {
      typingUsers.delete(socket.id);
    }

    io.emit("typing", Array.from(typingUsers).map(id => users.get(id)?.username).filter(Boolean));
  });

  // WebRTC Signaling for screen sharing
  socket.on("start-screen-share", () => {
    const user = users.get(socket.id);
    if (!user) return;

    screenSharers.set(socket.id, {
      userId: socket.id,
      username: user.username
    });

    socket.broadcast.emit("screen-share-started", {
      userId: socket.id,
      username: user.username
    });
  });

  socket.on("stop-screen-share", () => {
    screenSharers.delete(socket.id);
    socket.broadcast.emit("screen-share-stopped", socket.id);
  });

  socket.on("webrtc-offer", (data: { offer: RTCSessionDescriptionInit; targetId: string }) => {
    io.to(data.targetId).emit("webrtc-offer", {
      offer: data.offer,
      senderId: socket.id
    });
  });

  socket.on("webrtc-answer", (data: { answer: RTCSessionDescriptionInit; targetId: string }) => {
    io.to(data.targetId).emit("webrtc-answer", {
      answer: data.answer,
      senderId: socket.id
    });
  });

  socket.on("webrtc-ice-candidate", (data: { candidate: RTCIceCandidateInit; targetId: string }) => {
    io.to(data.targetId).emit("webrtc-ice-candidate", {
      candidate: data.candidate,
      senderId: socket.id
    });
  });

  // Excalidraw collaboration
  socket.on("excalidraw-update", (state: any) => {
    excalidrawState = state;
    socket.broadcast.emit("excalidraw-update", state);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const user = users.get(socket.id);

    if (user) {
      users.delete(socket.id);
      typingUsers.delete(socket.id);

      if (screenSharers.has(socket.id)) {
        screenSharers.delete(socket.id);
        socket.broadcast.emit("screen-share-stopped", socket.id);
      }

      socket.broadcast.emit("user-left", {
        id: socket.id,
        username: user.username
      });

      console.log(`${user.username} left the chat`);
    }
  });
});

console.log(`🚀 Community Chat server running on port ${PORT}`);
console.log(`📁 Serving static files from: ${STATIC_DIR}`);
console.log(`💚 Health check available at: http://localhost:${PORT}/health`);
