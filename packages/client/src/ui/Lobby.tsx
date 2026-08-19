import { ROLES, ROLE_IDS } from '@fte/shared'
import type { GameState, PlayerId, RoleId } from '@fte/shared'
import { useState } from 'react'

interface Props {
  state: GameState | null
  localPlayerId: PlayerId | null
  roomCode: string | null
  connected: boolean
  onConnect: (name: string, roomCode?: string) => void
  onPickRole: (role: RoleId) => void
  onReady: (value: boolean) => void
}

/** How each role reads at pick time. The warning line is the honest one. */
const ROLE_WARNINGS: Record<RoleId, string> = {
  hrbp: 'Loses a random ability every wave. Someone books you into a meeting.',
  payroll: 'Strongest single-target in the game, locked to one problem.',
  talent: 'Every good thing you do also spawns work. Read your ultimate twice.',
  rewards: 'Your ultimate takes sixty seconds and breaks if you move.',
  hris: 'Your ultimate ends in a blackout. Timing it is the whole class.',
  travel: 'Worst stats until wave 6. The only counter to Expense Claims. Someone has to.',
}

export function Lobby({ state, localPlayerId, roomCode, connected, onConnect, onPickRole, onReady }: Props) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const me = state && localPlayerId ? state.players[localPlayerId] : null
  const others = state ? Object.values(state.players).filter((p) => p.connected) : []

  if (!connected) {
    return (
      <div className="overlay">
        <div className="panel">
          <h1>FULL-TIME EQUIVALENT</h1>
          <p style={{ color: 'var(--paper-dim)' }}>
            A people operations tower defence. You do not place people. You place processes.
          </p>
          <p className="teaches">
            51% of HR working hours go on admin that could be automated. 94% of HR managers report feeling
            overwhelmed. Open enrollment raises ticket volume five to ten times. Everything in this game is
            load-bearing, including the jokes.
          </p>

          <div className="field">
            <label>YOUR NAME</label>
            <input
              value={name}
              maxLength={18}
              placeholder="e.g. Sam from HR"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && onConnect(name.trim(), code.trim() || undefined)}
            />
          </div>
          <div className="field">
            <label>ROOM CODE</label>
            <input
              value={code}
              maxLength={4}
              placeholder="blank = new room"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>

          <button
            className="chunky"
            disabled={!name.trim()}
            onClick={() => onConnect(name.trim(), code.trim() || undefined)}
          >
            CLOCK IN
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay">
      <div className="panel">
        <h1>PICK YOUR FUNCTION</h1>
        <p style={{ color: 'var(--paper-dim)' }}>
          Room <b style={{ color: 'var(--highlighter)' }}>{roomCode ?? '····'}</b> — share that code. Up to five.
          Duplicates are allowed and are worse, for reasons everyone here understands.
        </p>

        <div className="role-grid">
          {ROLE_IDS.map((id) => {
            const role = ROLES[id]
            if (!role) return null
            const taken = others.filter((p) => p.role === id && p.id !== localPlayerId).length
            const mine = me?.role === id
            return (
              <button
                key={id}
                className={`role-card${mine ? ' active' : ''}`}
                style={{ borderColor: mine ? role.colour : undefined }}
                onClick={() => onPickRole(id)}
              >
                <div className="rn" style={{ color: role.colour }}>
                  {role.name}
                </div>
                <div className="rt">{role.title}</div>
                <div className="rf">{role.flavour}</div>
                <span className="warn">{ROLE_WARNINGS[id]}</span>
                {taken > 0 && (
                  <span className="warn" style={{ color: 'var(--escalate)' }}>
                    {taken} already on this · unclear ownership penalty applies
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="field">
          <button className="chunky" disabled={!me?.role} onClick={() => onReady(!me?.ready)}>
            {me?.ready ? 'NOT READY' : 'READY'}
          </button>
          <span style={{ fontSize: 10, color: 'var(--paper-dim)' }}>
            {others.filter((p) => p.ready).length}/{others.length} ready · the day starts when everybody is
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {others.map((p) => (
            <span
              key={p.id}
              style={{
                fontSize: 9,
                padding: '3px 8px',
                border: '1px solid var(--wall)',
                borderLeft: `3px solid ${p.role ? (ROLES[p.role]?.colour ?? '#fff') : 'var(--wall)'}`,
                opacity: p.ready ? 1 : 0.5,
              }}
            >
              {p.name} · {p.role ? ROLES[p.role]?.name : 'undecided'} {p.ready ? '✓' : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
