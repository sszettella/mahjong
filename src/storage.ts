import type { Progress } from './types'

const KEY = 'mahjong-progress-v1'

const DEFAULT: Progress = {
  unlockedLevel: 1,
  completedLevels: [],
  bestMoves: {},
  stars: {},
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw) as Progress
    return {
      unlockedLevel: parsed.unlockedLevel ?? 1,
      completedLevels: parsed.completedLevels ?? [],
      bestMoves: parsed.bestMoves ?? {},
      stars: parsed.stars ?? {},
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveProgress(progress: Progress): void {
  localStorage.setItem(KEY, JSON.stringify(progress))
}

export function completeLevel(
  progress: Progress,
  level: number,
  moves: number,
  stars: number,
): Progress {
  const completed = new Set(progress.completedLevels)
  completed.add(level)
  const bestMoves = { ...progress.bestMoves }
  if (!bestMoves[level] || moves < bestMoves[level]) {
    bestMoves[level] = moves
  }
  const starMap = { ...progress.stars }
  starMap[level] = Math.max(starMap[level] ?? 0, stars)
  const unlockedLevel = Math.max(progress.unlockedLevel, Math.min(100, level + 1))
  const next: Progress = {
    unlockedLevel,
    completedLevels: [...completed].sort((a, b) => a - b),
    bestMoves,
    stars: starMap,
  }
  saveProgress(next)
  return next
}

export function resetProgress(): Progress {
  saveProgress(DEFAULT)
  return { ...DEFAULT }
}

export function totalStars(progress: Progress): number {
  return Object.values(progress.stars).reduce((a, b) => a + b, 0)
}
