import { ROLES, TOWERS, TOWER_IDS } from '@fte/shared'
import type { GameState, PlayerId, RoleId, TechId, TowerTypeId, Vec2 } from '@fte/shared'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NetClient, type NetStatus } from '../net/client.js'
import { Board } from './Board.js'
import { BottomBar } from './BottomBar.js'
import { Lobby } from './Lobby.js'
import { Briefing, EndCard, Steering } from './Overlays.js'
import { TechTree } from './TechTree.js'
import { TopBar } from './TopBar.js'

/** Keyboard key -> ability slot. W is movement, so the second ability lives on F. */
const ABILITY_KEYS: Record<string, 'Q' | 'W' | 'E' | 'R'> = {
  q: 'Q',
  f: 'W',
  e: 'E',
  r: 'R',
}

const MOVE_KEYS: Record<string, Vec2> = {
  w: { x: 0, y: -1 },
  a: { x: -1, y: 0 },
  s: { x: 0, y: 1 },
  d: { x: 1, y: 0 },
  arrowup: { x: 0, y: -1 },
  arrowleft: { x: -1, y: 0 },
  arrowdown: { x: 0, y: 1 },
  arrowright: { x: 1, y: 0 },
}

export function App() {
  const [state, setState] = useState<GameState | null>(null)
  const [localPlayerId, setLocalPlayerId] = useState<PlayerId | null>(null)
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [status, setStatus] = useState<NetStatus>('idle')
  const [toast, setToast] = useState<string | null>(null)
  const [selected, setSelected] = useState<TowerTypeId | null>(null)
  const [techOpen, setTechOpen] = useState(false)

  const netRef = useRef<NetClient | null>(null)
  const heldRef = useRef(new Set<string>())
  const lastMoveRef = useRef<Vec2>({ x: 0, y: 0 })
  const toastTimer = useRef<number | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  const net = useMemo(() => {
    const client = new NetClient({
      onState: setState,
      onWelcome: (playerId, code) => {
        setLocalPlayerId(playerId)
        setRoomCode(code)
      },
      onError: showToast,
      onStatus: setStatus,
    })
    netRef.current = client
    return client
  }, [showToast])

  useEffect(() => () => netRef.current?.disconnect(), [])

  // ── keyboard ───────────────────────────────────────────────────────────────

  const availableTowers = useMemo(
    () => TOWER_IDS.filter((id) => !TOWERS[id]?.requires || (state?.unlocked ?? []).includes(TOWERS[id]!.requires!)),
    [state?.unlocked],
  )

  useEffect(() => {
    if (!localPlayerId) return

    function pushMove() {
      let x = 0
      let y = 0
      for (const key of heldRef.current) {
        const vec = MOVE_KEYS[key]
        if (!vec) continue
        x += vec.x
        y += vec.y
      }
      x = Math.max(-1, Math.min(1, x))
      y = Math.max(-1, Math.min(1, y))
      if (x === lastMoveRef.current.x && y === lastMoveRef.current.y) return
      lastMoveRef.current = { x, y }
      net.send({ t: 'move', x, y })
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement) return
      const key = event.key.toLowerCase()

      if (key === 'tab') {
        event.preventDefault()
        setTechOpen((open) => !open)
        return
      }
      if (key === 'escape') {
        setSelected(null)
        setTechOpen(false)
        return
      }
      // W is taken by movement, so the second ability sits on F.
      const abilityKey = ABILITY_KEYS[key]
      if (abilityKey) {
        net.send({ t: 'ability', key: abilityKey })
        return
      }
      if (/^[1-9]$/.test(key)) {
        const tower = availableTowers[Number(key) - 1]
        setSelected(tower ?? null)
        return
      }
      if (MOVE_KEYS[key]) {
        heldRef.current.add(key)
        pushMove()
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      if (heldRef.current.delete(key)) pushMove()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', () => {
      heldRef.current.clear()
      pushMove()
    })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [localPlayerId, net, availableTowers])

  // ── actions ────────────────────────────────────────────────────────────────

  const connect = (name: string, code?: string) => net.connect(name, code)
  const pickRole = (role: RoleId) => net.send({ t: 'pick_role', role })
  const ready = (value: boolean) => net.send({ t: 'ready', value })
  const unlock = (tech: TechId) => net.send({ t: 'unlock', tech })
  const startWave = () => net.send({ t: 'start_wave' })

  const place = (tile: Vec2) => {
    if (!selected) return
    net.send({ t: 'build', tower: selected, tile: { x: Math.floor(tile.x), y: Math.floor(tile.y) } })
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const connected = status === 'open' || status === 'connecting'
  const inLobby = !state || state.phase === 'lobby'

  if (inLobby) {
    return (
      <Lobby
        state={state}
        localPlayerId={localPlayerId}
        roomCode={roomCode}
        connected={connected && !!localPlayerId}
        onConnect={connect}
        onPickRole={pickRole}
        onReady={ready}
      />
    )
  }

  const me = localPlayerId ? state.players[localPlayerId] : null
  const roster = Object.values(state.players).filter((p) => p.connected)
  const lastLog = state.log[state.log.length - 1] ?? ''

  return (
    <div className="shell">
      <TopBar state={state} />

      <div className="board-wrap">
        <Board
          state={state}
          localPlayerId={localPlayerId}
          buildingTower={selected}
          onPlace={place}
          onCancel={() => setSelected(null)}
        >
          {toast && <div className="toast">{toast}</div>}

          <div className="roster">
            {roster.map((p) => (
              <div
                key={p.id}
                className="who pixel"
                style={{ borderLeftColor: p.role ? (ROLES[p.role]?.colour ?? '#fff') : '#fff' }}
              >
                {p.name} · {p.role ? ROLES[p.role]?.name : '—'}
                {p.ownershipPenalty < 1 && ' ⚠'}
              </div>
            ))}
          </div>

          <div className="hint">
            <b>WASD</b> move · <b>Q F E R</b> abilities · <b>1-9</b> pick a process ·
            click to place
            <br />
            {me?.role && ROLES[me.role]?.title}
            {state.maintenanceTicks > 0 && (
              <span style={{ color: 'var(--escalate)' }}> · MAINTENANCE WINDOW — AUTOMATION IS DOWN</span>
            )}
          </div>

          <div className="ticker">{lastLog}</div>

          {state.phase === 'briefing' && <Briefing state={state} onStart={startWave} />}
          {state.phase === 'steering' && (
            <Steering state={state} onOpenTech={() => setTechOpen(true)} onNext={startWave} />
          )}
          {(state.phase === 'gameover' || state.phase === 'victory') && <EndCard state={state} />}
          {techOpen && <TechTree state={state} onUnlock={unlock} onClose={() => setTechOpen(false)} />}
        </Board>
      </div>

      <BottomBar
        state={state}
        localPlayerId={localPlayerId}
        selected={selected}
        onSelect={setSelected}
        onOpenTech={() => setTechOpen(true)}
        onStartWave={startWave}
      />
    </div>
  )
}
