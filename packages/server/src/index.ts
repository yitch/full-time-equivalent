import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import type { WebSocket } from 'ws'
import type { ClientMessage } from '@fte/shared'
import { Room, makeRoomCode } from './room.js'

/**
 * FTE_PORT wins over PORT so a dev harness that injects PORT for the web server
 * cannot silently steal the game server's socket. PORT still works in production.
 */
const PORT = Number(process.env.FTE_PORT ?? process.env.PORT ?? 8787)

const rooms = new Map<string, Room>()

function findOrCreateRoom(code?: string): Room {
  if (code) {
    const existing = rooms.get(code.toUpperCase())
    if (existing) return existing
  }
  const newCode = code?.toUpperCase() ?? makeRoomCode(new Set(rooms.keys()))
  const room = new Room(newCode, Math.floor(Math.random() * 2 ** 31))
  rooms.set(newCode, room)
  return room
}

const http = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }))
    return
  }
  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({ server: http })

wss.on('connection', (socket: WebSocket) => {
  const playerId = randomUUID()
  let room: Room | null = null

  socket.on('message', (raw) => {
    let message: ClientMessage
    try {
      message = JSON.parse(String(raw)) as ClientMessage
    } catch {
      return
    }

    if (message.t === 'hello') {
      if (room) return
      room = findOrCreateRoom(message.roomCode)
      const joined = room.join(playerId, socket, message.name)
      if (!joined) room = null
      else console.log(`[room ${room.code}] ${message.name} joined (${room.size} in room)`)
      return
    }

    if (message.t === 'intent' && room) {
      room.submit(playerId, message.intent)
    }
  })

  socket.on('close', () => {
    if (!room) return
    room.leave(playerId)
    console.log(`[room ${room.code}] a player left (${room.size} remaining)`)
    if (room.isEmpty) {
      rooms.delete(room.code)
      console.log(`[room ${room.code}] closed`)
    }
  })
})

http.listen(PORT, () => {
  console.log(`Shared Services is open. ws://localhost:${PORT}`)
})
