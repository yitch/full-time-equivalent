import {
  TICKS_PER_SNAPSHOT,
  TICK_MS,
  applyIntent,
  createGame,
  removePlayer,
  step,
} from '@fte/shared'
import type { GameState, Intent, PlayerId, Profile, ServerMessage } from '@fte/shared'
import { bankRun, getProfile } from './profiles.js'
import type { WebSocket } from 'ws'

export interface Member {
  socket: WebSocket
  playerId: PlayerId
}

/**
 * One room, one authoritative simulation.
 *
 * Clients never send state — only intents. The loop is a fixed 20Hz with an
 * accumulator so a slow tick catches up rather than drifting, and snapshots go
 * out at 10Hz because the client interpolates anyway.
 */
export class Room {
  readonly code: string
  readonly state: GameState
  private members = new Map<PlayerId, Member>()
  private queue: { playerId: PlayerId; intent: Intent }[] = []
  private timer: NodeJS.Timeout | null = null
  private lastTime = 0
  private accumulator = 0
  private sinceSnapshot = 0

  constructor(code: string, seed: number) {
    this.code = code
    this.state = createGame(seed)
  }

  get size(): number {
    return this.members.size
  }

  get isEmpty(): boolean {
    return this.members.size === 0
  }

  join(playerId: PlayerId, socket: WebSocket, name: string, profileId?: string): boolean {
    const error = applyIntent(this.state, playerId, { t: 'join', name })
    if (error) {
      this.send(socket, { t: 'error', message: error })
      return false
    }
    this.members.set(playerId, { socket, playerId })

    let profile: Profile | null = null
    if (profileId) {
      profile = getProfile(profileId, name)
      const player = this.state.players[playerId]
      if (player) player.profileId = profileId
      this.send(socket, { t: 'profile', profile })
    }

    this.send(socket, { t: 'welcome', playerId, roomCode: this.code, state: this.state })
    this.start()
    return true
  }

  leave(playerId: PlayerId): void {
    const player = this.state.players[playerId]
    // Bank whatever they earned before they vanish. Losing a run to a closed
    // laptop is the fastest way to make progression feel worthless.
    if (player?.profileId) bankRun(this.state, player)
    this.members.delete(playerId)
    removePlayer(this.state, playerId)
    if (this.isEmpty) this.stop()
  }

  /** Intents are queued and applied at the top of the next tick, never mid-step. */
  submit(playerId: PlayerId, intent: Intent): void {
    if (this.queue.length > 512) return
    this.queue.push({ playerId, intent })
  }

  private start(): void {
    if (this.timer) return
    this.lastTime = Date.now()
    this.timer = setInterval(() => this.tick(), TICK_MS)
  }

  private stop(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }

  private tick(): void {
    const now = Date.now()
    this.accumulator += now - this.lastTime
    this.lastTime = now

    // Cap catch-up so a stalled process cannot spiral into hundreds of steps.
    let steps = 0
    while (this.accumulator >= TICK_MS && steps < 5) {
      this.accumulator -= TICK_MS
      steps++

      const batch = this.queue
      this.queue = []
      for (const { playerId, intent } of batch) {
        const error = applyIntent(this.state, playerId, intent)
        if (error) {
          const member = this.members.get(playerId)
          if (member) this.send(member.socket, { t: 'error', message: error })
        }
      }

      const before = this.state.phase
      step(this.state)
      this.sinceSnapshot++

      // Bank progression the moment the run resolves, not on disconnect.
      if (before !== this.state.phase && (this.state.phase === 'victory' || this.state.phase === 'gameover')) {
        for (const member of this.members.values()) {
          const player = this.state.players[member.playerId]
          if (!player?.profileId) continue
          const profile = bankRun(this.state, player)
          if (profile) this.send(member.socket, { t: 'profile', profile })
        }
      }
    }

    if (this.sinceSnapshot >= TICKS_PER_SNAPSHOT) {
      this.sinceSnapshot = 0
      this.broadcast({ t: 'snapshot', state: this.state })
    }
  }

  private broadcast(message: ServerMessage): void {
    const payload = JSON.stringify(message)
    for (const member of this.members.values()) {
      if (member.socket.readyState === 1) member.socket.send(payload)
    }
  }

  private send(socket: WebSocket, message: ServerMessage): void {
    if (socket.readyState === 1) socket.send(JSON.stringify(message))
  }
}

/** Room codes avoid vowels so they cannot spell anything an employee would report. */
const ALPHABET = 'BCDFGHJKLMNPQRSTVWXYZ23456789'

export function makeRoomCode(taken: Set<string>): string {
  for (let attempt = 0; attempt < 200; attempt++) {
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    }
    if (!taken.has(code)) return code
  }
  throw new Error('Could not allocate a room code.')
}
