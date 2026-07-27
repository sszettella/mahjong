import type { BoardTile, StorageSlots } from './types'
import { emptyStorage, STORAGE_SAFE_MAX } from './types'
import { facesMatch } from './tiles'

const EPS = 0.45 // half-tile overlap threshold for adjacency / covering

/** Bounding box overlap in x/y for "same stack" covering. */
export function covers(upper: BoardTile, lower: BoardTile): boolean {
  if (upper.z <= lower.z) return false
  return (
    Math.abs(upper.x - lower.x) < EPS &&
    Math.abs(upper.y - lower.y) < EPS
  )
}

/** True if any active tile sits on top of this one. */
export function isCoveredByStack(tile: BoardTile, board: BoardTile[]): boolean {
  if (tile.removed) return false
  return board.some(
    (other) => !other.removed && other.id !== tile.id && covers(other, tile),
  )
}

function overlapsXY(a: BoardTile, b: BoardTile): boolean {
  return Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS
}

function isLeftOf(a: BoardTile, b: BoardTile): boolean {
  return (
    a.z === b.z &&
    Math.abs(a.y - b.y) < EPS &&
    a.x < b.x &&
    b.x - a.x < 1.2
  )
}

function isRightOf(a: BoardTile, b: BoardTile): boolean {
  return (
    a.z === b.z &&
    Math.abs(a.y - b.y) < EPS &&
    a.x > b.x &&
    a.x - b.x < 1.2
  )
}

/** A board tile is free if nothing sits on top and it is not blocked on both left and right. */
export function isTileFree(tile: BoardTile, board: BoardTile[]): boolean {
  if (tile.removed) return false

  const active = board.filter((t) => !t.removed && t.id !== tile.id)

  for (const other of active) {
    if (covers(other, tile)) return false
  }

  let left = false
  let right = false
  for (const other of active) {
    if (isLeftOf(other, tile)) left = true
    if (isRightOf(other, tile)) right = true
  }
  return !(left && right)
}

export function getFreeBoardTiles(board: BoardTile[]): BoardTile[] {
  return board.filter((t) => isTileFree(t, board))
}

/** Free tiles for matching = free board tiles + everything in storage (always free). */
export function getPlayableTiles(
  board: BoardTile[],
  storage: StorageSlots = emptyStorage(),
): BoardTile[] {
  const stored = storage.filter((t): t is BoardTile => t !== null)
  return [...getFreeBoardTiles(board), ...stored]
}

export function getMatchingPairs(
  board: BoardTile[],
  storage: StorageSlots = emptyStorage(),
): [BoardTile, BoardTile][] {
  const free = getPlayableTiles(board, storage)
  const pairs: [BoardTile, BoardTile][] = []
  const used = new Set<string>()

  for (let i = 0; i < free.length; i++) {
    if (used.has(free[i].id)) continue
    for (let j = i + 1; j < free.length; j++) {
      if (used.has(free[j].id)) continue
      if (facesMatch(free[i].face, free[j].face)) {
        pairs.push([free[i], free[j]])
        used.add(free[i].id)
        used.add(free[j].id)
        break
      }
    }
  }
  return pairs
}

export function hasAnyMatch(
  board: BoardTile[],
  storage: StorageSlots = emptyStorage(),
): boolean {
  const free = getPlayableTiles(board, storage)
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (facesMatch(free[i].face, free[j].face)) return true
    }
  }
  return false
}

export function storageCount(storage: StorageSlots): number {
  return storage.filter((t) => t !== null).length
}

export function remainingCount(
  board: BoardTile[],
  storage: StorageSlots = emptyStorage(),
): number {
  return board.filter((t) => !t.removed).length + storageCount(storage)
}

export function isWon(
  board: BoardTile[],
  storage: StorageSlots = emptyStorage(),
): boolean {
  return remainingCount(board, storage) === 0
}

export function isStuck(
  board: BoardTile[],
  storage: StorageSlots = emptyStorage(),
): boolean {
  return remainingCount(board, storage) > 0 && !hasAnyMatch(board, storage)
}

export function firstEmptyStorageSlot(storage: StorageSlots): number {
  return storage.findIndex((s) => s === null)
}

export function findStorageIndex(storage: StorageSlots, id: string): number {
  return storage.findIndex((t) => t?.id === id)
}

/** First storage tile that matches the given board tile face, or null. */
export function findMatchingInStorage(
  tile: BoardTile,
  storage: StorageSlots,
): BoardTile | null {
  for (const s of storage) {
    if (s && facesMatch(tile.face, s.face)) return s
  }
  return null
}

/**
 * Click a free board tile:
 * 1) Match against storage → clear both
 * 2) Else if storage already has 3 tiles → fail (4th tile loses)
 * 3) Else park into an empty safe slot
 */
export type ClickResult =
  | { type: 'match'; board: BoardTile[]; storage: StorageSlots; matchedId: string }
  | { type: 'park'; board: BoardTile[]; storage: StorageSlots; slotIndex: number }
  | { type: 'fail' }
  | { type: 'invalid' }

export function applyFreeTileClick(
  board: BoardTile[],
  storage: StorageSlots,
  tileId: string,
): ClickResult {
  const tile = board.find((t) => t.id === tileId)
  if (!tile || tile.removed || !isTileFree(tile, board)) return { type: 'invalid' }

  const match = findMatchingInStorage(tile, storage)
  if (match) {
    const result = removePair(board, storage, tile.id, match.id)
    return { type: 'match', board: result.board, storage: result.storage, matchedId: match.id }
  }

  // Already holding 3 unmatched tiles — parking another is the failing 4th
  if (storageCount(storage) >= STORAGE_SAFE_MAX) {
    return { type: 'fail' }
  }

  const slot = firstEmptyStorageSlot(storage)
  if (slot >= 0 && slot < STORAGE_SAFE_MAX) {
    const parked = parkToStorage(board, storage, tileId, slot)
    if (!parked) return { type: 'invalid' }
    return { type: 'park', board: parked.board, storage: parked.storage, slotIndex: slot }
  }

  return { type: 'fail' }
}

/** Free board tiles that would match something currently in storage. */
export function freeTilesMatchingStorage(
  board: BoardTile[],
  storage: StorageSlots,
): BoardTile[] {
  return getFreeBoardTiles(board).filter((t) => findMatchingInStorage(t, storage) !== null)
}

export function removePair(
  board: BoardTile[],
  storage: StorageSlots,
  aId: string,
  bId: string,
): { board: BoardTile[]; storage: StorageSlots } {
  const nextBoard = board.map((t) =>
    t.id === aId || t.id === bId ? { ...t, removed: true } : t,
  )
  const nextStorage = storage.map((t) =>
    t && (t.id === aId || t.id === bId) ? null : t,
  ) as StorageSlots
  return { board: nextBoard, storage: nextStorage }
}

/** Move a free board tile into an empty storage slot. */
export function parkToStorage(
  board: BoardTile[],
  storage: StorageSlots,
  tileId: string,
  slotIndex: number,
): { board: BoardTile[]; storage: StorageSlots } | null {
  if (slotIndex < 0 || slotIndex > 3 || storage[slotIndex] !== null) return null
  const tile = board.find((t) => t.id === tileId)
  if (!tile || tile.removed || !isTileFree(tile, board)) return null

  const nextBoard = board.map((t) =>
    t.id === tileId ? { ...t, removed: true } : t,
  )
  const nextStorage = [...storage] as StorageSlots
  nextStorage[slotIndex] = { ...tile, removed: false }
  return { board: nextBoard, storage: nextStorage }
}

/** Move a stored tile into another empty storage slot. */
export function moveWithinStorage(
  storage: StorageSlots,
  tileId: string,
  toIndex: number,
): StorageSlots | null {
  if (toIndex < 0 || toIndex > 3 || storage[toIndex] !== null) return null
  const from = findStorageIndex(storage, tileId)
  if (from < 0) return null
  const next = [...storage] as StorageSlots
  next[toIndex] = next[from]
  next[from] = null
  return next
}

export function boardBounds(board: BoardTile[]): {
  minX: number
  maxX: number
  minY: number
  maxY: number
  maxZ: number
} {
  const active = board.filter((t) => !t.removed)
  if (active.length === 0) {
    return { minX: 0, maxX: 1, minY: 0, maxY: 1, maxZ: 0 }
  }
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let maxZ = 0
  for (const t of active) {
    minX = Math.min(minX, t.x)
    maxX = Math.max(maxX, t.x)
    minY = Math.min(minY, t.y)
    maxY = Math.max(maxY, t.y)
    maxZ = Math.max(maxZ, t.z)
  }
  return { minX, maxX, minY, maxY, maxZ }
}

// Backward-compatible alias
export const getFreeTiles = getFreeBoardTiles

export { overlapsXY }
