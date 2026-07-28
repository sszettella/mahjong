import { useEffect, useMemo, useRef, type CSSProperties } from 'react'

export interface MatchOrigin {
  /** Center of the match source, relative to the game-screen layer (px) */
  x: number
  y: number
}

export interface MatchBurstData {
  id: number
  matchNumber: number
  /** Single origin — confetti rains from one place only */
  origin: MatchOrigin
}

interface Props {
  burst: MatchBurstData | null
  onDone: (burstId: number) => void
}

const PIECE_COUNT = 42
const BURST_MS = 2000

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
    // Guard invalid origins (NaN / off-screen) so animation never "breaks"
    const ox =
      Number.isFinite(origin.x) && origin.x > 0 ? origin.x : 0
    const oy =
      Number.isFinite(origin.y) && origin.y > 0 ? origin.y : 80
    const seed = id * 97 + matchNumber * 13

    return Array.from({ length: PIECE_COUNT }, (_, i) => {
      const r1 = seeded(seed + i * 3)
      const r2 = seeded(seed + i * 3 + 1)
      const r3 = seeded(seed + i * 3 + 2)
      const r4 = seeded(seed + i * 7 + 11)
      const r5 = seeded(seed + i * 11 + 23)
      const r6 = seeded(seed + i * 13 + 41)

      const shapes: Shape[] = ['rect', 'ribbon', 'circle', 'square', 'ribbon']
      const shape = shapes[Math.floor(r1 * shapes.length)]

      // Gentle upward pop, then long smooth rain
      const popX = (r2 - 0.5) * 56
      const popY = -16 - r3 * 48
      const sway = (r4 - 0.5) * 70
      const rainY = 260 + r5 * 340
      const rainX = popX * 0.35 + sway

      return {
        i,
        color: COLORS[Math.floor(r6 * COLORS.length)],
        shape,
        originX: ox + (r1 - 0.5) * 18,
        originY: oy + (r2 - 0.5) * 10,
        popX,
        popY,
        midX: popX * 0.7 + sway * 0.4,
        midY: popY * 0.2 + 24 + r3 * 28,
        rainX,
        rainY,
        delay: r1 * 0.12 + (i % 7) * 0.018,
        duration: 1.45 + r2 * 0.55,
        rot0: r3 * 360,
        rot1: (r4 - 0.5) * 480,
        rot2: (r5 - 0.5) * 720,
        w: shape === 'ribbon' ? 3 + r5 * 3.5 : shape === 'circle' ? 5 + r5 * 5 : 5 + r5 * 6,
        h:
          shape === 'ribbon'
            ? 11 + r6 * 14
            : shape === 'circle'
              ? 5 + r5 * 5
              : shape === 'square'
                ? 6 + r5 * 4
                : 4 + r6 * 4,
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
      // Only complete if this burst is still the active one
      if (activeIdRef.current === burstId) {
        onDone(burstId)
      }
    }, BURST_MS)
    return () => {
      window.clearTimeout(t)
    }
  }, [burst, onDone])

  if (!burst || pieces.length === 0) return null

  return (
    <div className="match-burst-layer" aria-hidden>
      <div
        className="match-origin-flash"
        style={{ left: burst.origin.x, top: burst.origin.y }}
      />
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
                '--pop-x': `${p.popX}px`,
                '--pop-y': `${p.popY}px`,
                '--mid-x': `${p.midX}px`,
                '--mid-y': `${p.midY}px`,
                '--rain-x': `${p.rainX}px`,
                '--rain-y': `${p.rainY}px`,
                '--delay': `${p.delay}s`,
                '--dur': `${p.duration}s`,
                '--rot0': `${p.rot0}deg`,
                '--rot1': `${p.rot1}deg`,
                '--rot2': `${p.rot2}deg`,
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
  // Avoid CSS.escape (not needed for our ids; safer across WebViews)
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

/** @deprecated use getTileOrigin — kept for any leftover imports */
export function getTileOrigins(
  container: HTMLElement | null,
  tileIds: string[],
): MatchOrigin[] {
  return tileIds
    .map((id) => getTileOrigin(container, id))
    .filter((o): o is MatchOrigin => o !== null)
}
