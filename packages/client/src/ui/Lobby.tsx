import { ROLES, ROLE_IDS } from '@fte/shared'
import type { GameState, PlayerId, Profile, RoleId } from '@fte/shared'
import { useState } from 'react'

interface Props {
  state: GameState | null
  localPlayerId: PlayerId | null
  roomCode: string | null
  connected: boolean
  onConnect: (name: string, roomCode?: string) => void
  onPickRole: (role: RoleId) => void
  onReady: (value: boolean) => void
  profile: Profile | null
}

/** The honest line about each animal. Shown at pick time, before it is too late. */
const ROLE_WARNINGS: Record<RoleId, string> = {
  hippo: 'Ignores every defence. Earns almost no Social Capital, because being obeyed is not being right.',
  zebra: 'Double damage on first contact, half once anything checks the work.',
  wolf: 'Devastating against whatever just arrived. Nearly useless against the backlog.',
  rhino: 'Does literally nothing for the first 18 seconds of a wave, then flattens the room.',
  seagull: 'Fastest in the game and physically cannot hold ground. Stand still and you teleport.',
  goose: 'Half the cooldowns of anyone else. Three in ten abilities simply do not happen.',
  puffin: 'Cheap towers and spare capacity. Everything you build creates more work.',
  puma: 'Every hit rolls between a quarter and two and a half times damage. Every single one.',
  cobra: 'Grows lethal against anything it has already killed this wave. Blind to anything new.',
  yak: 'Generates Social Capital passively. Every tower near you is too busy reporting to work.',
  donkey: 'Triple attack speed, a third of the damage. Volume is the entire strategy.',
  mouse: 'Very hard to kill, deals very little, and requests ignore you completely.',
  viper: 'Permanently stronger every time the team fails. You need the team to fail.',
  dodo: '+140% damage. Cooldown reduction does nothing for you and your towers never upgrade.',
}

export function Lobby({ state, localPlayerId, roomCode, connected, onConnect, onPickRole, onReady, profile }: Props) {
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
        <h1>PICK YOUR ANIMAL</h1>
        {profile && (
          <p style={{ fontSize: 10, color: 'var(--social)' }}>
            Account level <b>{profile.accountLevel}</b> · best wave {profile.records.bestWave} ·{' '}
            {profile.records.runs} run{profile.records.runs === 1 ? '' : 's'} ·{' '}
            {profile.records.victories} survived · {profile.unlocked.length}/14 animals unlocked ·{' '}
            {profile.stash.length} in the stash
          </p>
        )}
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
            const locked = profile ? !profile.unlocked.includes(id) : false
            const animalLevel = profile?.animalLevels?.[id] ?? 0
            return (
              <button
                key={id}
                className={`role-card${mine ? ' active' : ''}${locked ? ' locked' : ''}`}
                style={{ borderColor: mine ? role.colour : undefined }}
                disabled={locked}
                title={locked ? 'Unlocks as your account level rises.' : role.dysfunction}
                onClick={() => onPickRole(id)}
              >
                <div className="rn" style={{ color: role.colour }}>
                  {role.name}
                </div>
                <div className="rx">
                  {role.expansion}
                  {animalLevel > 1 && <b style={{ color: 'var(--social)' }}> · lvl {animalLevel}</b>}
                  {locked && <b style={{ color: 'var(--paper-dim)' }}> · LOCKED</b>}
                </div>
                <div className="rf">{role.flavour}</div>
                <div className="rp">
                  <b>{role.passiveName}:</b> {role.passiveText}
                </div>
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
