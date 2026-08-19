import { TICK_HZ, WAVES } from '@fte/shared'
import type { GameState } from '@fte/shared'

export function Briefing({ state, onStart }: { state: GameState; onStart: () => void }) {
  const wave = WAVES[state.waveIndex]
  if (!wave) return null
  const seconds = Math.ceil(state.phaseTicks / TICK_HZ)

  return (
    <div className="overlay">
      <div className="panel" style={{ maxWidth: 640 }}>
        <h2>
          WAVE {wave.index + 1} OF {WAVES.length}
          {wave.boss ? ' · BOSS' : ''}
        </h2>
        <h1>{wave.name}</h1>
        <p>{wave.briefing}</p>
        <p className="teaches">{wave.teaches}</p>
        {wave.maintenanceWindows && wave.maintenanceWindows.length > 0 && (
          <p style={{ color: 'var(--escalate)', fontSize: 11 }}>
            ⚠ Scheduled maintenance during this wave. Every automation tower goes dark.
          </p>
        )}
        <button className="chunky" onClick={onStart}>
          BEGIN ({seconds}s)
        </button>
      </div>
    </div>
  )
}

export function Steering({ state, onOpenTech, onNext }: { state: GameState; onOpenTech: () => void; onNext: () => void }) {
  const seconds = Math.ceil(state.phaseTicks / TICK_HZ)
  const prev = WAVES[state.waveIndex - 1]

  return (
    <div className="overlay">
      <div className="panel" style={{ maxWidth: 620 }}>
        <h2>WAVE CLEAR</h2>
        <h1>{prev?.name ?? 'Done'}</h1>
        <p>
          Resolved <b>{state.stats.resolved}</b> · breached <b style={{ color: 'var(--escalate)' }}>{state.stats.breached}</b> ·
          deflected at Tier 0 <b style={{ color: 'var(--tube-glow)' }}>{state.stats.deflected}</b> · escalations{' '}
          <b style={{ color: 'var(--escalate)' }}>{state.stats.escalations}</b>
        </p>
        <p className="teaches">
          Social Capital is only paid for in-SLA resolutions and Tier-0 deflections. Surviving is not the same
          as doing well, and the difference compounds.
        </p>
        <div className="field">
          <button className="chunky ghost" onClick={onOpenTech}>
            OPEN STEERING COMMITTEE
          </button>
          <button className="chunky" onClick={onNext}>
            NEXT WAVE ({seconds}s)
          </button>
        </div>
      </div>
    </div>
  )
}

export function EndCard({ state }: { state: GameState }) {
  const won = state.phase === 'victory'
  const audited = state.compliance <= 0

  return (
    <div className="overlay">
      <div className="panel" style={{ maxWidth: 560 }}>
        <h1 style={{ color: won ? 'var(--tube-glow)' : 'var(--escalate)' }}>
          {won ? 'YOU SURVIVED OPEN ENROLLMENT' : audited ? 'AUDIT' : 'MORALE HIT ZERO'}
        </h1>
        <p>
          {won
            ? 'Nobody will ever know how close it was. There is no announcement. There is a slide, in a deck, in a meeting you are not invited to.'
            : audited
              ? 'External counsel is in the building. Somebody has asked for "all correspondence". Nobody is going home.'
              : 'Two resignations this morning and a "have you got five minutes?" from your director. The backlog does not care.'}
        </p>
        <p className="teaches">
          Resolved {state.stats.resolved} · breached {state.stats.breached} · deflected {state.stats.deflected} ·
          escalations {state.stats.escalations} · final SLA {Math.round(state.stats.slaCompliance * 100)}%
        </p>
        <button className="chunky" onClick={() => location.reload()}>
          CLOCK OUT
        </button>
      </div>
    </div>
  )
}
