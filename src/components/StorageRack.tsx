import type { StorageSlots } from '../types'
import { STORAGE_SAFE_MAX, STORAGE_SIZE } from '../types'
import { faceKey } from '../tiles'
import { TileFaceContent } from './TileFace'

/** Fixed storage tile size — independent of board layout width */
export const STORAGE_TILE_W = 44
export const STORAGE_TILE_H = Math.round(STORAGE_TILE_W * 1.28) // ~56
const SLOT_GAP = 8

interface Props {
  storage: StorageSlots
  hintIds: string[]
  matchingIds?: string[]
  parkFlashId?: string | null
  failed?: boolean
}

export function StorageRack({
  storage,
  hintIds,
  matchingIds = [],
  parkFlashId = null,
  failed,
}: Props) {
  const filled = storage.filter(Boolean).length
  const matchSet = new Set(matchingIds)
  const atLimit = filled >= STORAGE_SAFE_MAX

  const slotW = STORAGE_TILE_W
  const slotH = STORAGE_TILE_H
  const rackWidth = slotW * STORAGE_SIZE + SLOT_GAP * (STORAGE_SIZE - 1)

  const slotStyle = {
    width: slotW,
    height: slotH,
    minWidth: slotW,
    minHeight: slotH,
    maxWidth: slotW,
    maxHeight: slotH,
  }

  return (
    <div
      className={[
        'storage-rack',
        failed ? 'storage-full-fail' : '',
        atLimit ? 'storage-at-limit' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label={`Storage, ${filled} of ${STORAGE_SAFE_MAX} safe slots. A 4th tile fails the level.`}
    >
      <div className="storage-label" style={{ width: rackWidth, maxWidth: '100%' }}>
        <span>Storage</span>
        <span className={`storage-count ${atLimit ? 'at-limit' : ''}`}>
          {filled}/{STORAGE_SAFE_MAX}
          <span className="storage-fail-hint"> · 4th fails</span>
        </span>
      </div>
      <div
        className="storage-slots"
        style={{
          width: rackWidth,
          maxWidth: '100%',
          gap: SLOT_GAP,
        }}
      >
        {Array.from({ length: STORAGE_SIZE }, (_, i) => {
          const tile = storage[i]
          const isDangerSlot = i === STORAGE_SAFE_MAX

          if (tile) {
            const hinted = hintIds.includes(tile.id)
            const matching = matchSet.has(tile.id)
            const justParked = parkFlashId === tile.id
            return (
              <div
                key={tile.id}
                className={[
                  'mahjong-tile',
                  'storage-tile',
                  'free',
                  'storage-tile-static',
                  hinted ? 'hinted' : '',
                  matching ? 'is-matching-out' : '',
                  justParked ? 'just-parked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={slotStyle}
                aria-label={`${tile.face.label} in storage`}
                data-face={faceKey(tile.face)}
                data-tile-id={tile.id}
              >
                <TileFaceContent tile={tile} />
                {matching && <span className="tile-match-glow" aria-hidden />}
              </div>
            )
          }

          return (
            <div
              key={`empty-${i}`}
              className={[
                'storage-slot-empty',
                isDangerSlot ? 'storage-slot-danger' : '',
                atLimit && isDangerSlot ? 'storage-slot-danger-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={slotStyle}
              aria-label={
                isDangerSlot
                  ? 'Danger slot — parking a 4th tile fails the level'
                  : `Empty storage slot ${i + 1}`
              }
            >
              <span className="slot-plus">{isDangerSlot ? '!' : '+'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
