import type { BoardTile, LevelConfig } from './types'
import { mulberry32, pickPairedFaces } from './tiles'

export interface Slot {
  x: number
  y: number
  z: number
}

/** Max tiles across — keeps the board readable on phones */
export const MAX_BOARD_WIDTH = 8

/** Generate position slots for a level layout. */
export function generateSlots(config: LevelConfig): Slot[] {
  const { tileCount, layers, layout, level } = config
  const rng = mulberry32(level * 7919 + 42)

  let slots: Slot[]
  switch (layout) {
    case 'grid':
      slots = slotsGrid(tileCount, layers, rng)
      break
    case 'pyramid':
      slots = slotsPyramid(tileCount, layers, rng)
      break
    case 'cross':
      slots = slotsCross(tileCount, layers, rng)
      break
    case 'diamond':
      slots = slotsDiamond(tileCount, layers, rng)
      break
    case 'turtle':
      slots = slotsTurtle(tileCount, layers, rng)
      break
    case 'fortress':
      slots = slotsFortress(tileCount, layers, rng)
      break
    case 'spiral':
      slots = slotsSpiral(tileCount, layers, rng)
      break
    case 'bridge':
      slots = slotsBridge(tileCount, layers, rng)
      break
    default:
      slots = slotsGrid(tileCount, layers, rng)
  }

  return clampWidth(trimToEven(slots, tileCount), MAX_BOARD_WIDTH)
}

function takeEven(n: number): number {
  return n % 2 === 0 ? n : n - 1
}

function capWidth(n: number): number {
  return Math.min(MAX_BOARD_WIDTH, Math.max(2, n))
}

function slotsGrid(count: number, layers: number, rng: () => number): Slot[] {
  const slots: Slot[] = []
  const perLayer = Math.ceil(count / layers)
  // Prefer wider layouts up to the cap, then grow rows
  let cols = Math.ceil(Math.sqrt(perLayer * 1.2))
  cols = capWidth(cols)
  let rows = Math.ceil(perLayer / cols)

  for (let z = 0; z < layers; z++) {
    const layerCount =
      z === layers - 1
        ? count - slots.length
        : Math.min(perLayer, count - slots.length)
    const c = Math.max(2, Math.min(cols, cols - Math.min(z, cols - 2)))
    const r = Math.max(2, rows + Math.floor(z > 0 ? (perLayer - c * rows) / Math.max(1, c) : 0) + Math.floor(z / 2))
    let placed = 0
    const offsetX = (cols - c) / 2
    const offsetY = 0
    for (let y = 0; y < r && placed < layerCount; y++) {
      for (let x = 0; x < c && placed < layerCount; x++) {
        if (z > 0 && rng() < 0.12 && placed < layerCount - 2) continue
        slots.push({ x: x + offsetX, y: y + offsetY, z })
        placed++
      }
    }
    // If still short on this layer, add more rows within width
    let extraY = r
    while (placed < layerCount) {
      for (let x = 0; x < c && placed < layerCount; x++) {
        slots.push({ x: x + offsetX, y: extraY, z })
        placed++
      }
      extraY++
    }
  }
  return slots
}

function slotsPyramid(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  let remaining = count
  let size = Math.ceil(Math.sqrt(count / Math.max(1, layers * 0.7)))
  size = capWidth(Math.max(3, size))

  for (let z = 0; z < layers && remaining > 0; z++) {
    const s = Math.max(1, size - z)
    const offset = (size - s) / 2
    for (let y = 0; y < s && remaining > 0; y++) {
      for (let x = 0; x < s && remaining > 0; x++) {
        slots.push({ x: x + offset, y: y + offset, z })
        remaining--
      }
    }
  }
  // Fill extras downward within width
  let y = size
  while (remaining > 0) {
    for (let x = 0; x < size && remaining > 0; x++) {
      slots.push({ x, y, z: 0 })
      remaining--
    }
    y++
  }
  return slots
}

function slotsCross(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  // arm*2+1 must be ≤ MAX_BOARD_WIDTH
  let arm = Math.max(2, Math.ceil(Math.sqrt(count / layers) / 1.5))
  arm = Math.min(arm, Math.floor((MAX_BOARD_WIDTH - 1) / 2))
  const mid = arm
  const width = arm * 2 + 1

  for (let z = 0; z < layers; z++) {
    for (let x = 0; x < width; x++) {
      slots.push({ x: x + z * 0.05, y: mid + z * 0.05, z })
    }
    for (let y = 0; y < width; y++) {
      if (y === mid) continue
      slots.push({ x: mid + z * 0.05, y: y + z * 0.05, z })
    }
  }
  // Extra tiles as additional cross arms downward if needed
  let extra = 0
  while (slots.length < count) {
    const y = width + extra
    slots.push({ x: mid, y, z: 0 })
    if (slots.length < count) slots.push({ x: Math.max(0, mid - 1), y, z: 0 })
    extra++
  }
  return slots
}

function slotsDiamond(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  // diameter 2r+1 ≤ MAX_BOARD_WIDTH
  let radius = Math.max(2, Math.ceil(Math.sqrt(count / layers)))
  radius = Math.min(radius, Math.floor((MAX_BOARD_WIDTH - 1) / 2))

  for (let z = 0; z < layers; z++) {
    const r = Math.max(1, radius - Math.floor(z / 2))
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (Math.abs(x) + Math.abs(y) <= r) {
          slots.push({ x: x + radius, y: y + radius + z * 0.05, z })
        }
      }
    }
  }
  let y = radius * 2 + 1
  while (slots.length < count) {
    for (let x = 0; x <= radius * 2 && slots.length < count; x++) {
      slots.push({ x, y, z: 0 })
    }
    y++
  }
  return slots
}

function slotsTurtle(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  // body + 1 pad each side for feet → bodyW ≤ MAX_BOARD_WIDTH - 2
  let bodyW = Math.max(4, Math.ceil(Math.sqrt(count * 0.55)))
  bodyW = Math.min(bodyW, MAX_BOARD_WIDTH - 2)
  const bodyH = Math.max(3, Math.ceil(bodyW * 0.7))
  const ox0 = 1 // leave column 0 for left feet

  for (let z = 0; z < Math.min(layers, 4); z++) {
    const w = Math.max(2, bodyW - z * 2)
    const h = Math.max(1, bodyH - z)
    const ox = ox0 + (bodyW - w) / 2
    const oy = 1 + (bodyH - h) / 2
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        slots.push({ x: ox + x, y: oy + y, z })
      }
    }
  }

  // Head / tail / feet within width
  const midX = ox0 + bodyW / 2
  slots.push({ x: midX, y: 0, z: 0 })
  if (count > 20) slots.push({ x: midX - 0.5, y: 0, z: 0 })
  slots.push({ x: midX, y: bodyH + 2, z: 0 })
  slots.push({ x: 0, y: 1, z: 0 })
  slots.push({ x: Math.min(MAX_BOARD_WIDTH - 1, bodyW + 1), y: 1, z: 0 })
  slots.push({ x: 0, y: bodyH + 1, z: 0 })
  slots.push({ x: Math.min(MAX_BOARD_WIDTH - 1, bodyW + 1), y: bodyH + 1, z: 0 })

  let y = bodyH + 3
  while (slots.length < count) {
    for (let x = 0; x < bodyW && slots.length < count; x++) {
      slots.push({ x: ox0 + x, y, z: 0 })
    }
    y++
  }
  return slots
}

function slotsFortress(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  let size = Math.max(4, Math.ceil(Math.sqrt(count / Math.max(1, layers))))
  size = capWidth(size)

  for (let z = 0; z < layers; z++) {
    const s = Math.max(2, size - z)
    const offset = (size - s) / 2
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const isEdge = x === 0 || y === 0 || x === s - 1 || y === s - 1
        if (z >= layers - 1 || isEdge || (z > 0 && z % 2 === 1)) {
          if (z < layers - 1 && !isEdge && z % 2 === 0) continue
          slots.push({ x: x + offset, y: y + offset, z })
        }
      }
    }
  }
  let y = size
  while (slots.length < count) {
    for (let x = 0; x < size && slots.length < count; x++) {
      slots.push({ x, y, z: 0 })
    }
    y++
  }
  return slots
}

function slotsSpiral(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  let size = Math.max(4, Math.ceil(Math.sqrt(count / layers)))
  size = capWidth(size)

  for (let z = 0; z < layers; z++) {
    let x = 0
    let y = 0
    let dx = 1
    let dy = 0
    let segment = 1
    let passed = 0
    const max = size * size
    // Keep spiral inside [0, size)
    const ox = 0
    const oy = 0

    for (let i = 0; i < max && slots.length < count; i++) {
      const px = Math.min(MAX_BOARD_WIDTH - 1, Math.max(0, x + ox + z * 0.05))
      slots.push({ x: px, y: y + oy + z * 0.05, z })
      x += dx
      y += dy
      passed++
      if (passed === segment) {
        passed = 0
        const tmp = dx
        dx = -dy
        dy = tmp
        if (dy === 0) segment++
      }
    }
  }
  let y = size
  while (slots.length < count) {
    for (let x = 0; x < size && slots.length < count; x++) {
      slots.push({ x, y, z: 0 })
    }
    y++
  }
  return slots
}

function slotsBridge(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  // span is total width including towers
  const span = MAX_BOARD_WIDTH
  const towerH = Math.max(3, Math.min(8, Math.ceil(count / (layers * 6))))

  for (let z = 0; z < layers; z++) {
    for (let y = 0; y < towerH; y++) {
      slots.push({ x: 0, y, z })
      slots.push({ x: 1, y, z })
      slots.push({ x: span - 2, y, z })
      slots.push({ x: span - 1, y, z })
    }
    const deckY = Math.floor(towerH / 2)
    for (let x = 2; x < span - 2; x++) {
      slots.push({ x, y: deckY, z })
      if (z === 0) slots.push({ x, y: deckY + 1, z })
    }
  }
  let y = towerH
  while (slots.length < count) {
    for (let x = 0; x < span && slots.length < count; x++) {
      slots.push({ x, y, z: 0 })
    }
    y++
  }
  return slots
}

/**
 * Ensure all slots fit in [0, maxW) in x (span of distinct columns ≤ maxW).
 * Integer-snaps after shift; if still too wide, re-bins into maxW columns.
 */
function clampWidth(slots: Slot[], maxW: number): Slot[] {
  if (slots.length === 0) return slots

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  for (const s of slots) {
    minX = Math.min(minX, s.x)
    maxX = Math.max(maxX, s.x)
    minY = Math.min(minY, s.y)
  }

  // Shift to origin
  let result = slots.map((s) => ({
    ...s,
    x: s.x - minX,
    y: s.y - minY,
  }))

  maxX = maxX - minX
  // Occupied width in grid units (tiles are ~1 unit wide)
  const span = maxX // max x value after shift
  if (span <= maxW - 1 + 1e-6) {
    return result
  }

  // Re-bin x into maxW columns while preserving relative order
  result = result.map((s) => ({
    ...s,
    x: Math.min(maxW - 1, Math.round((s.x / span) * (maxW - 1))),
  }))
  return result
}

function trimToEven(slots: Slot[], count: number): Slot[] {
  let target = takeEven(Math.min(count, slots.length))
  if (slots.length < target) {
    target = takeEven(slots.length)
  }
  const sorted = [...slots].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x)
  let result = sorted.slice(0, target)
  if (result.length % 2 !== 0) result = result.slice(0, -1)
  return result
}

/**
 * Build a playable board: place paired faces on slots.
 */
export function createBoard(config: LevelConfig): BoardTile[] {
  const slots = generateSlots(config)
  const count = slots.length - (slots.length % 2)
  const usedSlots = slots.slice(0, count)
  const rng = mulberry32(config.level * 9973 + 17)
  const faces = pickPairedFaces(count, rng)

  return usedSlots.map((slot, i) => ({
    id: `t-${config.level}-${i}`,
    face: faces[i],
    x: slot.x,
    y: slot.y,
    z: slot.z,
    removed: false,
  }))
}
