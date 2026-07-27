import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BoardTile, GameSnapshot, GameStats, Progress, StorageSlots } from '../types'
import { emptyStorage } from '../types'
import { getLevelConfig, starsForLevel } from '../levels'
import { createBoard } from '../layouts'
import {
  applyFreeTileClick,
  freeTilesMatchingStorage,
  getFreeBoardTiles,
  isWon,
  remainingCount,
} from '../gameLogic'
import { facesMatch, shuffle, mulberry32 } from '../tiles'
import { completeLevel } from '../storage'
import { Board } from './Board'
import { StorageRack } from './StorageRack'
import { MatchBurst, type MatchBurstData } from './MatchBurst'

interface Props {
  level: number
  progress: Progress
  onProgress: (p: Progress) => void
  onBack: () => void
  onNext: (level: number) => void
}

function cloneSnapshot(board: BoardTile[], storage: StorageSlots): GameSnapshot {
  return {
    board: board.map((t) => ({ ...t, face: { ...t.face } })),
    storage: storage.map((t) => (t ? { ...t, face: { ...t.face } } : null)) as StorageSlots,
  }
}

export function GameScreen({ level, progress, onProgress, onBack, onNext }: Props) {
  const config = useMemo(() => getLevelConfig(level), [level])
  const [board, setBoard] = useState<BoardTile[]>(() => createBoard(config))
  const [storage, setStorage] = useState<StorageSlots>(() => emptyStorage())
  const [flashId, setFlashId] = useState<string | null>(null)
  const [hintIds, setHintIds] = useState<string[]>([])
  const [history, setHistory] = useState<GameSnapshot[]>([])
  const [stats, setStats] = useState<GameStats>(() => ({
    moves: 0,
    matches: 0,
    hintsUsed: 0,
    undosUsed: 0,
    startTime: Date.now(),
  }))
  const [showWin, setShowWin] = useState(false)
  const [showFail, setShowFail] = useState(false)
  const [earnedStars, setEarnedStars] = useState(0)
  const [seed, setSeed] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [matchingIds, setMatchingIds] = useState<string[]>([])
  const [matchBurst, setMatchBurst] = useState<MatchBurstData | null>(null)
  const [animating, setAnimating] = useState(false)
  const [parkFlashId, setParkFlashId] = useState<string | null>(null)
  const burstSeq = useRef(0)
  const animTimer = useRef<number | null>(null)

  const clearAnimTimer = () => {
    if (animTimer.current != null) {
      window.clearTimeout(animTimer.current)
      animTimer.current = null
    }
  }

  useEffect(() => {
    const cfg = getLevelConfig(level)
    clearAnimTimer()
    setBoard(createBoard(cfg))
    setStorage(emptyStorage())
    setFlashId(null)
    setHintIds([])
    setHistory([])
    setStats({
      moves: 0,
      matches: 0,
      hintsUsed: 0,
      undosUsed: 0,
      startTime: Date.now(),
    })
    setShowWin(false)
    setShowFail(false)
    setEarnedStars(0)
    setMatchingIds([])
    setMatchBurst(null)
    setAnimating(false)
    setParkFlashId(null)
  }, [level, seed])

  useEffect(() => {
    if (showWin || showFail) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [showWin, showFail, level, seed])

  useEffect(() => () => clearAnimTimer(), [])

  const remaining = remainingCount(board, storage)

  const finishWin = useCallback(
    (nextBoard: BoardTile[], nextStorage: StorageSlots, nextStats: GameStats) => {
      if (!isWon(nextBoard, nextStorage)) return
      const tileCount = nextBoard.length
      const stars = starsForLevel(
        level,
        nextStats.moves,
        nextStats.hintsUsed,
        nextStats.undosUsed,
        tileCount,
      )
      setEarnedStars(stars)
      // Slight delay so the match burst finishes before the win modal
      window.setTimeout(() => setShowWin(true), 380)
      const next = completeLevel(progress, level, nextStats.moves, stars)
      onProgress(next)
    },
    [level, progress, onProgress],
  )

  const handleSelectBoard = useCallback(
    (id: string) => {
      if (showWin || showFail || animating) return
      setHintIds([])

      setFlashId(id)
      window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 160)

      const result = applyFreeTileClick(board, storage, id)
      if (result.type === 'invalid') return

      if (result.type === 'fail') {
        setShowFail(true)
        return
      }

      setHistory((h) => [...h, cloneSnapshot(board, storage)])

      if (result.type === 'match') {
        const boardTile = board.find((t) => t.id === id)!
        const storageTile = storage.find((t) => t?.id === result.matchedId)!
        const nextStats = {
          ...stats,
          moves: stats.moves + 1,
          matches: stats.matches + 1,
        }

        // Phase 1: highlight both tiles + launch burst overlay
        setAnimating(true)
        setMatchingIds([id, result.matchedId])
        burstSeq.current += 1
        setMatchBurst({
          id: burstSeq.current,
          boardTile,
          storageTile,
          matchNumber: nextStats.matches,
        })

        try {
          navigator.vibrate?.([12, 30, 18])
        } catch {
          /* ignore */
        }

        // Phase 2: commit removal mid-animation so the board updates cleanly
        clearAnimTimer()
        animTimer.current = window.setTimeout(() => {
          setBoard(result.board)
          setStorage(result.storage)
          setStats(nextStats)
          setMatchingIds([])
          setAnimating(false)
          finishWin(result.board, result.storage, nextStats)
        }, 320)

        return
      }

      // Park into storage — light pop on the destination slot
      setBoard(result.board)
      setStorage(result.storage)
      setStats((s) => ({ ...s, moves: s.moves + 1 }))
      setParkFlashId(id)
      window.setTimeout(() => setParkFlashId(null), 320)
      try {
        navigator.vibrate?.(8)
      } catch {
        /* ignore */
      }
    },
    [showWin, showFail, animating, board, storage, stats, finishWin],
  )

  const handleBurstDone = useCallback(() => {
    setMatchBurst(null)
  }, [])

  const handleHint = () => {
    if (showWin || showFail || animating) return

    const clears = freeTilesMatchingStorage(board, storage)
    if (clears.length > 0) {
      const t = clears[0]
      const match = storage.find((s) => s && facesMatch(t.face, s.face))
      setHintIds(match ? [t.id, match.id] : [t.id])
      setStats((s) => ({ ...s, hintsUsed: s.hintsUsed + 1 }))
      return
    }

    const free = getFreeBoardTiles(board)
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        if (facesMatch(free[i].face, free[j].face)) {
          setHintIds([free[i].id, free[j].id])
          setStats((s) => ({ ...s, hintsUsed: s.hintsUsed + 1 }))
          return
        }
      }
    }

    if (free.length > 0) {
      setHintIds([free[0].id])
      setStats((s) => ({ ...s, hintsUsed: s.hintsUsed + 1 }))
    }
  }

  const handleUndo = () => {
    if (history.length === 0 || animating) return
    clearAnimTimer()
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setBoard(prev.board)
    setStorage(prev.storage)
    setFlashId(null)
    setHintIds([])
    setShowFail(false)
    setMatchingIds([])
    setMatchBurst(null)
    setAnimating(false)
    setStats((s) => ({
      ...s,
      undosUsed: s.undosUsed + 1,
      moves: Math.max(0, s.moves - 1),
    }))
  }

  const handleShuffle = () => {
    if (showWin || showFail || animating) return
    const active = board.filter((t) => !t.removed)
    const faces = active.map((t) => t.face)
    const shuffled = shuffle(faces, mulberry32(Date.now() % 1e9))
    let i = 0
    setHistory((h) => [...h, cloneSnapshot(board, storage)])
    setBoard(
      board.map((t) => {
        if (t.removed) return t
        return { ...t, face: shuffled[i++] }
      }),
    )
    setFlashId(null)
    setHintIds([])
  }

  const handleRestart = () => {
    setSeed((s) => s + 1)
  }

  const elapsed = Math.floor((now - stats.startTime) / 1000)
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  // Keep matched tiles painted for the exit anim even after state commit.
  const displayBoard = useMemo(() => {
    if (matchingIds.length === 0) return board
    return board.map((t) =>
      matchingIds.includes(t.id) && t.removed ? { ...t, removed: false } : t,
    )
  }, [board, matchingIds])

  return (
    <div className={`screen game-screen ${animating ? 'is-matching' : ''}`}>
      <header className="game-header">
        <button type="button" className="btn-icon" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div className="game-title-block">
          <span className="game-level">Level {level}</span>
          <span className="game-name">{config.name}</span>
        </div>
        <div className="game-meta">
          <span>{remaining}</span>
          <span className="meta-sep">·</span>
          <span>
            {mm}:{ss}
          </span>
        </div>
      </header>

      <Board
        board={displayBoard}
        selectedId={flashId}
        hintIds={hintIds}
        matchingIds={matchingIds}
        onSelect={handleSelectBoard}
      />

      <StorageRack
        storage={storage}
        hintIds={hintIds}
        matchingIds={matchingIds}
        parkFlashId={parkFlashId}
        failed={showFail}
      />

      <MatchBurst burst={matchBurst} onDone={handleBurstDone} />

      <footer className="game-toolbar">
        <button
          type="button"
          className="tool-btn"
          onClick={handleUndo}
          disabled={history.length === 0 || animating}
        >
          <span>↩</span>
          Undo
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={handleHint}
          disabled={showFail || showWin || animating}
        >
          <span>💡</span>
          Hint
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={handleShuffle}
          disabled={showFail || showWin || animating}
        >
          <span>🔀</span>
          Shuffle
        </button>
        <button type="button" className="tool-btn" onClick={handleRestart}>
          <span>↻</span>
          Restart
        </button>
      </footer>

      {showWin && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-emoji">🎉</div>
            <h2>Level Clear!</h2>
            <p className="modal-stars">
              {'★'.repeat(earnedStars)}
              {'☆'.repeat(3 - earnedStars)}
            </p>
            <p className="modal-detail">
              {stats.matches} matches · {stats.moves} moves
            </p>
            <div className="modal-actions">
              {level < 100 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onNext(level + 1)}
                >
                  Next Level
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={onBack}>
                Levels
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleRestart}>
                Replay
              </button>
            </div>
          </div>
        </div>
      )}

      {showFail && !showWin && (
        <div className="modal-backdrop">
          <div className="modal modal-fail">
            <div className="modal-emoji">💥</div>
            <h2>Storage Full</h2>
            <p className="modal-detail">
              A 4th tile in storage fails the level. Match or undo before storage hits 4.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUndo}
                disabled={history.length === 0}
              >
                Undo
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleRestart}>
                Restart Level
              </button>
              <button type="button" className="btn btn-ghost" onClick={onBack}>
                Levels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
