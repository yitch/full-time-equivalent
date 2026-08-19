import {
  BOARD_H,
  BOARD_W,
  CHRO_DOOR,
  GRID_H,
  GRID_W,
  LANES,
  PALETTE,
  PROPS,
  ROLES,
  TILE,
  getRequest,
  getTower,
  isBuildable,
} from '@fte/shared'
import type { GameState, PlayerId, Vec2 } from '@fte/shared'
import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import {
  PROP_LOOK,
  REQUEST_LOOK,
  TOWER_LOOK,
  getSprite,
  makeCarpetTexture,
  makeLaneTexture,
} from './sprites.js'

interface FloatingText {
  text: Text
  life: number
  vy: number
}

interface Interp {
  x: number
  y: number
}

export interface StageInput {
  /** Tower the player is currently placing, if any. */
  buildingTower: string | null
  /** Mouse position in tile coordinates. */
  hoverTile: Vec2 | null
  localPlayerId: PlayerId | null
}

/**
 * The Pixi layer. It owns pixels and nothing else — it reads state and draws it,
 * and never mutates game state or talks to the network. React owns the chrome,
 * this owns the floor.
 */
export class GameStage {
  private app = new Application()
  private world = new Container()
  private layers = {
    floor: new Container(),
    props: new Container(),
    towers: new Container(),
    requests: new Container(),
    players: new Container(),
    fx: new Container(),
    overlay: new Container(),
  }

  private requestSprites = new Map<number, Container>()
  private towerSprites = new Map<number, Container>()
  private playerSprites = new Map<string, Container>()
  private interp = new Map<number, Interp>()
  private floaters: FloatingText[] = []
  private ghost = new Graphics()
  private rangeRing = new Graphics()
  private seenEvents = 0
  private ready = false

  async mount(host: HTMLElement): Promise<void> {
    await this.app.init({
      background: PALETTE.void,
      antialias: false,
      roundPixels: true,
      resolution: 1,
      autoDensity: false,
      width: BOARD_W,
      height: BOARD_H,
    })
    host.appendChild(this.app.canvas)
    this.app.canvas.style.imageRendering = 'pixelated'
    this.app.canvas.style.width = '100%'
    this.app.canvas.style.height = 'auto'
    this.app.canvas.style.display = 'block'

    this.world.addChild(
      this.layers.floor,
      this.layers.props,
      this.layers.towers,
      this.layers.requests,
      this.layers.players,
      this.layers.fx,
      this.layers.overlay,
    )
    this.app.stage.addChild(this.world)
    this.layers.overlay.addChild(this.rangeRing, this.ghost)

    this.drawFloor()
    this.drawProps()
    this.ready = true

    this.app.ticker.add(() => this.animate())
  }

  destroy(): void {
    if (!this.ready) return
    this.app.destroy(true, { children: true })
    this.ready = false
  }

  get canvas(): HTMLCanvasElement | null {
    return this.ready ? (this.app.canvas as HTMLCanvasElement) : null
  }

  // ─────────────────────────────────────────────────────────────── static art

  private drawFloor(): void {
    const carpet = [0, 1, 2].map((v) => makeCarpetTexture(v))
    const lane = makeLaneTexture()

    const laneTiles = new Set<number>()
    for (const l of LANES) {
      for (let i = 0; i < l.points.length - 1; i++) {
        const a = l.points[i]!
        const b = l.points[i + 1]!
        const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y))
        for (let s = 0; s <= steps; s++) {
          const x = Math.round(a.x + ((b.x - a.x) * s) / steps)
          const y = Math.round(a.y + ((b.y - a.y) * s) / steps)
          laneTiles.add(y * GRID_W + x)
        }
      }
    }

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const isLane = laneTiles.has(y * GRID_W + x)
        const texture = isLane ? lane : carpet[(x + y * 2) % 3]!
        const tile = new Sprite(texture)
        tile.x = x * TILE
        tile.y = y * TILE
        this.layers.floor.addChild(tile)
      }
    }

    // The fluorescent tube. It hums. You have stopped hearing it.
    const glow = new Graphics()
    glow.rect(0, 0, BOARD_W, BOARD_H)
    glow.fill({ color: PALETTE.tubeGreen, alpha: 0.05 })
    this.layers.floor.addChild(glow)

    // Lane labels, in the font of a sign nobody has updated.
    for (const l of LANES) {
      const label = new Text({
        text: l.name.toUpperCase(),
        style: {
          fontFamily: 'Silkscreen, monospace',
          fontSize: 6,
          fill: PALETTE.wallLight,
          letterSpacing: 1,
        },
      })
      label.x = 2
      label.y = (l.points[0]?.y ?? 0) * TILE - 9
      label.alpha = 0.75
      this.layers.floor.addChild(label)
    }
  }

  private drawProps(): void {
    for (const prop of PROPS) {
      const name = PROP_LOOK[prop.sprite]
      if (!name) continue
      const sprite = new Sprite(getSprite(name))
      sprite.x = prop.tile.x * TILE
      sprite.y = prop.tile.y * TILE
      this.layers.props.addChild(sprite)
    }

    const door = new Sprite(getSprite('chro_door'))
    door.x = CHRO_DOOR.x * TILE
    door.y = (CHRO_DOOR.y - 1) * TILE
    this.layers.props.addChild(door)

    const sign = new Text({
      text: 'CHRO',
      style: { fontFamily: 'Silkscreen, monospace', fontSize: 6, fill: PALETTE.highlighter },
    })
    sign.x = CHRO_DOOR.x * TILE - 2
    sign.y = (CHRO_DOOR.y - 2) * TILE + 2
    this.layers.props.addChild(sign)
  }

  // ───────────────────────────────────────────────────────────────── per frame

  sync(state: GameState, input: StageInput): void {
    if (!this.ready) return
    this.syncRequests(state, input)
    this.syncTowers(state)
    this.syncPlayers(state, input)
    this.syncGhost(state, input)
    this.drainEvents(state)
  }

  private syncRequests(state: GameState, input: StageInput): void {
    const seen = new Set<number>()
    const localRole = input.localPlayerId ? state.players[input.localPlayerId]?.role : null
    const canSeeStealth = localRole ? ROLES[localRole]?.seesStealth === true : false

    for (const req of state.requests) {
      seen.add(req.id)
      let node = this.requestSprites.get(req.id)

      if (!node) {
        node = new Container()
        const look = REQUEST_LOOK[req.type] ?? { sprite: 'req_base' as const, accent: PALETTE.paper }
        const body = new Sprite(getSprite(look.sprite, look.accent))
        body.label = 'body'
        node.addChild(body)

        const bar = new Graphics()
        bar.label = 'bar'
        node.addChild(bar)

        this.requestSprites.set(req.id, node)
        this.layers.requests.addChild(node)
        this.interp.set(req.id, { x: req.pos.x, y: req.pos.y })
      }

      const smooth = this.interp.get(req.id)!
      smooth.x += (req.pos.x - smooth.x) * 0.35
      smooth.y += (req.pos.y - smooth.y) * 0.35

      node.x = Math.round(smooth.x * TILE - 6)
      node.y = Math.round(smooth.y * TILE - 6)
      node.zIndex = node.y

      // Stealth: literally not drawn unless you are the class that can see it.
      const hidden = !req.revealed && !canSeeStealth
      node.visible = !hidden
      node.alpha = !req.revealed && canSeeStealth ? 0.55 : 1

      const body = node.getChildByLabel('body') as Sprite | null
      if (body) {
        body.tint = req.escalated ? 0xff8f86 : 0xffffff
        // A shuffling walk. Nobody in this building moves smoothly.
        body.y = Math.sin(state.tick * 0.25 + req.id) > 0 ? 0 : -1
      }

      const bar = node.getChildByLabel('bar') as Graphics | null
      if (bar) {
        bar.clear()
        const pct = Math.max(0, req.hp / req.maxHp)
        if (pct < 1) {
          bar.rect(0, -3, 12, 2).fill({ color: PALETTE.wallShadow })
          bar.rect(0, -3, 12 * pct, 2).fill({
            color: req.escalated ? PALETTE.escalate : PALETTE.tubeGlow,
          })
        }
        const slaPct = req.escalated ? 0 : req.slaTicks / Math.max(1, getRequest(req.type).slaSeconds * 20)
        if (slaPct < 0.35 && slaPct > 0) {
          bar.rect(0, -6, 12 * slaPct, 1).fill({ color: PALETTE.highlighter })
        }
      }
    }

    for (const [id, node] of this.requestSprites) {
      if (seen.has(id)) continue
      node.destroy({ children: true })
      this.requestSprites.delete(id)
      this.interp.delete(id)
    }
  }

  private syncTowers(state: GameState): void {
    const seen = new Set<number>()

    for (const tower of state.towers) {
      seen.add(tower.id)
      let node = this.towerSprites.get(tower.id)

      if (!node) {
        node = new Container()
        const look = TOWER_LOOK[tower.type] ?? { sprite: 'tw_monitor' as const, accent: PALETTE.wallLight }
        const body = new Sprite(getSprite(look.sprite, look.accent))
        body.label = 'body'
        node.addChild(body)

        const pips = new Graphics()
        pips.label = 'pips'
        node.addChild(pips)

        node.x = tower.tile.x * TILE
        node.y = tower.tile.y * TILE
        node.zIndex = node.y
        this.towerSprites.set(tower.id, node)
        this.layers.towers.addChild(node)
      }

      const body = node.getChildByLabel('body') as Sprite | null
      if (body) {
        body.tint = tower.offline ? 0x6a6478 : 0xffffff
        body.alpha = tower.offline ? 0.65 : 1
      }

      const pips = node.getChildByLabel('pips') as Graphics | null
      if (pips) {
        pips.clear()
        for (let i = 0; i < tower.level; i++) {
          pips.rect(2 + i * 4, 1, 3, 2).fill({ color: PALETTE.social })
        }
        if (tower.offline) {
          pips.rect(6, 6, 4, 4).fill({ color: PALETTE.escalate })
        }
      }
    }

    for (const [id, node] of this.towerSprites) {
      if (seen.has(id)) continue
      node.destroy({ children: true })
      this.towerSprites.delete(id)
    }
  }

  private syncPlayers(state: GameState, input: StageInput): void {
    const seen = new Set<string>()

    for (const player of Object.values(state.players)) {
      if (!player.connected || !player.role) continue
      seen.add(player.id)
      let node = this.playerSprites.get(player.id)

      if (!node) {
        node = new Container()
        const role = ROLES[player.role]
        const body = new Sprite(getSprite('pc_base', role?.colour ?? PALETTE.paper))
        body.label = 'body'
        node.addChild(body)

        const tag = new Text({
          text: player.name,
          style: {
            fontFamily: 'Silkscreen, monospace',
            fontSize: 5,
            fill: role?.colour ?? PALETTE.paper,
          },
        })
        tag.label = 'tag'
        tag.x = 6 - tag.width / 2
        tag.y = -8
        node.addChild(tag)

        const ring = new Graphics()
        ring.label = 'ring'
        node.addChild(ring)

        this.playerSprites.set(player.id, node)
        this.layers.players.addChild(node)
      }

      node.x = Math.round(player.pos.x * TILE - 6)
      node.y = Math.round(player.pos.y * TILE - 12)
      node.zIndex = node.y

      const ring = node.getChildByLabel('ring') as Graphics | null
      if (ring) {
        ring.clear()
        if (player.id === input.localPlayerId) {
          ring.circle(6, 16, 7).stroke({ width: 1, color: PALETTE.highlighter, alpha: 0.55 })
        }
        const channelling = player.abilities.find((a) => a.channelling > 0)
        if (channelling) {
          ring.circle(6, 16, 10).stroke({ width: 1, color: PALETTE.social })
        }
        if (player.abilities.some((a) => a.disabled)) {
          ring.rect(11, -10, 4, 4).fill({ color: PALETTE.deckBlue })
        }
      }
    }

    for (const [id, node] of this.playerSprites) {
      if (seen.has(id)) continue
      node.destroy({ children: true })
      this.playerSprites.delete(id)
    }
  }

  private syncGhost(state: GameState, input: StageInput): void {
    this.ghost.clear()
    this.rangeRing.clear()
    if (!input.buildingTower || !input.hoverTile) return

    const x = Math.floor(input.hoverTile.x)
    const y = Math.floor(input.hoverTile.y)
    const def = getTower(input.buildingTower)
    const occupied = state.towers.some((t) => t.tile.x === x && t.tile.y === y)
    const ok = isBuildable(x, y) && !occupied && state.budget >= def.cost

    this.ghost.rect(x * TILE, y * TILE, TILE, TILE)
    this.ghost.fill({ color: ok ? PALETTE.tubeGlow : PALETTE.escalate, alpha: 0.35 })
    this.ghost.stroke({ width: 1, color: ok ? PALETTE.tubeGlow : PALETTE.escalate })

    if (def.range > 0) {
      this.rangeRing.circle((x + 0.5) * TILE, (y + 0.5) * TILE, def.range * TILE)
      this.rangeRing.stroke({ width: 1, color: PALETTE.paper, alpha: 0.28 })
    }
  }

  /** Turns sim events into speech bubbles and floating numbers. */
  private drainEvents(state: GameState): void {
    void this.seenEvents
    for (const event of state.events) {
      let text: string | null = null
      let colour: string = PALETTE.paper

      switch (event.kind) {
        case 'deflect':
          text = `deflected +${event.amount ?? 0}`
          colour = PALETTE.tubeGlow
          break
        case 'resolve':
          if ((event.amount ?? 0) > 0) {
            text = `+${event.amount}`
            colour = PALETTE.social
          }
          break
        case 'breach':
          text = `${event.amount ?? 0}`
          colour = PALETTE.escalate
          break
        case 'escalate':
          text = event.text ?? 'ESCALATED'
          colour = PALETTE.escalate
          break
        case 'split':
          text = 'receipts!'
          colour = PALETTE.ashMauve
          break
        case 'bark':
          text = event.text ?? null
          colour = PALETTE.paperShadow
          break
        case 'ability':
          text = event.text ?? null
          colour = PALETTE.highlighter
          break
        case 'unlock':
          text = `${event.text} approved`
          colour = PALETTE.social
          break
        default:
          break
      }

      if (!text) continue
      this.spawnFloater(text, event.at, colour)
    }
  }

  private spawnFloater(message: string, at: Vec2, colour: string): void {
    if (this.floaters.length > 40) return
    const text = new Text({
      text: message,
      style: {
        fontFamily: 'Silkscreen, monospace',
        fontSize: 6,
        fill: colour,
        stroke: { color: PALETTE.void, width: 2 },
      },
    })
    text.x = Math.round(at.x * TILE - text.width / 2)
    text.y = Math.round(at.y * TILE - 14)
    this.layers.fx.addChild(text)
    this.floaters.push({ text, life: 55, vy: -0.28 })
  }

  private animate(): void {
    for (const floater of this.floaters) {
      floater.life--
      floater.text.y += floater.vy
      floater.text.alpha = Math.min(1, floater.life / 22)
    }
    const dead = this.floaters.filter((f) => f.life <= 0)
    for (const floater of dead) floater.text.destroy()
    this.floaters = this.floaters.filter((f) => f.life > 0)

    this.layers.requests.sortableChildren = true
    this.layers.players.sortableChildren = true
  }
}

export { Texture }
