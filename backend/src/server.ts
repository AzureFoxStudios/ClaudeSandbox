import { Server } from "socket.io";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// In-memory data store
const messages: Array<{
  id: string;
  user: string;
  userId: string;
  text: string;
  timestamp: number;
  type: 'text' | 'gif' | 'file';
  gifUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isPinned?: boolean;
  isEdited?: boolean;
  replyTo?: string;
}> = [];

const pinnedMessages = new Set<string>();

const users = new Map<string, {
  id: string;
  username: string;
  color: string;
  status: 'active' | 'away' | 'busy';
  profilePicture?: string;
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

// Create HTTP server using Node.js http module (Bun compatible)
const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  // Health check endpoint
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      users: users.size,
      messages: messages.length,
      uptime: process.uptime()
    }));
    return;
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

      res.writeHead(200, { "Content-Type": contentTypes[ext || 'html'] || 'text/plain' });
      res.end(file);
      return;
    }
  }

  res.writeHead(404);
  res.end("Not Found");
});

// Start HTTP server
server.listen(PORT);

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
      color,
      status: 'active',
      profilePicture: undefined
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
      color,
      status: 'active',
      profilePicture: undefined
    });

    console.log(`${username} joined the chat`);
  });

  // Handle profile updates
  socket.on("update-profile", (data: { status?: 'active' | 'away' | 'busy'; profilePicture?: string }) => {
    const user = users.get(socket.id);
    if (!user) return;

    if (data.status) {
      user.status = data.status;
    }
    if (data.profilePicture !== undefined) {
      user.profilePicture = data.profilePicture;
    }

    users.set(socket.id, user);

    // Broadcast profile update to all users
    io.emit("profile-updated", {
      id: socket.id,
      username: user.username,
      color: user.color,
      status: user.status,
      profilePicture: user.profilePicture
    });

    console.log(`${user.username} updated profile: status=${user.status}`);
  });

  // Handle chat messages
  socket.on("message", (data: {
    text: string;
    type: 'text' | 'gif' | 'file';
    gifUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyTo?: string;
  }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: `${Date.now()}-${socket.id}`,
      user: user.username,
      userId: socket.id,
      text: data.text,
      timestamp: Date.now(),
      type: data.type,
      gifUrl: data.gifUrl,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      isPinned: false,
      isEdited: false,
      replyTo: data.replyTo
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

  // Handle message edit
  socket.on("edit-message", (data: { messageId: string; newText: string }) => {
    const message = messages.find(m => m.id === data.messageId);
    if (!message || message.userId !== socket.id) return;

    message.text = data.newText;
    message.isEdited = true;

    io.emit("message-edited", { messageId: data.messageId, newText: data.newText });
  });

  // Handle message delete
  socket.on("delete-message", (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];
    if (message.userId !== socket.id) return;

    messages.splice(messageIndex, 1);
    pinnedMessages.delete(messageId);

    io.emit("message-deleted", messageId);
  });

  // Handle message pin/unpin
  socket.on("toggle-pin-message", (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    message.isPinned = !message.isPinned;

    if (message.isPinned) {
      pinnedMessages.add(messageId);
    } else {
      pinnedMessages.delete(messageId);
    }

    io.emit("message-pin-toggled", { messageId, isPinned: message.isPinned });
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

  // Voice/Video calling
  socket.on("call-initiate", (data: { targetUserId: string; isVideoCall: boolean }) => {
    const user = users.get(socket.id);
    if (!user) return;

    io.to(data.targetUserId).emit("call-incoming", {
      userId: socket.id,
      username: user.username,
      isVideoCall: data.isVideoCall
    });
  });

  socket.on("call-answer", (data: { callerId: string; isVideoCall: boolean }) => {
    io.to(data.callerId).emit("call-accepted", {
      userId: socket.id,
      isVideoCall: data.isVideoCall
    });
  });

  socket.on("call-reject", (data: { callerId: string }) => {
    io.to(data.callerId).emit("call-rejected", {
      userId: socket.id
    });
  });

  socket.on("call-end", () => {
    socket.broadcast.emit("call-ended", {
      userId: socket.id
    });
  });

  socket.on("call-offer", (data: { offer: RTCSessionDescriptionInit; targetId: string }) => {
    io.to(data.targetId).emit("call-offer", {
      offer: data.offer,
      senderId: socket.id
    });
  });

  socket.on("call-answer-sdp", (data: { answer: RTCSessionDescriptionInit; targetId: string }) => {
    io.to(data.targetId).emit("call-answer-sdp", {
      answer: data.answer,
      senderId: socket.id
    });
  });

  socket.on("call-ice-candidate", (data: { candidate: RTCIceCandidateInit; targetId: string }) => {
    io.to(data.targetId).emit("call-ice-candidate", {
      candidate: data.candidate,
      senderId: socket.id
    });
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
