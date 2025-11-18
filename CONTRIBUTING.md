# Contributing to Community Chat

Thank you for your interest in contributing to Community Chat! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit and push
7. Open a Pull Request

## Development Setup

```bash
# Install Bun if you haven't already
curl -fsSL https://bun.sh/install | bash

# Install dependencies
cd frontend && bun install
cd ../backend && bun install

# Start development servers
bun run dev
```

## Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable names

## Testing

Before submitting a PR, please test:

- [ ] Chat messaging works
- [ ] User presence updates correctly
- [ ] Typing indicators appear/disappear
- [ ] Screen sharing works (requires HTTPS in production)
- [ ] Excalidraw collaboration syncs
- [ ] GIF picker loads and sends GIFs
- [ ] Export functionality works
- [ ] UI is responsive on mobile

## Feature Ideas

Here are some features we'd love to see:

- **Authentication**: Add user accounts and login
- **Persistence**: Optional database storage for messages
- **Reactions**: Add emoji reactions to messages
- **File Sharing**: Upload and share files
- **Voice/Video**: Add WebRTC voice/video chat
- **Themes**: Customizable color themes
- **Moderation**: Admin controls and user moderation
- **Threading**: Reply to specific messages
- **Search**: Search through message history
- **Notifications**: Desktop/push notifications
- **i18n**: Multi-language support

## Architecture Notes

### Backend (backend/src/server.ts)

- Uses in-memory storage for all data
- Socket.IO handles real-time events
- WebRTC signaling for screen sharing
- Serves static frontend files in production

### Frontend (frontend/src/)

- SvelteKit with TypeScript
- Socket.IO client for real-time updates
- WebRTC for peer-to-peer screen sharing
- Svelte stores for state management

### Key Files

- `frontend/src/lib/socket.ts` - Socket.IO client and message state
- `frontend/src/lib/webrtc.ts` - WebRTC utilities for screen sharing
- `backend/src/server.ts` - Main server with all Socket.IO handlers

## Pull Request Process

1. Update README.md if you add new features
2. Add comments to complex code
3. Test your changes thoroughly
4. Update the CHANGELOG if applicable
5. Ensure the build passes: `bun run build`
6. Keep PRs focused on a single feature/fix

## Bug Reports

When reporting bugs, please include:

- OS and browser version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Console errors

## Questions?

Open an issue with the "question" label, and we'll be happy to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
