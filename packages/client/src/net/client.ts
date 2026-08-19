import type { ClientMessage, GameState, Intent, PlayerId, Profile, ServerMessage } from '@fte/shared'

export type NetStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

export interface NetListeners {
  onState: (state: GameState) => void
  onProfile: (profile: Profile) => void
  onWelcome: (playerId: PlayerId, roomCode: string) => void
  onError: (message: string) => void
  onStatus: (status: NetStatus) => void
}

/**
 * The profile id is just a random string in localStorage. No accounts, no
 * email, no password — enough to make progression persist, and nothing more.
 */
export function getProfileId(): string {
  const KEY = 'fte.profileId'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = `p_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    localStorage.setItem(KEY, id)
  }
  return id
}

const DEFAULT_URL =
  import.meta.env.VITE_SERVER_URL ??
  `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:8787`

/**
 * Thin transport. It sends intents and receives snapshots — it holds no game
 * logic at all, because the server is the only writer and this file having an
 * opinion is how desyncs start.
 */
export class NetClient {
  private socket: WebSocket | null = null
  private listeners: NetListeners
  private outbox: ClientMessage[] = []

  constructor(listeners: NetListeners) {
    this.listeners = listeners
  }

  connect(name: string, roomCode?: string, url: string = DEFAULT_URL): void {
    this.listeners.onStatus('connecting')
    const profileId = getProfileId()
    const socket = new WebSocket(url)
    this.socket = socket

    socket.addEventListener('open', () => {
      this.listeners.onStatus('open')
      this.raw({ t: 'hello', name, profileId, ...(roomCode ? { roomCode } : {}) })
      for (const message of this.outbox) this.raw(message)
      this.outbox = []
    })

    socket.addEventListener('message', (event) => {
      let message: ServerMessage
      try {
        message = JSON.parse(String(event.data)) as ServerMessage
      } catch {
        return
      }
      if (message.t === 'profile') {
        this.listeners.onProfile(message.profile)
      } else if (message.t === 'welcome') {
        this.listeners.onWelcome(message.playerId, message.roomCode)
        this.listeners.onState(message.state)
      } else if (message.t === 'snapshot') {
        this.listeners.onState(message.state)
      } else if (message.t === 'error') {
        this.listeners.onError(message.message)
      }
    })

    socket.addEventListener('close', () => this.listeners.onStatus('closed'))
    socket.addEventListener('error', () => this.listeners.onStatus('error'))
  }

  send(intent: Intent): void {
    this.raw({ t: 'intent', intent })
  }

  private raw(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      this.outbox.push(message)
    }
  }

  disconnect(): void {
    this.socket?.close()
    this.socket = null
  }
}
