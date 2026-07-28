import { useEffect, useMemo, useRef, type CSSProperties } from 'react'

export interface MatchOrigin {
  /** Center of the match source, relative to the game-screen layer (px) */
  x: number
  y: number
}

export interface MatchBurstData {
  id: number
  matchNumber: number
  /** Single origin — confetti explodes from one place only */
  origin: MatchOrigin
}

interface Props {
  burst: MatchBurstData | null
  onDone: (burstId: number) => void
}

const PIECE_COUNT = 52
const BURST_MS = 2600

const COLORS = [
  '#ff5c5c',
  '#ff8a3d',
  '#ffd166',
  '#ffe566',
  '#6ddf8c',
  '#3dd9c0',
  '#5eb3ff',
  '#8b7cff',
  '#ff6bcb',
  '#ffffff',
  '#e8b84a',
  '#f0a0c8',
  '#fff3a0',
  '#ff6b6b',
]

type Shape = 'rect' | 'ribbon' | 'circle' | 'square'

function seeded(n: number) {
  let t = (n | 0) + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function MatchBurst({ burst, onDone }: Props) {
  const activeIdRef = useRef<number | null>(null)

  const pieces = useMemo(() => {
    if (!burst) return []
    const { origin, id, matchNumber } = burst
    const ox = Number.isFinite(origin.x) && origin.x > 0 ? origin.x : 0
    const oy = Number.isFinite(origin.y) && origin.y > 0 ? origin.y : 80
    const seed = id * 97 + matchNumber * 13

    return Array.from({ length: PIECE_COUNT }, (_, i) => {
      const r1 = seeded(seed + i * 3)
      const r2 = seeded(seed + i * 3 + 1)
      const r3 = seeded(seed + i * 3 + 2)
      const r4 = seeded(seed + i * 7 + 11)
      const r5 = seeded(seed + i * 11 + 23)
      const r6 = seeded(seed + i * 13 + 41)

      const shapes: Shape[] = ['rect', 'ribbon', 'circle', 'square', 'ribbon', 'circle']
      const shape = shapes[Math.floor(r1 * shapes.length)]

      // Full 360° firework — tighter radius, slower motion
      const angle = (i / PIECE_COUNT) * Math.PI * 2 + (r1 - 0.5) * 0.35
      const power = 42 + r2 * 55 // was ~90–240; now ~42–97
      const burstX = Math.cos(angle) * power
      const burstY = Math.sin(angle) * power * 0.95 - 6

      // After the blast, gravity pulls everything down (gentler drift)
      const fallX = burstX * 1.05 + (r3 - 0.5) * 18
      const fallY = burstY + 180 + r4 * 200

      return {
        i,
        color: COLORS[Math.floor(r6 * COLORS.length)],
        shape,
        // Exact match-tile center — no scatter at spawn
        originX: ox,
        originY: oy,
        burstX,
        burstY,
        fallX,
        fallY,
        // Essentially simultaneous so the blast reads as one explosion
        delay: r1 * 0.025,
        duration: 1.7 + r2 * 0.55, // slower overall
        rot0: r3 * 360,
        spinAmt: 180 + r4 * 400,
        w: shape === 'ribbon' ? 3 + r5 * 4 : shape === 'circle' ? 5 + r5 * 6 : 5 + r5 * 7,
        h:
          shape === 'ribbon'
            ? 12 + r6 * 16
            : shape === 'circle'
              ? 5 + r5 * 6
              : shape === 'square'
                ? 6 + r5 * 5
                : 4 + r6 * 5,
        spin: r6 > 0.5 ? 1 : -1,
      }
    })
  }, [burst])

  useEffect(() => {
    if (!burst) {
      activeIdRef.current = null
      return
    }
    activeIdRef.current = burst.id
    const burstId = burst.id
    const t = window.setTimeout(() => {
      if (activeIdRef.current === burstId) onDone(burstId)
    }, BURST_MS)
    return () => window.clearTimeout(t)
  }, [burst, onDone])

  if (!burst || pieces.length === 0) return null

  return (
    <div className="match-burst-layer" aria-hidden>
      <div className="confetti-field confetti-field-anchored">
        {pieces.map((p) => (
          <span
            key={`${burst.id}-${p.i}`}
            className={`confetti confetti-${p.shape}`}
            style={
              {
                left: p.originX,
                top: p.originY,
                '--c': p.color,
                '--burst-x': `${p.burstX}px`,
                '--burst-y': `${p.burstY}px`,
                '--fall-x': `${p.fallX}px`,
                '--fall-y': `${p.fallY}px`,
                '--delay': `${p.delay}s`,
                '--dur': `${p.duration}s`,
                '--rot0': `${p.rot0}deg`,
                '--spin-amt': `${p.spinAmt}deg`,
                '--spin': p.spin,
                '--w': `${p.w}px`,
                '--h': `${p.h}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
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
