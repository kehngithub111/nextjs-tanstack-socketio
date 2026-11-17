import type { Server as SocketServer } from "socket.io"

/**
 * Server-side bridge from route handlers to the Socket.io server that runs
 * in server.mjs. The io instance lives on globalThis so it survives the
 * dev server's module re-evaluation.
 *
 * WHEN MOVING TO A DEDICATED REALTIME SERVER: keep this file's API —
 * publish() can post to that server's HTTP endpoint instead of emitting
 * locally, and client code is unaffected.
 */

type RealtimeGlobal = typeof globalThis & {
  __realtimeIo?: SocketServer
}

/** Called by server.mjs once at startup. */
export function setSocketServer(io: SocketServer) {
  ;(globalThis as RealtimeGlobal).__realtimeIo = io
}

/** Broadcast a typed event to every connected client. */
export function publishRealtime(type: string, payload?: unknown) {
  const io = (globalThis as RealtimeGlobal).__realtimeIo
  io?.emit("realtime", { type, payload, at: new Date().toISOString() })
}
