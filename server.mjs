import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

/**
 * Custom server: hosts the Next.js app AND Socket.io in the same process,
 * so the client connects same-origin (no CORS). Route handlers broadcast
 * through lib/realtime/server.ts, which reads the io instance from globalThis.
 *
 * Socket.io listens on path /api/socketio (Next.js owns everything else).
 */
const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
  });

  // Expose to Next.js route handlers (survives dev-server module re-eval).
  globalThis.__realtimeIo = io;

  io.on("connection", (socket) => {
    socket.emit("realtime", {
      type: "connected",
      payload: null,
      at: new Date().toISOString(),
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${
        dev ? "development" : process.env.NODE_ENV
      }`,
    );
  });
});
