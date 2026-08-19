import {
  HEADCOUNT_COST,
  PALETTE,
  ROLES,
  TICK_HZ,
  TOWERS,
  TOWER_IDS,
  effectiveHeadcount,
  getTech,
  headcountFree,
  headcountUsed,
} from '@fte/shared'
import type { GameState, PlayerId, TowerTypeId } from '@fte/shared'

const CHANNEL_COLOUR: Record<string, string> = {
  automation: PALETTE.screenGlow,
  process: PALETTE.deckBlue,
  human: PALETTE.skin,
  specialist: PALETTE.ashMauve,
}

/** The ability's slot letter is not always the key you press: W is movement. */
const KEY_LABEL: Record<string, string> = { Q: 'Q', W: 'F', E: 'E', R: 'R' }

export function BottomBar({
  state,
  localPlayerId,
  selected,
  onSelect,
  onOpenTech,
  onOpenSheet,
  onOpenHeadcount,
  onStartWave,
}: {
  state: GameState
  localPlayerId: PlayerId | null
  selected: TowerTypeId | null
  onSelect: (id: TowerTypeId | null) => void
  onOpenTech: () => void
  onOpenSheet: () => void
  onOpenHeadcount: () => void
  onStartWave: () => void
}) {
  const me = localPlayerId ? state.players[localPlayerId] : null
  const role = me?.role ? ROLES[me.role] : null
  const canStart = state.phase === 'briefing' || state.phase === 'steering'

  const available = TOWER_IDS.filter((id) => {
    const def = TOWERS[id]
    return !def?.requires || state.unlocked.includes(def.requires)
  })

  return (
    <footer className="bottombar">
      <div>
        <div className="build-strip">
          {available.map((id, index) => {
            const def = TOWERS[id]
            if (!def) return null
            const affordable = state.budget >= def.cost
            const full = headcountFree(state) < HEADCOUNT_COST[def.channel]
            return (
              <button
                key={id}
                className={`build-card${selected === id ? ' active' : ''}`}
                disabled={!affordable || full}
                title={`${def.flavour}\n\n${def.channel.toUpperCase()} · ${def.damage} dmg · ${def.range} tiles · ${HEADCOUNT_COST[def.channel]} FTE to own`}
                onClick={() => onSelect(selected === id ? null : id)}
              >
                <span className="ch" style={{ background: CHANNEL_COLOUR[def.channel] }} />
                <div className="n pixel">{index + 1}</div>
                <div className="nm">{def.name}</div>
                <div className="cost">
                  ${def.cost} <span className="fte">{HEADCOUNT_COST[def.channel]} FTE</span>
                </div>
              </button>
            )
          })}

          {TOWER_IDS.filter((id) => {
            const def = TOWERS[id]
            return def?.requires && !state.unlocked.includes(def.requires)
          })
            .slice(0, 3)
            .map((id) => {
              const def = TOWERS[id]!
              return (
                <button key={id} className="build-card" disabled title={def.flavour}>
                  <div className="n pixel">🔒</div>
                  <div className="nm">{def.name}</div>
                  <div className="cost" style={{ color: 'var(--paper-dim)' }}>
                    needs {getTech(def.requires!).name}
                  </div>
                </button>
              )
            })}
        </div>

        <div style={{ marginTop: 6, fontSize: 9, color: 'var(--paper-dim)' }}>
          <button className="hc-chip" onClick={onOpenHeadcount} title="The establishment (H)">
            HEADCOUNT {headcountUsed(state)}/{effectiveHeadcount(state)} FTE
            {headcountFree(state) <= 0 && <b> · FULL</b>}
            {state.headcount.requisitions.length > 0 && (
              <em> · {state.headcount.requisitions.length} req pending</em>
            )}
            {state.headcount.exits.length > 0 && <i> · {state.headcount.exits.length} leaving</i>}
          </button>{' '}
          · right-click to cancel a placement
        </div>
      </div>

      <div className="side-actions">
        {role && me && (
          <div className="abilities">
            {role.abilities.map((ability) => {
              const slot = me.abilities.find((a) => a.id === ability.id)
              const cooldown = slot ? Math.ceil(slot.cooldown / TICK_HZ) : 0
              const channelling = slot ? Math.ceil(slot.channelling / TICK_HZ) : 0
              return (
                <div
                  key={ability.id}
                  className={`ability${slot?.disabled ? ' disabled' : ''}`}
                  title={`${ability.name} — ${ability.flavour}`}
                >
                  <div className="k">{KEY_LABEL[ability.key] ?? ability.key}</div>
                  <div className="n">{ability.name}</div>
                  {slot?.disabled && <div className="cd">IN A MEETING</div>}
                  {!slot?.disabled && channelling > 0 && <div className="cd">{channelling}</div>}
                  {!slot?.disabled && channelling === 0 && cooldown > 0 && <div className="cd">{cooldown}</div>}
                </div>
              )
            })}
          </div>
        )}

        {me && role && (
          <div className="hero-strip">
            <button
              className={`lv${me.hero.talentPoints > 0 ? ' pending' : ''}`}
              onClick={onOpenSheet}
              title="Character sheet (C)"
            >
              LVL {me.hero.level}
              {me.hero.talentPoints > 0 ? ` · ${me.hero.talentPoints} pt` : ''}
            </button>
            <div className="hp">
              <div style={{ fontSize: 8, color: 'var(--paper-dim)' }}>
                {Math.round(me.hero.hp)}/{Math.round(me.hero.maxHp)}
                {me.hero.downedTicks > 0 ? ' · SIGNED OFF' : ''}
              </div>
              <div className="track">
                <div
                  className="fill"
                  style={{
                    width: `${Math.max(0, (me.hero.hp / Math.max(1, me.hero.maxHp)) * 100)}%`,
                    background:
                      me.hero.hp / me.hero.maxHp > 0.5
                        ? 'var(--tube-glow)'
                        : me.hero.hp / me.hero.maxHp > 0.25
                          ? 'var(--social)'
                          : 'var(--escalate)',
                  }}
                />
              </div>
            </div>
            {me.hero.bag.length > 0 && (
              <span style={{ fontSize: 8, color: 'var(--screen-glow, #8fd0c8)' }}>
                {me.hero.bag.length} in bag
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6 }}>
          <button className="chunky ghost" onClick={onOpenTech}>
            STEERING CTTE (TAB)
          </button>
          <button className="chunky" disabled={!canStart} onClick={onStartWave}>
            {state.phase === 'steering' ? 'NEXT WAVE' : 'START NOW'}
          </button>
        </div>
      </div>
    </footer>
  )
}
