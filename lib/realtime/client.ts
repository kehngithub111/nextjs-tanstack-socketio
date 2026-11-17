"use client"

import { useEffect, useSyncExternalStore } from "react"
import { io, type Socket } from "socket.io-client"

/**
 * Client realtime transport — Socket.io, same-origin via the custom server
 * (server.mjs) on path /api/socketio.
 *
 * The message contract is transport-agnostic ({ type, payload, at }), and
 * the public API below is the only thing the rest of the app depends on.
 * To move to a dedicated realtime server later, set
 * NEXT_PUBLIC_REALTIME_URL (e.g. "https://realtime.myapp.com") — no code
 * changes needed.
 *
 * Socket.io reconnects automatically with exponential backoff.
 */
const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL
const SOCKET_PATH = "/api/socketio"

export type RealtimeMessage = {
  type: string
  payload: unknown
  at: string
}

export type RealtimeStatus = "connecting" | "open" | "closed"

let socket: Socket | null = null
const messageListeners = new Set<(message: RealtimeMessage) => void>()
const statusListeners = new Set<() => void>()
let status: RealtimeStatus = "connecting"

function setStatus(next: RealtimeStatus) {
  if (status === next) return
  status = next
  for (const listener of statusListeners) listener()
}

function ensureSocket() {
  if (socket || typeof window === "undefined") return
  socket = REALTIME_URL ? io(REALTIME_URL, { path: SOCKET_PATH }) : io({ path: SOCKET_PATH })

  socket.on("connect", () => setStatus("open"))
  socket.on("disconnect", () => setStatus("connecting"))
  socket.on("connect_error", () => setStatus("connecting"))
  socket.on("realtime", (raw: unknown) => {
    try {
      const message =
        typeof raw === "string" ? (JSON.parse(raw) as RealtimeMessage) : (raw as RealtimeMessage)
      for (const listener of messageListeners) listener(message)
    } catch {
      // ignore malformed frames
    }
  })
}

/** Low-level subscription — returns an unsubscribe function. */
export function subscribeToRealtime(
  listener: (message: RealtimeMessage) => void,
): () => void {
  ensureSocket()
  messageListeners.add(listener)
  return () => messageListeners.delete(listener)
}

function subscribeStatus(listener: () => void): () => void {
  ensureSocket()
  statusListeners.add(listener)
  return () => statusListeners.delete(listener)
}

/** React to any realtime event. Wrap `handler` in useCallback for stability. */
export function useRealtimeEvent(handler: (message: RealtimeMessage) => void) {
  useEffect(() => subscribeToRealtime(handler), [handler])
}

/** Live connection status ("connecting" | "open" | "closed"). */
export function useRealtimeStatus(): RealtimeStatus {
  return useSyncExternalStore(
    subscribeStatus,
    () => status,
    () => "connecting" as const,
  )
}
