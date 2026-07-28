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
const BURST_MS = 2800

/** Chrome / silver metal palette */
const COLORS = [
  '#f8f9fa',
  '#e9ecef',
  '#dee2e6',
  '#ced4da',
  '#adb5bd',
  '#c0c0c0',
  '#d8d8d8',
  '#e8e8e8',
  '#b8b8b8',
  '#a0a0a0',
  '#f0f0f0',
  '#9aa0a6',
  '#d4d4d8',
  '#e4e4e7',
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
      const r7 = seeded(seed + i * 17 + 59)

      const shapes: Shape[] = ['rect', 'ribbon', 'circle', 'square', 'ribbon', 'circle']
      const shape = shapes[Math.floor(r1 * shapes.length)]

      // Random direction with slight upward bias (real confetti pops up more than down)
      const angle =
        -Math.PI * 0.5 + // start pointing up
        (r1 - 0.5) * Math.PI * 1.7 + // fan mostly upper hemisphere + sides
        (i % 3 === 0 ? Math.PI * (r2 - 0.5) * 0.8 : 0) // some full-circle stragglers

      // Variable “mass” / impulse — lighter pieces go farther
      const mass = shape === 'ribbon' ? 0.75 : shape === 'circle' ? 0.9 : shape === 'square' ? 1.15 : 1
      const power = (36 + r2 * 48) / mass

      // Apex of the pop (initial velocity)
      const burstX = Math.cos(angle) * power
      const burstY = Math.sin(angle) * power - 8 // extra lift

      // Air drag: horizontal velocity decays; gravity dominates vertical
      const drag = 0.45 + r3 * 0.25 // keep ~45–70% of horizontal speed by landing
      const wind = (r4 - 0.5) * 22
      const fallX = burstX * drag + wind
      // Always end well below origin; heavier pieces fall faster (less hang)
      const hang = shape === 'ribbon' ? 0.55 : shape === 'circle' ? 0.4 : 0.28
      const fallY = Math.max(burstY * hang, -20) + (160 + r5 * 180) * mass

      // Heavier = shorter flight; ribbons drift longer
      const duration =
        (shape === 'ribbon' ? 2.0 : shape === 'circle' ? 1.75 : 1.55) + r2 * 0.35

      return {
        i,
        color: COLORS[Math.floor(r6 * COLORS.length)],
        shape,
        originX: ox,
        originY: oy,
        burstX,
        burstY,
        // Midpoint: still moving out but starting to fall (natural arc)
        midX: burstX * (0.75 + r7 * 0.1) + wind * 0.35,
        midY: burstY * 0.55 + (fallY - burstY) * 0.22,
        fallX,
        fallY,
        delay: r1 * 0.03,
        duration,
        rot0: r3 * 360,
        // Spin scales with lateral speed (tumbling in air)
        spinAmt: 120 + Math.abs(burstX) * 2.2 + r4 * 280,
        w: shape === 'ribbon' ? 2.5 + r5 * 3.5 : shape === 'circle' ? 4 + r5 * 5 : 4 + r5 * 6,
        h:
          shape === 'ribbon'
            ? 12 + r6 * 18
            : shape === 'circle'
              ? 4 + r5 * 5
              : shape === 'square'
                ? 5 + r5 * 4
                : 3.5 + r6 * 4,
        spin: burstX >= 0 ? 1 : -1,
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
                '--mid-x': `${p.midX}px`,
                '--mid-y': `${p.midY}px`,
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
