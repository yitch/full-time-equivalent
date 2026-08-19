import { PALETTE, TICK_HZ, WAVES } from '@fte/shared'
import type { GameState } from '@fte/shared'

function Meter({
  label,
  value,
  max,
  colour,
  suffix = '',
}: {
  label: string
  value: number
  max?: number
  colour: string
  suffix?: string
}) {
  return (
    <div className="meter">
      <div className="label pixel">{label}</div>
      <div className="value" style={{ color: colour }}>
        {Math.round(value)}
        {suffix}
      </div>
      {max !== undefined && (
        <div className="track">
          <div
            className="fill"
            style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: colour }}
          />
        </div>
      )}
    </div>
  )
}

export function TopBar({ state }: { state: GameState }) {
  const wave = WAVES[state.waveIndex]
  const seconds = state.phaseTicks > 0 ? Math.ceil(state.phaseTicks / TICK_HZ) : null
  const compliance = Math.round(state.stats.slaCompliance * 100)

  return (
    <header className="topbar">
      <div className="brand pixel">
        FULL-TIME EQUIVALENT
        <small>FLOOR 3 — SHARED SERVICES</small>
      </div>

      <div className="meters">
        <Meter label="MORALE" value={state.morale} max={100} colour={PALETTE.morale} />
        <Meter label="COMPLIANCE" value={state.compliance} max={100} colour={PALETTE.compliance} />
        <Meter label="BUDGET" value={state.budget} colour={PALETTE.budget} />
        <Meter label="SOCIAL CAPITAL" value={state.socialCapital} colour={PALETTE.social} />
        <Meter label="SLA" value={compliance} max={100} colour={PALETTE.tubeGlow} suffix="%" />
      </div>

      <div className="wave-chip pixel">
        WAVE <b>{(wave?.index ?? 0) + 1}</b>/{WAVES.length}
        <br />
        {wave?.name ?? '—'}
        {seconds !== null && ` · ${seconds}s`}
      </div>
    </header>
  )
}
