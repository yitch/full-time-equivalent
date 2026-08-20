import { PALETTE, TICK_HZ, WAVES, themeFor } from '@fte/shared'
import type { GameState } from '@fte/shared'
import { Icon } from './Icon.js'

/** What each number on the scoreboard actually means, in one sentence. */
export const RESOURCE_INFO = {
  morale: {
    icon: 'morale',
    label: 'MORALE',
    colour: PALETTE.morale,
    what: 'Your team. Drained by anything that reaches the CHRO door. At zero the team resigns and the run ends.',
  },
  compliance: {
    icon: 'compliance',
    label: 'COMPLIANCE',
    colour: PALETTE.compliance,
    what: 'A separate way to lose. Only Employee Relations cases drain it, and no tower can see them. At zero you are audited.',
  },
  budget: {
    icon: 'budget',
    label: 'BUDGET',
    colour: PALETTE.budget,
    what: 'Money. Builds and upgrades defences, and pays salary every wave for every approved head.',
  },
  social: {
    icon: 'social',
    label: 'SOCIAL CAPITAL',
    colour: PALETTE.social,
    what: 'Credibility. Earned only by resolving things WELL — in SLA, first contact, deflected at Tier 0. Buys the tech tree and headcount.',
  },
  sla: {
    icon: 'sla',
    label: 'SLA',
    colour: PALETTE.tubeGlow,
    what: 'Share of work resolved rather than breached. Below 72% the CFO refuses new headcount.',
  },
} as const

export type ResourceKey = keyof typeof RESOURCE_INFO

function Meter({
  resource,
  value,
  max,
  suffix = '',
}: {
  resource: ResourceKey
  value: number
  max?: number
  suffix?: string
}) {
  const info = RESOURCE_INFO[resource]
  return (
    <div className="meter" title={`${info.label} — ${info.what}`}>
      <div className="label pixel">
        <Icon name={info.icon} size={9} colour={info.colour} />
        <span>{info.label}</span>
      </div>
      <div className="value" style={{ color: info.colour }}>
        {Math.round(value)}
        {suffix}
      </div>
      {max !== undefined && (
        <div className="track">
          <div
            className="fill"
            style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: info.colour }}
          />
        </div>
      )}
    </div>
  )
}

export function TopBar({ state }: { state: GameState }) {
  const wave = WAVES[state.waveIndex]
  const seconds = state.phaseTicks > 0 ? Math.ceil(state.phaseTicks / TICK_HZ) : null
  const sla = Math.round(state.stats.slaCompliance * 100)
  const { theme } = themeFor(state.waveIndex)

  return (
    <header className="topbar">
      <div className="brand pixel">
        FULL-TIME EQUIVALENT
        <small>{theme.department}</small>
      </div>

      <div className="meters">
        <Meter resource="morale" value={state.morale} max={100} />
        <Meter resource="compliance" value={state.compliance} max={100} />
        <Meter resource="budget" value={state.budget} />
        <Meter resource="social" value={state.socialCapital} />
        <Meter resource="sla" value={sla} max={100} suffix="%" />
      </div>

      <div className="wave-chip pixel" title={theme.motto}>
        <Icon name="wave" size={9} colour={PALETTE.highlighter} /> WAVE <b>{(wave?.index ?? 0) + 1}</b>/
        {WAVES.length}
        <br />
        {wave?.name ?? '—'}
        {seconds !== null && ` · ${seconds}s`}
      </div>
    </header>
  )
}
