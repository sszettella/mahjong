import { useEffect, useMemo, type CSSProperties } from 'react'

export interface MatchOrigin {
  /** Center of the match source, relative to the game-screen layer (px) */
  x: number
  y: number
}

export interface MatchBurstData {
  id: number
  matchNumber: number
  /** Origins to rain from — typically board tile + storage slot */
  origins: MatchOrigin[]
}

interface Props {
  burst: MatchBurstData | null
  onDone: () => void
}

const PIECES_PER_ORIGIN = 40
const BURST_MS = 2300

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
  '#a8f0c8',
  '#ffb4a2',
]

type Shape = 'rect' | 'ribbon' | 'circle' | 'square'

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function MatchBurst({ burst, onDone }: Props) {
  const pieces = useMemo(() => {
    if (!burst || burst.origins.length === 0) return []
    const seed = burst.id * 97 + burst.matchNumber * 13
    const origins = burst.origins
    const out: Array<{
      i: number
      color: string
      shape: Shape
      originX: number
      originY: number
      popX: number
      popY: number
      midX: number
      midY: number
      rainX: number
      rainY: number
      delay: number
      duration: number
      rot0: number
      rot1: number
      rot2: number
      w: number
      h: number
      spin: number
      flutter: number
    }> = []

    origins.forEach((origin, oi) => {
      for (let j = 0; j < PIECES_PER_ORIGIN; j++) {
        const i = oi * PIECES_PER_ORIGIN + j
        const r1 = seeded(seed + i)
        const r2 = seeded(seed + i + 50)
        const r3 = seeded(seed + i + 100)
        const r4 = seeded(seed + i + 150)
        const r5 = seeded(seed + i + 200)
        const r6 = seeded(seed + i + 250)
        const r7 = seeded(seed + i + 300)
        const r8 = seeded(seed + i + 350)

        // Small horizontal scatter around the origin
        const originJitterX = (r1 - 0.5) * 28
        const originJitterY = (r2 - 0.5) * 16

        // Soft upward pop then rain
        const popX = (r3 - 0.5) * 70
        const popY = -20 - r4 * 55
        const sway = (r5 - 0.5) * 100
        const rainY = 220 + r6 * 380
        const rainX = popX * 0.4 + sway + (r7 - 0.5) * 50

        const shapes: Shape[] = ['rect', 'ribbon', 'circle', 'square', 'ribbon']
        const shape = shapes[Math.floor(r6 * shapes.length)]

        out.push({
          i,
          color: COLORS[Math.floor(r8 * COLORS.length)],
          shape,
          originX: origin.x + originJitterX,
          originY: origin.y + originJitterY,
          popX,
          popY,
          midX: popX * 0.65 + sway * 0.45,
          midY: popY * 0.25 + 18 + r4 * 36,
          rainX,
          rainY,
          delay: r1 * 0.16 + (j % 10) * 0.014 + oi * 0.04,
          duration: 1.4 + r2 * 0.8,
          rot0: r3 * 360,
          rot1: (r4 - 0.5) * 540,
          rot2: (r5 - 0.5) * 900,
          w: shape === 'ribbon' ? 3 + r5 * 4 : shape === 'circle' ? 5 + r5 * 6 : 5 + r5 * 7,
          h:
            shape === 'ribbon'
              ? 12 + r6 * 18
              : shape === 'circle'
                ? 5 + r5 * 6
                : shape === 'square'
                  ? 6 + r5 * 5
                  : 4 + r6 * 5,
          spin: r7 > 0.5 ? 1 : -1,
          flutter: 0.7 + r8 * 0.6,
        })
      }
    })
    return out
  }, [burst])

  useEffect(() => {
    if (!burst) return
    const t = window.setTimeout(onDone, BURST_MS)
    return () => clearTimeout(t)
  }, [burst, onDone])

  if (!burst) return null

  return (
    <div className="match-burst-layer" aria-hidden>
      {/* Soft flashes at each origin (board tile / storage) */}
      {burst.origins.map((o, i) => (
        <div
          key={i}
          className="match-origin-flash"
          style={{ left: o.x, top: o.y }}
        />
      ))}

      <div className="confetti-field confetti-field-anchored">
        {pieces.map((p) => (
          <span
            key={p.i}
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
                '--flutter': p.flutter,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}

/** Resolve tile element centers relative to a container (game-screen). */
export function getTileOrigins(
  container: HTMLElement | null,
  tileIds: string[],
): MatchOrigin[] {
  if (!container) return []
  const cRect = container.getBoundingClientRect()
  const origins: MatchOrigin[] = []
  for (const id of tileIds) {
    const el = container.querySelector(`[data-tile-id="${CSS.escape(id)}"]`)
    if (!el) continue
    const r = el.getBoundingClientRect()
    origins.push({
      x: r.left - cRect.left + r.width / 2,
      y: r.top - cRect.top + r.height / 2,
    })
  }
  return origins
}
