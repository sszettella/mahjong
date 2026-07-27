import { useEffect, useMemo, type CSSProperties } from 'react'
import type { BoardTile } from '../types'
import { TileFaceContent } from './TileFace'

export interface MatchBurstData {
  id: number
  boardTile: BoardTile
  storageTile: BoardTile
  matchNumber: number
}

interface Props {
  burst: MatchBurstData | null
  onDone: () => void
}

const CONFETTI_COUNT = 72
/** Keep overlay until the last rain piece fades */
const BURST_MS = 2200

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
    if (!burst) return []
    const seed = burst.id * 97 + burst.matchNumber * 13
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
      const r1 = seeded(seed + i)
      const r2 = seeded(seed + i + 50)
      const r3 = seeded(seed + i + 100)
      const r4 = seeded(seed + i + 150)
      const r5 = seeded(seed + i + 200)
      const r6 = seeded(seed + i + 250)
      const r7 = seeded(seed + i + 300)
      const r8 = seeded(seed + i + 350)

      // Initial pop: mostly upward + wide spread
      const angle = -Math.PI * 0.15 - r1 * Math.PI * 0.7 // upper hemisphere bias
      const popPower = 50 + r2 * 110
      const popX = Math.cos(angle) * popPower * (r3 > 0.5 ? 1 : -1) * (0.4 + r3)
      const popY = Math.sin(angle) * popPower - 30 - r4 * 50 // lift

      // Mid drift (wind / sway) while floating
      const sway = (r5 - 0.5) * 90

      // Rain fall — far below the board
      const rainY = 280 + r6 * 320
      const rainX = popX * 0.35 + sway + (r7 - 0.5) * 60

      const shapes: Shape[] = ['rect', 'ribbon', 'circle', 'square', 'ribbon']
      const shape = shapes[Math.floor(r6 * shapes.length)]

      // Staggered spawn so it feels like a shower, not one bang
      const delay = r1 * 0.18 + (i % 8) * 0.012
      // Longer fall times for rain feel
      const duration = 1.35 + r2 * 0.75

      return {
        i,
        color: COLORS[Math.floor(r8 * COLORS.length)],
        shape,
        popX,
        popY,
        midX: popX * 0.7 + sway * 0.5,
        midY: popY * 0.35 + 20 + r4 * 40,
        rainX,
        rainY,
        sway,
        delay,
        duration,
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
        // Flutter speed variance for ribbons
        flutter: 0.7 + r8 * 0.6,
      }
    })
  }, [burst])

  useEffect(() => {
    if (!burst) return
    const t = window.setTimeout(onDone, BURST_MS)
    return () => clearTimeout(t)
  }, [burst, onDone])

  if (!burst) return null

  const ghostA = { ...burst.boardTile, removed: false }
  const ghostB = { ...burst.storageTile, removed: false }

  return (
    <div className="match-burst-layer" aria-hidden>
      <div className="match-burst-flash" />
      <div className="match-burst-core">
        <div className="match-ring" />
        <div className="match-ring match-ring-delay" />

        <div className="match-ghost match-ghost-left">
          <div className="mahjong-tile free match-ghost-tile">
            <TileFaceContent tile={ghostA} />
          </div>
        </div>
        <div className="match-ghost match-ghost-right">
          <div className="mahjong-tile free match-ghost-tile">
            <TileFaceContent tile={ghostB} />
          </div>
        </div>

        <div className="match-spark">✦</div>
        <div className="match-pop-label">Match!</div>
      </div>

      {/* Full-screen rain field so confetti can fall off the bottom */}
      <div className="confetti-field">
        {pieces.map((p) => (
          <span
            key={p.i}
            className={`confetti confetti-${p.shape}`}
            style={
              {
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
