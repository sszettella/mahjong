import type { BoardTile, LevelConfig } from './types'
import { mulberry32, pickPairedFaces } from './tiles'

export interface Slot {
  x: number
  y: number
  z: number
}

/** Max footprint — keeps the board readable on phones */
export const MAX_BOARD_WIDTH = 8
export const MAX_BOARD_HEIGHT = 9

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

  return clampFootprint(trimToEven(slots, tileCount), MAX_BOARD_WIDTH, MAX_BOARD_HEIGHT)
}

function takeEven(n: number): number {
  return n % 2 === 0 ? n : n - 1
}

function capWidth(n: number): number {
  return Math.min(MAX_BOARD_WIDTH, Math.max(2, n))
}

function capHeight(n: number): number {
  return Math.min(MAX_BOARD_HEIGHT, Math.max(2, n))
}

function slotsGrid(count: number, layers: number, rng: () => number): Slot[] {
  const slots: Slot[] = []
  const perLayer = Math.ceil(count / Math.max(1, layers))
  // Prefer full width, grow height up to cap, then rely on layers
  let cols = Math.ceil(Math.sqrt(perLayer * 1.15))
  cols = capWidth(cols)
  let rows = Math.ceil(perLayer / cols)
  rows = capHeight(rows)

  for (let z = 0; z < layers; z++) {
    const layerCount =
      z === layers - 1
        ? count - slots.length
        : Math.min(perLayer, count - slots.length)
    const c = Math.max(2, Math.min(cols, cols - Math.min(z, cols - 2)))
    const r = Math.max(2, Math.min(rows, MAX_BOARD_HEIGHT - Math.min(z, 2)))
    let placed = 0
    const offsetX = (cols - c) / 2
    const offsetY = (rows - r) / 2
    for (let y = 0; y < r && placed < layerCount; y++) {
      for (let x = 0; x < c && placed < layerCount; x++) {
        if (z > 0 && rng() < 0.12 && placed < layerCount - 2) continue
        slots.push({ x: x + offsetX, y: y + offsetY, z })
        placed++
      }
    }
    // Fill remaining on this layer within the height cap (stack denser via z if full)
    let y = 0
    let x = 0
    while (placed < layerCount) {
      slots.push({ x: (x % c) + offsetX, y: (y % r) + offsetY, z })
      placed++
      x++
      if (x % c === 0) y++
    }
  }
  return slots
}

function slotsPyramid(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  let remaining = count
  let size = Math.ceil(Math.sqrt(count / Math.max(1, layers * 0.7)))
  size = Math.min(capWidth(Math.max(3, size)), capHeight(Math.max(3, size)))

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
  // Fill extras within footprint (prefer higher layers via z wrapping)
  let y = 0
  let z = 0
  while (remaining > 0) {
    for (let x = 0; x < size && remaining > 0; x++) {
      slots.push({ x, y: y % size, z: Math.min(layers - 1, z) })
      remaining--
    }
    y++
    if (y % size === 0) z++
  }
  return slots
}

function slotsCross(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  // arm*2+1 must fit in both width and height caps
  let arm = Math.max(2, Math.ceil(Math.sqrt(count / layers) / 1.5))
  arm = Math.min(
    arm,
    Math.floor((MAX_BOARD_WIDTH - 1) / 2),
    Math.floor((MAX_BOARD_HEIGHT - 1) / 2),
  )
  const mid = arm
  const width = arm * 2 + 1
  const height = width

  for (let z = 0; z < layers; z++) {
    for (let x = 0; x < width; x++) {
      slots.push({ x: x + z * 0.05, y: mid + z * 0.05, z })
    }
    for (let y = 0; y < height; y++) {
      if (y === mid) continue
      slots.push({ x: mid + z * 0.05, y: y + z * 0.05, z })
    }
  }
  // Extra tiles fill within the cross bounds on higher z
  let z = 0
  let y = 0
  while (slots.length < count) {
    slots.push({ x: mid, y: y % height, z: Math.min(layers - 1, z) })
    if (slots.length < count) {
      slots.push({ x: Math.max(0, mid - 1), y: y % height, z: Math.min(layers - 1, z) })
    }
    y++
    if (y % height === 0) z++
  }
  return slots
}

function slotsDiamond(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  // diameter 2r+1 ≤ min(width, height) caps
  let radius = Math.max(2, Math.ceil(Math.sqrt(count / layers)))
  radius = Math.min(
    radius,
    Math.floor((MAX_BOARD_WIDTH - 1) / 2),
    Math.floor((MAX_BOARD_HEIGHT - 1) / 2),
  )

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
  const span = radius * 2 + 1
  let i = 0
  while (slots.length < count) {
    const x = i % span
    const y = Math.floor(i / span) % span
    const z = Math.min(layers - 1, Math.floor(i / (span * span)))
    slots.push({ x, y, z })
    i++
  }
  return slots
}

function slotsTurtle(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  // body + pads for feet/head/tail must fit width & height caps
  let bodyW = Math.max(4, Math.ceil(Math.sqrt(count * 0.55)))
  bodyW = Math.min(bodyW, MAX_BOARD_WIDTH - 2)
  let bodyH = Math.max(3, Math.ceil(bodyW * 0.7))
  bodyH = Math.min(bodyH, MAX_BOARD_HEIGHT - 3) // head + tail rows
  const ox0 = 1

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

  const midX = ox0 + bodyW / 2
  const maxY = bodyH + 2 // within height budget
  slots.push({ x: midX, y: 0, z: 0 })
  if (count > 20) slots.push({ x: midX - 0.5, y: 0, z: 0 })
  slots.push({ x: midX, y: Math.min(MAX_BOARD_HEIGHT - 1, maxY), z: 0 })
  slots.push({ x: 0, y: 1, z: 0 })
  slots.push({ x: Math.min(MAX_BOARD_WIDTH - 1, bodyW + 1), y: 1, z: 0 })
  slots.push({ x: 0, y: bodyH + 1, z: 0 })
  slots.push({
    x: Math.min(MAX_BOARD_WIDTH - 1, bodyW + 1),
    y: Math.min(MAX_BOARD_HEIGHT - 1, bodyH + 1),
    z: 0,
  })

  let i = 0
  while (slots.length < count) {
    const x = ox0 + (i % bodyW)
    const y = 1 + (Math.floor(i / bodyW) % bodyH)
    const z = Math.min(layers - 1, Math.floor(i / (bodyW * bodyH)))
    slots.push({ x, y, z })
    i++
  }
  return slots
}

function slotsFortress(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  let size = Math.max(4, Math.ceil(Math.sqrt(count / Math.max(1, layers))))
  size = Math.min(capWidth(size), capHeight(size))

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
  let i = 0
  while (slots.length < count) {
    const x = i % size
    const y = Math.floor(i / size) % size
    const z = Math.min(layers - 1, Math.floor(i / (size * size)))
    slots.push({ x, y, z })
    i++
  }
  return slots
}

function slotsSpiral(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  let size = Math.max(4, Math.ceil(Math.sqrt(count / layers)))
  size = Math.min(capWidth(size), capHeight(size))

  for (let z = 0; z < layers; z++) {
    let x = 0
    let y = 0
    let dx = 1
    let dy = 0
    let segment = 1
    let passed = 0
    const max = size * size

    for (let i = 0; i < max && slots.length < count; i++) {
      const px = Math.min(MAX_BOARD_WIDTH - 1, Math.max(0, x + z * 0.05))
      const py = Math.min(MAX_BOARD_HEIGHT - 1, Math.max(0, y + z * 0.05))
      slots.push({ x: px, y: py, z })
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
  let i = 0
  while (slots.length < count) {
    const x = i % size
    const y = Math.floor(i / size) % size
    const z = Math.min(layers - 1, Math.floor(i / (size * size)))
    slots.push({ x, y, z })
    i++
  }
  return slots
}

function slotsBridge(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  const span = MAX_BOARD_WIDTH
  const towerH = Math.max(3, Math.min(MAX_BOARD_HEIGHT - 1, Math.ceil(count / (layers * 6))))

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
      if (z === 0 && deckY + 1 < MAX_BOARD_HEIGHT) {
        slots.push({ x, y: deckY + 1, z })
      }
    }
  }
  let i = 0
  while (slots.length < count) {
    const x = i % span
    const y = Math.floor(i / span) % MAX_BOARD_HEIGHT
    const z = Math.min(layers - 1, Math.floor(i / (span * MAX_BOARD_HEIGHT)))
    slots.push({ x, y, z })
    i++
  }
  return slots
}

/**
 * Ensure all slots fit in maxW × maxH (tile footprint).
 * Shifts to origin; re-bins axes that exceed the caps.
 */
function clampFootprint(slots: Slot[], maxW: number, maxH: number): Slot[] {
  if (slots.length === 0) return slots

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const s of slots) {
    minX = Math.min(minX, s.x)
    maxX = Math.max(maxX, s.x)
    minY = Math.min(minY, s.y)
    maxY = Math.max(maxY, s.y)
  }

  let result = slots.map((s) => ({
    ...s,
    x: s.x - minX,
    y: s.y - minY,
  }))

  const spanX = maxX - minX
  const spanY = maxY - minY

  if (spanX > maxW - 1 + 1e-6) {
    result = result.map((s) => ({
      ...s,
      x: Math.min(maxW - 1, Math.round((s.x / spanX) * (maxW - 1))),
    }))
  }
  if (spanY > maxH - 1 + 1e-6) {
    result = result.map((s) => ({
      ...s,
      y: Math.min(maxH - 1, Math.round((s.y / spanY) * (maxH - 1))),
    }))
  }
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
