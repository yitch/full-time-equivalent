import {
  CONTRIBUTIONS,
  HEADCOUNT_COST,
  PALETTE,
  ROLES,
  TICK_HZ,
  TOWERS,
  TOWER_IDS,
  effectiveHeadcount,
  headcountFree,
  headcountUsed,
  pathToTech,
} from '@fte/shared'
import type { GameState, PlayerId, TechId, TowerTypeId } from '@fte/shared'
import { Icon } from './Icon.js'

const CHANNEL_COLOUR: Record<string, string> = {
  automation: PALETTE.screenGlow,
  process: PALETTE.deckBlue,
  human: PALETTE.skin,
  specialist: PALETTE.ashMauve,
}

/** The ability's slot letter is not always the key you press: W is movement. */
const KEY_LABEL: Record<string, string> = { Q: 'Q', W: 'F', E: 'E', R: 'R' }

const CONTRIBUTION_COLOUR: Record<string, string> = {
  social: PALETTE.social,
  morale: PALETTE.morale,
  sla: PALETTE.tubeGlow,
  budget: PALETTE.budget,
  compliance: PALETTE.compliance,
}

/** Full "what am I buying" text for a tower, used as the hover tooltip. */
function towerTooltip(id: TowerTypeId): string {
  const def = TOWERS[id]!
  const lines = [
    def.name,
    '',
    def.flavour,
    '',
    `${def.channel.toUpperCase()} damage · ${def.damage} per shot · ${def.fireRate}/sec · ${def.range} tile range`,
    `Costs ${def.cost} Budget and ${HEADCOUNT_COST[def.channel]} FTE to own`,
    '',
    'CONTRIBUTES TO:',
    ...def.contributes.map((c) => `  • ${CONTRIBUTIONS[c].label} — ${CONTRIBUTIONS[c].blurb}`),
  ]
  return lines.join('\n')
}

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
  onOpenTech: (focus?: TechId) => void
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
  const locked = TOWER_IDS.filter((id) => {
    const def = TOWERS[id]
    return def?.requires && !state.unlocked.includes(def.requires)
  })

  return (
    <footer className="bottombar">
      <div>
        <div className="build-strip">
          {available.map((id, index) => {
            const def = TOWERS[id]!
            const fte = HEADCOUNT_COST[def.channel]
            const poor = state.budget < def.cost
            const noStaff = headcountFree(state) < fte
            const why = poor
              ? `Not enough Budget — needs ${def.cost}`
              : noStaff
                ? `No headcount free — needs ${fte} FTE`
                : null
            return (
              <button
                key={id}
                className={`build-card${selected === id ? ' active' : ''}`}
                disabled={!!why}
                title={why ? `${towerTooltip(id)}\n\nCANNOT BUILD: ${why}` : towerTooltip(id)}
                onClick={() => onSelect(selected === id ? null : id)}
              >
                <span className="ch" title={`${def.channel} damage`}>
                  <Icon name={def.channel} size={8} colour={CHANNEL_COLOUR[def.channel]} />
                </span>
                <div className="n pixel">{index + 1}</div>
                <div className="nm">{def.name}</div>
                <div className="gives">
                  {def.contributes.map((c) => (
                    <Icon
                      key={c}
                      name={CONTRIBUTIONS[c].icon}
                      size={9}
                      colour={CONTRIBUTION_COLOUR[CONTRIBUTIONS[c].resource] ?? PALETTE.paper}
                      title={`${CONTRIBUTIONS[c].label} — ${CONTRIBUTIONS[c].blurb}`}
                    />
                  ))}
                  <span className="gl">{CONTRIBUTIONS[def.contributes[0]!].label}</span>
                </div>
                <div className="cost">
                  <span className="b">
                    <Icon name="budget" size={8} colour={PALETTE.budget} /> {def.cost}
                  </span>
                  <span className="f">
                    <Icon name="headcount" size={8} colour={PALETTE.paperShadow} /> {fte}
                  </span>
                </div>
                {why && <span className="blocked">{poor ? 'no budget' : 'no headcount'}</span>}
              </button>
            )
          })}

          {locked.map((id) => {
            const def = TOWERS[id]!
            const path = pathToTech(def.requires!, state.unlocked)
            const chain = path.nodes.map((n) => n.name).join(' → ')
            const affordable = state.socialCapital >= path.cost
            return (
              <button
                key={id}
                className="build-card locked"
                title={`${towerTooltip(id)}\n\nLOCKED.\nResearch: ${chain}\nTotal ${path.cost} Social Capital (you have ${Math.floor(state.socialCapital)}).\n\nClick to open the Steering Committee at this node.`}
                onClick={() => onOpenTech(def.requires)}
              >
                <span className="ch">
                  <Icon name="lock" size={8} colour={PALETTE.paperShadow} />
                </span>
                <div className="n pixel">
                  <Icon name="lock" size={8} />
                </div>
                <div className="nm">{def.name}</div>
                <div className="gives">
                  {def.contributes.map((c) => (
                    <Icon key={c} name={CONTRIBUTIONS[c].icon} size={9} colour={PALETTE.paperShadow} />
                  ))}
                  <span className="gl">{CONTRIBUTIONS[def.contributes[0]!].label}</span>
                </div>
                <div className="unlock">
                  <span className="chain">{path.nodes.map((n) => n.name).join(' → ')}</span>
                  <span className={`price${affordable ? ' can' : ''}`}>
                    <Icon name="social" size={8} colour={affordable ? PALETTE.social : PALETTE.paperShadow} />{' '}
                    {path.cost}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="strip-foot">
          <button
            className={`hc-chip${headcountFree(state) <= 0 ? ' urgent' : ''}`}
            onClick={onOpenHeadcount}
            title={
              headcountFree(state) <= 0
                ? 'No free headcount. Click for the three ways to get more: hire a contractor now, close a process, or raise a requisition.'
                : 'The establishment (H)'
            }
          >
            <Icon name="headcount" size={9} colour={PALETTE.paper} /> {headcountUsed(state)}/
            {effectiveHeadcount(state)} FTE
            {headcountFree(state) <= 0 ? (
              <b> · FULL — GET MORE</b>
            ) : (
              <span className="free"> · {headcountFree(state)} free</span>
            )}
            {state.headcount.contractors > 0 && <u> · {state.headcount.contractors} contractor</u>}
            {state.headcount.requisitions.length > 0 && (
              <em> · {state.headcount.requisitions.length} req in the pipeline</em>
            )}
            {state.headcount.exits.length > 0 && <i> · {state.headcount.exits.length} leaving</i>}
          </button>
          <button className="hc-chip" onClick={() => onOpenTech()} title="Research (Tab)">
            <Icon name="social" size={9} colour={PALETTE.social} /> {locked.length} locked
          </button>
          <span>right-click to cancel a placement, or for the headcount menu</span>
        </div>
      </div>

      <div className="side-actions">
        {role && me && (
          <div className="hero-strip">
            <button
              className={`lv${me.hero.talentPoints > 0 ? ' pending' : ''}`}
              onClick={onOpenSheet}
              title="Character sheet (C)"
            >
              LVL {me.hero.level}
              {me.hero.talentPoints > 0 ? ` · ${me.hero.talentPoints} pt` : ''}
            </button>
            <div className={`bw${me.hero.bandwidth / Math.max(1, me.hero.maxBandwidth) < 0.25 ? ' low' : ''}`}>
              <div className="lab">
                <Icon name="automation" size={8} colour="var(--tube-glow)" />
                BANDWIDTH {Math.round(me.hero.bandwidth)}
              </div>
              <div className="track">
                <div
                  className="fill"
                  style={{
                    width: `${Math.max(0, (me.hero.bandwidth / Math.max(1, me.hero.maxBandwidth)) * 100)}%`,
                  }}
                />
              </div>
              <div className="hint">{me.hero.recharging ? 'recharging…' : ''}</div>
            </div>
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
              <span style={{ fontSize: 8, color: 'var(--tube-glow)' }}>{me.hero.bag.length} in bag</span>
            )}
          </div>
        )}

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

        <div style={{ display: 'flex', gap: 6 }}>
          <button className="chunky ghost" onClick={() => onOpenTech()}>
            RESEARCH (TAB)
          </button>
          <button className="chunky" disabled={!canStart} onClick={onStartWave}>
            {state.phase === 'steering' ? 'NEXT WAVE' : 'START NOW'}
          </button>
        </div>
      </div>
    </footer>
  )
}
