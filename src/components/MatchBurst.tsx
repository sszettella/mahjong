import { useEffect, useMemo, type CSSProperties } from 'react'
import type { BoardTile } from '../types'
import { TileFaceContent } from './TileFace'

export interface MatchBurstData {
  id: number
  boardTile: BoardTile
  storageTile: BoardTile
  /** Combo / match count for flair */
  matchNumber: number
}

interface Props {
  burst: MatchBurstData | null
  onDone: () => void
}

const PARTICLE_COUNT = 14

export function MatchBurst({ burst, onDone }: Props) {
  const particles = useMemo(() => {
    if (!burst) return []
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (burst.id % 7) * 0.1
      const dist = 48 + (i % 4) * 18
      return {
        i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        delay: (i % 5) * 0.02,
        size: 5 + (i % 3) * 3,
        hue: i % 3 === 0 ? 'gold' : i % 3 === 1 ? 'jade' : 'cream',
      }
    })
  }, [burst])

  useEffect(() => {
    if (!burst) return
    const t = window.setTimeout(onDone, 620)
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

        {particles.map((p) => (
          <span
            key={p.i}
            className={`match-particle match-particle-${p.hue}`}
            style={
              {
                '--mx': `${p.x}px`,
                '--my': `${p.y}px`,
                '--delay': `${p.delay}s`,
                '--size': `${p.size}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}
