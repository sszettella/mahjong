import { useMemo, useRef, useEffect } from 'react'
import type { Progress } from '../types'
import { getLevelConfig } from '../levels'

interface Props {
  progress: Progress
  onSelect: (level: number) => void
  onBack: () => void
}

export function LevelSelect({ progress, onSelect, onBack }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const levels = useMemo(() => Array.from({ length: 100 }, (_, i) => i + 1), [])

  useEffect(() => {
    // Scroll toward current unlock
    const el = listRef.current?.querySelector(`[data-level="${progress.unlockedLevel}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [progress.unlockedLevel])

  return (
    <div className="screen level-select">
      <header className="screen-header">
        <button type="button" className="btn-icon" onClick={onBack} aria-label="Back">
          ←
        </button>
        <h2>Levels</h2>
        <span className="header-spacer" />
      </header>

      <div className="level-grid" ref={listRef}>
        {levels.map((n) => {
          const locked = n > progress.unlockedLevel
          const completed = progress.completedLevels.includes(n)
          const stars = progress.stars[n] ?? 0
          const cfg = getLevelConfig(n)
          return (
            <button
              key={n}
              type="button"
              data-level={n}
              className={[
                'level-card',
                locked ? 'locked' : '',
                completed ? 'completed' : '',
                n === progress.unlockedLevel && !completed ? 'current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={locked}
              onClick={() => onSelect(n)}
            >
              <span className="level-num">{n}</span>
              <span className="level-name">{locked ? '???' : cfg.name}</span>
              <span className="level-stars" aria-label={`${stars} stars`}>
                {locked ? '🔒' : '★'.repeat(stars) + '☆'.repeat(3 - stars)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
