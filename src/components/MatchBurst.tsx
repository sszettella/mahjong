import { useEffect, useRef } from 'react'

export interface MatchOrigin {
  /** Center of the match source, relative to the game-screen layer (px) */
  x: number
  y: number
}

export interface MatchBurstData {
  id: number
  matchNumber: number
  /** Single origin — confetti explodes from storage match site */
  origin: MatchOrigin
}

interface Props {
  burst: MatchBurstData | null
  onDone: (burstId: number) => void
}

/** Chrome / silver metals */
const METALS = [
  { fill: '#fafafa', edge: '#c8c8c8' },
  { fill: '#f0f0f0', edge: '#b0b0b0' },
  { fill: '#e4e4e7', edge: '#a1a1aa' },
  { fill: '#d4d4d8', edge: '#909096' },
  { fill: '#c0c0c0', edge: '#888888' },
  { fill: '#e8e8e8', edge: '#a8a8a8' },
  { fill: '#f5f5f5', edge: '#bcbcbc' },
  { fill: '#dedede', edge: '#9a9a9a' },
  { fill: '#cfd4da', edge: '#868e96' },
  { fill: '#adb5bd', edge: '#6c757d' },
]

type Kind = 'rect' | 'strip' | 'disc' | 'shard'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  w: number
  h: number
  kind: Kind
  fill: string
  edge: string
  life: number
  maxLife: number
  wobble: number
  wobbleSpeed: number
  gravity: number
  drag: number
  /** 0–1 progress for alpha / trail */
  age: number
}

function seeded(n: number) {
  let t = (n | 0) + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function spawnParticles(ox: number, oy: number, seed: number, count: number): Particle[] {
  const kinds: Kind[] = ['rect', 'strip', 'disc', 'shard', 'strip', 'rect']
  const list: Particle[] = []

  for (let i = 0; i < count; i++) {
    const r1 = seeded(seed + i * 17)
    const r2 = seeded(seed + i * 19 + 3)
    const r3 = seeded(seed + i * 23 + 7)
    const r4 = seeded(seed + i * 29 + 11)
    const r5 = seeded(seed + i * 31 + 13)
    const r6 = seeded(seed + i * 37 + 17)

    // Mostly upper hemisphere + sides, a few full-circle
    const angle =
      -Math.PI / 2 +
      (r1 - 0.5) * Math.PI * 1.85 +
      (i % 5 === 0 ? (r2 - 0.5) * Math.PI : 0)

    // Impulse: strong initial kick, mass varies by shape
    const kind = kinds[Math.floor(r3 * kinds.length)]
    const mass = kind === 'strip' ? 0.72 : kind === 'disc' ? 0.88 : kind === 'shard' ? 0.95 : 1.05
    const speed = (220 + r4 * 280) / mass // px/s

    const metal = METALS[Math.floor(r5 * METALS.length)]

    const w =
      kind === 'strip' ? 2.5 + r6 * 3 : kind === 'disc' ? 4 + r6 * 5 : kind === 'shard' ? 5 + r6 * 6 : 4 + r6 * 5
    const h =
      kind === 'strip' ? 10 + r1 * 16 : kind === 'disc' ? w : kind === 'shard' ? 3 + r2 * 4 : 3.5 + r3 * 4

    list.push({
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40, // extra lift
      rot: r1 * Math.PI * 2,
      vr: (r2 - 0.5) * 14 + (angle > 0 ? 4 : -4), // tumble with direction
      w,
      h,
      kind,
      fill: metal.fill,
      edge: metal.edge,
      life: 0,
      maxLife: 1.35 + r3 * 0.75,
      wobble: r4 * Math.PI * 2,
      wobbleSpeed: 6 + r5 * 10,
      gravity: 520 + mass * 180, // px/s²
      drag: 0.985 - (1 - mass) * 0.012, // air resistance per frame @60fps-ish
      age: 0,
    })
  }

  // Secondary spark ring — tiny fast discs for “chrome flash”
  for (let i = 0; i < 18; i++) {
    const r = seeded(seed + 900 + i)
    const a = (i / 18) * Math.PI * 2 + r * 0.2
    const speed = 320 + r * 200
    list.push({
      x: ox,
      y: oy,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 20,
      rot: 0,
      vr: 0,
      w: 2 + r * 2.5,
      h: 2 + r * 2.5,
      kind: 'disc',
      fill: '#ffffff',
      edge: '#d0d0d0',
      life: 0,
      maxLife: 0.45 + r * 0.35,
      wobble: 0,
      wobbleSpeed: 0,
      gravity: 400,
      drag: 0.96,
      age: 0,
    })
  }

  return list
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const t = p.life / p.maxLife
  // Fade in fast, hold, fade out
  let alpha = 1
  if (t < 0.06) alpha = t / 0.06
  else if (t > 0.65) alpha = Math.max(0, 1 - (t - 0.65) / 0.35)

  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  // Flutter strips slightly
  if (p.kind === 'strip') {
    ctx.scale(1, 0.85 + Math.sin(p.wobble) * 0.2)
  }
  ctx.globalAlpha = alpha

  // Metallic gradient body
  const g = ctx.createLinearGradient(-p.w / 2, -p.h / 2, p.w / 2, p.h / 2)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.35, p.fill)
  g.addColorStop(0.7, p.edge)
  g.addColorStop(1, p.fill)
  ctx.fillStyle = g
  ctx.strokeStyle = p.edge
  ctx.lineWidth = 0.6

  if (p.kind === 'disc') {
    ctx.beginPath()
    ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
    ctx.fill()
    // Specular glint
    ctx.globalAlpha = alpha * 0.55
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.ellipse(-p.w * 0.15, -p.w * 0.15, p.w * 0.2, p.w * 0.12, -0.5, 0, Math.PI * 2)
    ctx.fill()
  } else if (p.kind === 'shard') {
    ctx.beginPath()
    ctx.moveTo(0, -p.h)
    ctx.lineTo(p.w / 2, p.h / 2)
    ctx.lineTo(0, p.h * 0.35)
    ctx.lineTo(-p.w / 2, p.h / 2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else {
    // rect / strip
    const rw = p.w
    const rh = p.h
    ctx.beginPath()
    // rounded-ish rect via path
    const r = Math.min(1.2, rw / 4)
    ctx.roundRect(-rw / 2, -rh / 2, rw, rh, r)
    ctx.fill()
    ctx.globalAlpha = alpha * 0.35
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillRect(-rw / 2, -rh / 2, rw, rh * 0.28)
  }

  ctx.restore()
}

export function MatchBurst({ burst, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeIdRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!burst) {
      activeIdRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const burstId = burst.id
    activeIdRef.current = burstId

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      const { width, height } = parent.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
    resize()

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const ox =
      Number.isFinite(burst.origin.x) && burst.origin.x > 0
        ? burst.origin.x
        : parent.clientWidth / 2
    const oy =
      Number.isFinite(burst.origin.y) && burst.origin.y > 0 ? burst.origin.y : 100

    const particles = spawnParticles(ox, oy, burstId * 97 + burst.matchNumber * 13, 70)
    let last = performance.now()
    let elapsed = 0
    const maxTime = 2.6

    // Soft flash ring (drawn once-ish via particles + radial fade)
    let flash = 1

    const tick = (now: number) => {
      if (activeIdRef.current !== burstId) return

      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      elapsed += dt
      flash = Math.max(0, flash - dt * 2.8)

      const w = parent.clientWidth
      const h = parent.clientHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // Origin flash — chrome burst glow
      if (flash > 0.02) {
        const grd = ctx.createRadialGradient(ox, oy, 0, ox, oy, 70 + (1 - flash) * 40)
        grd.addColorStop(0, `rgba(255,255,255,${0.55 * flash})`)
        grd.addColorStop(0.35, `rgba(220,220,230,${0.25 * flash})`)
        grd.addColorStop(1, 'rgba(200,200,210,0)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(ox, oy, 90, 0, Math.PI * 2)
        ctx.fill()
      }

      let alive = 0
      for (const p of particles) {
        p.life += dt
        if (p.life >= p.maxLife) continue
        alive++

        // Integrate physics
        p.vy += p.gravity * dt
        p.vx *= Math.pow(p.drag, dt * 60)
        p.vy *= Math.pow(0.995, dt * 60)
        // Flutter (sideways noise for strips)
        if (p.kind === 'strip' || p.kind === 'shard') {
          p.wobble += p.wobbleSpeed * dt
          p.vx += Math.sin(p.wobble) * 28 * dt
        }
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.vr * dt
        // Angular drag
        p.vr *= Math.pow(0.99, dt * 60)

        drawParticle(ctx, p)
      }

      if (alive > 0 && elapsed < maxTime) {
        rafRef.current = requestAnimationFrame(tick)
      } else if (activeIdRef.current === burstId) {
        onDone(burstId)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (activeIdRef.current === burstId) activeIdRef.current = null
    }
  }, [burst, onDone])

  if (!burst) return null

  return (
    <div className="match-burst-layer" aria-hidden>
      <canvas ref={canvasRef} className="confetti-canvas" />
    </div>
  )
}

/** Resolve tile element center relative to a container (game-screen). */
export function getTileOrigin(
  container: HTMLElement | null,
  tileId: string,
): MatchOrigin | null {
  if (!container || !tileId) return null
  const nodes = container.querySelectorAll('[data-tile-id]')
  let el: Element | null = null
  for (const n of nodes) {
    if (n.getAttribute('data-tile-id') === tileId) {
      el = n
      break
    }
  }
  if (!el) return null
  const cRect = container.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  if (r.width < 1 || r.height < 1) return null
  const x = r.left - cRect.left + r.width / 2
  const y = r.top - cRect.top + r.height / 2
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

export function getTileOrigins(
  container: HTMLElement | null,
  tileIds: string[],
): MatchOrigin[] {
  return tileIds
    .map((id) => getTileOrigin(container, id))
    .filter((o): o is MatchOrigin => o !== null)
}
