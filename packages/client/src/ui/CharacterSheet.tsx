import {
  ARTIFACT_SLOTS,
  PERCENT_STATS,
  RARITY_INFO,
  ROLES,
  STAT_KEYS,
  TALENT_TREES,
  canSpendTalent,
} from '@fte/shared'
import type { Artifact, ArtifactSlot, GameState, PlayerId, StatKey, TalentBranch } from '@fte/shared'

const BRANCH_ORDER: TalentBranch[] = ['lean_in', 'grow_out', 'weaponise']

const STAT_LABEL: Record<StatKey, string> = {
  power: 'Power',
  reach: 'Reach',
  attackSpeed: 'Attack speed',
  maxHp: 'Max HP',
  moveSpeed: 'Move speed',
  cooldown: 'Cooldown reduction',
  armour: 'Armour',
  specialistPower: 'Specialist damage',
  towerDamage: 'Your tower damage',
  towerRange: 'Your tower range',
  socialGain: 'Social Capital gain',
  budgetGain: 'Budget gain',
  xpGain: 'XP gain',
  regen: 'HP per second',
}

function fmt(stat: StatKey, value: number): string {
  if (PERCENT_STATS.has(stat)) return `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`
  return `${Math.round(value * 10) / 10}`
}

function ArtifactCard({
  artifact,
  action,
  onAction,
  onDiscard,
}: {
  artifact: Artifact
  action: string
  onAction: () => void
  onDiscard?: () => void
}) {
  const info = RARITY_INFO[artifact.rarity]
  return (
    <div className="artifact" style={{ borderColor: info.colour }}>
      <div className="an" style={{ color: info.colour }}>
        {artifact.name}
      </div>
      <div className="ar">
        {info.label} · {artifact.slot} · ilvl {artifact.ilvl}
      </div>
      {artifact.affixes.map((a, i) => (
        <div className="aa" key={i}>
          {fmt(a.stat, a.value)} {STAT_LABEL[a.stat]}
        </div>
      ))}
      {artifact.legendary && <div className="al">Bends one rule. Read the tooltip in the field.</div>}
      <div className="ab">
        <button onClick={onAction}>{action}</button>
        {onDiscard && <button onClick={onDiscard}>bin it</button>}
      </div>
    </div>
  )
}

/**
 * Level, talents and gear in one panel. Deliberately one screen: the player is
 * mid-run, and making them navigate tabs to spend a point is how points go
 * unspent.
 */
export function CharacterSheet({
  state,
  localPlayerId,
  onTalent,
  onEquip,
  onUnequip,
  onDiscard,
  onClose,
}: {
  state: GameState
  localPlayerId: PlayerId | null
  onTalent: (node: string) => void
  onEquip: (id: string) => void
  onUnequip: (slot: ArtifactSlot) => void
  onDiscard: (id: string) => void
  onClose: () => void
}) {
  const player = localPlayerId ? state.players[localPlayerId] : null
  if (!player?.role) return null
  const role = ROLES[player.role]!
  const hero = player.hero
  const tree = TALENT_TREES[player.role]!
  const xpPct = Math.min(100, (hero.xp / Math.max(1, hero.xpToNext)) * 100)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h1 style={{ color: role.colour, marginBottom: 2 }}>{role.name}</h1>
            <div className="expansion">{role.expansion}</div>
            <div className="passive">
              <b>{role.passiveName}</b> — {role.passiveText}
            </div>
          </div>
          <div className="lvl">
            <div className="n pixel">LVL {hero.level}</div>
            <div className="xptrack">
              <div className="xpfill" style={{ width: `${xpPct}%` }} />
            </div>
            <div className="xpn">
              {Math.round(hero.xp)} / {Math.round(hero.xpToNext)} XP
            </div>
            <div className="pts" style={{ color: hero.talentPoints > 0 ? 'var(--social)' : 'var(--paper-dim)' }}>
              {hero.talentPoints} talent point{hero.talentPoints === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="sheet-grid">
          <section>
            <h2>TALENTS</h2>
            <div className="branches">
              {BRANCH_ORDER.map((branch) => {
                const meta = tree.branches[branch]
                const spent = tree.nodes
                  .filter((n) => n.branch === branch)
                  .reduce((sum, n) => sum + (hero.talents[n.id] ?? 0), 0)
                return (
                  <div className="tbranch" key={branch}>
                    <h3>
                      {meta.name} <span>{spent}</span>
                    </h3>
                    <p className="bf">{meta.flavour}</p>
                    {tree.nodes
                      .filter((n) => n.branch === branch)
                      .sort((a, b) => a.tier - b.tier)
                      .map((node) => {
                        const ranks = hero.talents[node.id] ?? 0
                        const check = canSpendTalent(hero, player.role!, node.id)
                        return (
                          <button
                            key={node.id}
                            className={`tnode${ranks > 0 ? ' taken' : ''}${check.ok ? ' can' : ''}`}
                            disabled={!check.ok}
                            title={check.reason ?? 'Spend a point.'}
                            onClick={() => onTalent(node.id)}
                          >
                            <div className="tn">
                              {node.name}
                              <span className="rk">
                                {ranks}/{node.maxRank}
                              </span>
                            </div>
                            <div className="tf">{node.flavour}</div>
                          </button>
                        )
                      })}
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <h2>STATS</h2>
            <div className="stats">
              {STAT_KEYS.filter((k) => hero.stats[k] !== 0).map((k) => (
                <div className="srow" key={k}>
                  <span>{STAT_LABEL[k]}</span>
                  <b>{fmt(k, hero.stats[k])}</b>
                </div>
              ))}
            </div>

            <h2 style={{ marginTop: 14 }}>EQUIPPED</h2>
            {ARTIFACT_SLOTS.map((slot) => {
              const item = hero.equipment[slot]
              return item ? (
                <ArtifactCard
                  key={slot}
                  artifact={item}
                  action="take off"
                  onAction={() => onUnequip(slot)}
                />
              ) : (
                <div className="artifact empty" key={slot}>
                  <div className="ar">{slot} — empty</div>
                </div>
              )
            })}

            <h2 style={{ marginTop: 14 }}>BAG ({hero.bag.length})</h2>
            {hero.bag.length === 0 && <p className="teaches">Nothing yet. Elites and Stakeholders drop.</p>}
            {hero.bag.map((item) => (
              <ArtifactCard
                key={item.id}
                artifact={item}
                action="equip"
                onAction={() => onEquip(item.id)}
                onDiscard={() => onDiscard(item.id)}
              />
            ))}
          </section>
        </div>

        <button className="chunky ghost" onClick={onClose}>
          CLOSE (C)
        </button>
      </div>
    </div>
  )
}
