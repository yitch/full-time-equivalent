# FULL-TIME EQUIVALENT — Design Bible
*a people operations tower defence*

**Status:** approved 2026-08-19 · **Slice:** Floor 3 — Shared Services

---

## 0. Thesis

> 51% of HR working hours are spent on administrative tasks that could be automated.
> 94% of HR managers feel overwhelmed. 97% report emotional fatigue.
> Open enrollment spikes ticket volume 5–10× for a few weeks.
> A strong Tier 0 reduces ticket volume. Failures come back as escalations.

The industry wrote the tower defence. We just have to render it.

**You do not place people. You place processes.** Every tower is a piece of HR
infrastructure — a knowledge base article, an approval workflow, a ticketing
system, a chatbot named Ava that nobody trusts. The players are the humans, and
the humans are the bottleneck. The entire arc of a run is automating yourself
out of the 51% before the 51% eats you.

**The joke has to be load-bearing.** A gag that isn't also a mechanic gets cut.
"Ava the Chatbot occasionally misroutes a ticket and *heals* it" is funny AND is
a real risk/reward tower. "HRBP loses a random ability each wave because someone
booked them into a meeting" is funny AND is the class's defining constraint.
That is the bar.

---

## 1. Board

Top-down ¾ office floor. **16×16 px tiles** (true Stardew scale), logical canvas
**640×384** (40×24 tiles), displayed at integer scale 2–3× with nearest-neighbour.

Three lanes enter from the left and converge on a single door on the right:

| Lane | Name | Flavour |
|---|---|---|
| 0 | **Payroll & Systems** | top route, past the printer that has been "being fixed" since March |
| 1 | **Employee Services** | middle route, straight through the open plan |
| 2 | **Talent & Mobility** | bottom route, past the wellness room nobody has ever booked |

They converge at **THE ESCALATION** — a door labelled `CHRO`. Anything reaching
it drains Morale.

Towers are placed on non-path floor tiles. Desks, plants, the broken printer and
the ping-pong table nobody uses are obstacles.

---

## 2. Resources

| Resource | Source | Sink |
|---|---|---|
| 💛 **Social Capital** | Resolution *quality* only — within-SLA resolves, first-contact resolves, Tier-0 deflections. **Never** raw volume. | The tech tree. You cannot buy a ticketing system with money. You buy it with credibility. |
| 💵 **Budget** | Per-wave trickle + fiscal-year spike | Building and upgrading towers |
| ❤️ **Morale** | Starts 100 | Drained by anything reaching the CHRO door. 0 = your team resigns. Run over. |
| ⚖️ **Compliance** | Starts 100 | Drained *only* by ignored Employee Relations cases and certain elites. 0 = **Audit**. Instant loss, separate fail state, cannot be tanked. |

### The Steering Committee
Between waves the game enters a `steering` phase. You spend Social Capital in
front of a pixel CFO holding a coffee cup. If you're short, he says
*"Let's revisit this next quarter."* and the node stays locked.

**Design rule:** Social Capital income scales with how *well* you play, not how
long you survive. A player who brute-forces with human towers survives waves but
never unlocks tech, and dies at Open Enrollment. This is the intended lesson.

---

## 3. Requests (enemies)

Damage is dealt through **channels**. Every request has a resistance multiplier
per channel. This replaces "armour types".

| Channel | Sources |
|---|---|
| `automation` | Tier-0 towers, chatbot, RPA, portals |
| `process` | Ticketing, workflows, routing, policy |
| `human` | Player abilities, staffed desks |
| `specialist` | Role-locked damage (Payroll, Travel & Claims, ER) |

### Roster

| Request | Res: auto / process / human / spec | Behaviour |
|---|---|---|
| **Leave Balance Query** | 1.0 / 1.0 / 1.0 / 1.0 | Trivial, swarms in 20–40. Dies to anything. If you have no Tier 0, the swarm alone ends runs. |
| **Policy Question** | **0.15** / 1.0 / 1.0 / 1.0 | Immune-ish to bots. Needs a human or a rewritten policy. Killing it *permanently* is a tech upgrade, not a shot. |
| **Payroll Discrepancy** | 0.4 / 0.7 / 0.6 / **2.0 (Payroll)** | Fast, heavy morale damage, carries a **cutoff clock**. If the clock expires it doesn't breach — it **splits into two**. |
| **Expense Claim** | **0.0** / 0.3 / 0.2 / **2.5 (Travel & Claims)** | Slow, armoured, **splits into sub-claims on damage** (receipts). Immune to all automation. |
| **Employee Relations Case** | **0.0** / **0.0** / 0.5 / **3.0 (ER)** | **Stealth** — invisible to every tower. Only a player with `seesStealth` can reveal it. Drains Compliance, not Morale. Grows each wave ignored. |
| **Onboarding Packet** | 0.6 / 1.2 / 1.0 / 1.0 | Chunky, slow, spawns in clusters. Spawned *by your own* Talent Acquisition player. |
| **Benefits Enrollment** | 0.8 / 1.0 / 0.9 / 1.0 | The open-enrollment staple. Harmless alone, arrives in the hundreds. |

### Escalation (transformation, not a spawn)
Every request carries an **SLA timer**. When it expires the request does not die
and does not breach — it becomes **ESCALATED**: red aura, ×1.9 speed, ×2.2 morale
damage, and it now ignores lane geometry and beelines for the CHRO door.

*Your failures come back as a stronger enemy.* That is the whole job.

### Named elites (from the forums, verbatim energy)
- **Batman** — refuses to write his real name on the I-9. Immune to `process`
  (the ticketing system has no field for this). Claims he legally changed it. He did not.
- **The Cat-Sitter Claim** — an Expense Claim that splits into *three*.
- **Lost In The Beauty Of The Day** — a tardiness appeal that argues theologically.
  Heals when hit by `automation`.
- **The Mustang** — "rental denied, uses more gas than a compact." Reflects damage.
- **Facebook Friend Parity Complaint** — demands your coworker friend everyone
  or no one. Links itself to a nearby request; damage is shared.
- **Emotional Support Squirrel** — an accommodation request. Stealth. Fast. Erratic pathing.

---

## 4. Towers (processes & technology)

| Tower | Ch. | Cost | Gag that is also a mechanic |
|---|---|---|---|
| **Intranet Page Nobody Reads** | auto | 25 | Damage **1**. Enormous range. It is technically a defence. Free starter. |
| **FAQ Article** | auto | 60 | Solid Tier-0 chip vs trivial swarm. |
| **Employee Self-Service Portal** | auto | 140 | Deletes Leave Balance Queries outright. Does nothing to anything else. |
| **Ava (Chatbot)** | auto | 120 | Fast, **random** target. 8% of shots *misroute* and heal the target. |
| **Ticketing System** | process | 200 | Applies `TRACKED`: −25% speed, +30% damage taken from all sources. **The keystone.** |
| **Approval Workflow** | process | 160 | Radius stun — things sit in someone's queue. Cannot kill. |
| **Auto-Triage & Routing** | process | 240 | Pushes requests sideways into the lane whose specialist can actually hit them. |
| **RPA Bot** | auto | 300 | Highest automation DPS. **Fully disabled during the Maintenance Window.** |
| **Finance Integration** | process | 280 | The only *tower* that can chip Expense Claims. Weakly. |
| **Manager Enablement** | process | 220 | Reduces spawn count at the source. Prevention, not cure — invisible and unglamorous, like the real thing. |
| **Policy Rewrite (Plain English)** | process | 260 | Deletes a % of Policy Questions **at spawn**, before they exist. |

Every tower has 2 upgrade levels costing Budget **and** Social Capital.

---

## 5. Tech tree (Social Capital)

Four branches. Nodes unlock towers, upgrade tiers, and passives.

```
TIER 0 (Deflection)     Intranet → FAQ → Knowledge Base → Self-Service → Ava → AI Agent
TIER 1 (Case Mgmt)      Shared Inbox → Ticketing System → Case Management → Auto-Triage
INTEGRATION             SSO → HRIS↔Finance → Master Data → RPA
CULTURE                 Town Hall → Manager Enablement → Plain-English Policy → "Just Say No"
```

Passives worth calling out:
- **Knowledge Base** — +1 Social Capital per Tier-0 deflection.
- **Case Management** — Escalated requests can be *de-escalated* back to normal.
- **Master Data** — removes the 10% chance any given resolve is voided by a data error.
- **"Just Say No"** — 5% of all incoming requests never spawn. The single most
  powerful node in the game. Requires the most Social Capital. It is, correctly,
  the hardest thing in HR to get permission to do.

---

## 6. Roles (co-op classes)

1–5 players. Each picks a role; duplicates allowed but the second one gets a
`-20%` "unclear ownership" penalty, which is both a balance lever and a joke.

### 1. HR Business Partner
- **Passive — Pulled Into Non-Strategic Work:** at the start of each wave one
  random ability is disabled. A calendar icon floats over their head.
- **Q — Stakeholder Alignment:** +25% damage to all towers in a radius, 8s.
- **W — Difficult Conversation:** high single-target `human` damage.
- **R — Executive Buy-In:** +40 Social Capital, instantly. 180s cooldown.

### 2. Payroll
- **Passive — The Cutoff Is The Cutoff:** ×2.0 `specialist` damage vs Payroll
  Discrepancies. Cannot be talked out of it.
- **Q — Off-Cycle Run:** deletes one Payroll Discrepancy outright. Costs Budget.
- **W — Reconciliation:** slows everything in lane 0.
- **R — Gross-to-Net:** clears every Payroll request on the board. Drains Budget hard.
- Locked to lane 0 movement bonus; sluggish elsewhere.

### 3. Talent Acquisition
- **Passive — Headcount:** every 30s, unlocks a free tower slot **and spawns an
  Onboarding Packet.** Perfectly, tragically self-defeating.
- **Q — Pipeline:** summons a temporary Intern unit that fights for 20s then leaves.
- **W — Ghosting:** despawns one request. It'll be back next wave.
- **R — Sign The Req:** +2 permanent tower slots, +6 Onboarding Packets. Use it wrong and you die.

### 4. Total Rewards
- **Passive — Benchmarked:** deals bonus damage proportional to how long they've
  stood still. Spreadsheets require stillness.
- **Q — Market Adjustment:** cone damage.
- **W — Bonus Accrual:** stores damage for later.
- **R — RUN THE COMP CYCLE:** 60-second channel. Devastating board-wide nuke.
  **Interrupted if they take damage or move.** They will be interrupted.

### 5. HRIS / People Systems
- **Passive — Admin Rights:** all `automation` towers +20%.
- **Q — Hotfix:** instantly repairs/reactivates a tower.
- **W — Data Load:** reveals stealth in a radius for 6s.
- **R — Go-Live:** all towers fire at 3× for 15s, then a **Maintenance Window**
  disables every automation tower for 8s. Timing this is the entire skill of the class.

### 6. Travel & Claims 🎒 *(the one nobody picks)*
- **Passive — Nobody Knows Your Name:** requests do not target them. Also, no
  other player's buffs apply to them. Nobody has ever put them on a distro list.
- **Passive — Sole Custody:** ×2.5 `specialist` damage vs Expense Claims, which
  are immune to `automation` entirely. **You are the only counter in the game.**
- **Q — Receipt Required:** stops an Expense Claim from splitting.
- **W — Mileage:** chip damage along a line.
- **R — PER DIEM:** flat, unblockable, resistance-ignoring damage to everything
  on screen. Scales with the number of Expense Claims currently alive.

**Balance intent:** Travel & Claims has the worst numbers on the sheet for waves
1–5 and is the reason the lobby survives waves 9+. The joke lands only if it's true.

---

## 7. Waves

8 waves + boss in the slice. Full game: 20 + 5 bosses.

| # | Name | Teaches |
|---|---|---|
| 1 | *Monday* | Trivial swarm. Tier 0 exists. |
| 2 | *"Quick Question"* | Policy Questions ignore your bot. |
| 3 | *Payday Minus Two* | Cutoff clocks. Splitting. |
| 4 | *The Receipts* | Expense Claims. Automation does literally nothing. |
| 5 | *Something Happened At The Offsite* | First ER case. Stealth. Compliance bar moves for the first time. |
| 6 | *Reorg Rumours* | Mixed lanes, first Escalations. |
| 7 | *Batman* | Named elite. Process-immune. |
| 8 | *Systems Maintenance* | Automation disabled mid-wave. Human/specialist only. |
| **BOSS** | **OPEN ENROLLMENT** | 5–10× volume, as documented. Everything at once. Survive 3 minutes. |

Later bosses (designed, not in slice): **Annual Merit Cycle**, **Restructuring**,
**The Engagement Survey** (damage scales inversely with your run's SLA compliance —
the survey is literally about how badly you've been doing), **Return-To-Office
Mandate** (spawns from *every* edge simultaneously).

---

## 8. Art direction — "Fluorescent Rot"

Stardew's chunky 16px warmth, with the lights wrong.

| Token | Hex | Note |
|---|---|---|
| `void` | `#14121c` | letterbox |
| `carpetDark` | `#2e2438` | carpet tile, dark weave |
| `carpet` | `#3d3049` | carpet tile |
| `wall` | `#4a4258` | partition |
| `tubeGreen` | `#7f9c6a` | the fluorescent tube's actual colour |
| `tubeGlow` | `#a8c47f` | sickly highlight |
| `ashMauve` | `#8d6f86` | upholstery |
| `lanyardTeal` | `#4f8f8b` | expired lanyard |
| `deckBlue` | `#5a7fa8` | corporate template blue |
| `manila` | `#c8a96b` | folders, paper |
| `paper` | `#e6dfc8` | not white. never white. |
| `highlighter` | `#e8e34a` | **danger only** |
| `escalate` | `#c1483f` | escalation red |
| `compliance` | `#a05fc0` | compliance purple |

Rules: cozy pixel *shapes*, queasy pixel *colours*. Never pure white, never pure
black, never saturated green (that reads "healthy" and nothing here is healthy).
Highlighter yellow is reserved exclusively for things about to hurt you.

**All sprites are drawn procedurally in code** from `{palette, pixelmap}` data.
Zero binary assets. Fully diffable. The whole mood is one swappable file.

---

## 9. Architecture

```
packages/shared/   pure TS. sim + content. no DOM, no Node APIs. deterministic, seeded RNG.
packages/server/   authoritative loop @20Hz, snapshots @10Hz, room codes, 1–5 players.
packages/client/   React shell (HUD, tech tree, roster) + PixiJS canvas (the floor).
```

**The contract:** `step(state, intents, dt) → state` is pure. The server is the
only writer. Clients send *intents* (`move`, `build`, `ability`, `unlock`), never
state. The sim runs headless in Vitest — **we can prove the game works without a
browser.**

Content lives in flat data files under `packages/shared/src/content/`. Adding ten
new request types requires reading zero lines of engine code. This is deliberate:
this repo is meant to be worked on by Claude Code, Codex and Kimi on different
days, and content work must never require holding the engine in context.

---

## 10. Out of scope for the slice

Persistence, accounts, matchmaking beyond room codes, mobile, audio, the four
non-Open-Enrollment bosses, roles 3/4 ability VFX polish, map 2+.
