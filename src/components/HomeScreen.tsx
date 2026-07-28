import { useEffect, useRef, useState } from 'react'
import type { Progress } from '../types'
import { totalStars } from '../storage'

interface Props {
  progress: Progress
  onPlay: () => void
  onLevels: () => void
  onHowTo: () => void
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  )
}

export function HomeScreen({ progress, onPlay, onLevels, onHowTo }: Props) {
  const completed = progress.completedLevels.length
  const stars = totalStars(progress)
  const continueLevel = Math.min(100, progress.unlockedLevel)
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [installed, setInstalled] = useState(false)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const screenRef = useRef<HTMLDivElement>(null)
  const installHelpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInstalled(isStandalone())
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    if (!showInstallHelp) return
    // Wait a frame so the panel is laid out, then scroll it fully into view
    const id = window.requestAnimationFrame(() => {
      installHelpRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
      // Also nudge the screen container so short phones show the full card
      const screen = screenRef.current
      const help = installHelpRef.current
      if (screen && help) {
        const helpBottom = help.offsetTop + help.offsetHeight + 24
        const visible = screen.scrollTop + screen.clientHeight
        if (helpBottom > visible) {
          screen.scrollTo({
            top: helpBottom - screen.clientHeight,
            behavior: 'smooth',
          })
        }
      }
    })
    return () => window.cancelAnimationFrame(id)
  }, [showInstallHelp])

  const toggleInstallHelp = () => {
    setShowInstallHelp((v) => !v)
  }

  return (
    <div
      ref={screenRef}
      className={[
        'screen',
        'home-screen',
        showInstallHelp ? 'home-screen-expanded' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="home-hero">
        <div className="home-ornament" aria-hidden>
          <span>🀄</span>
        </div>
        <h1 className="home-title">Mahjong</h1>
        <p className="home-subtitle">Solitaire · 100 Levels · No Ads</p>
      </div>

      <div className="status-row">
        <span className={`status-chip ${online ? 'online' : 'offline'}`}>
          {online ? 'Online' : 'Offline · ready'}
        </span>
        {installed && <span className="status-chip installed">Home Screen</span>}
      </div>

      <div className="home-stats">
        <div className="stat-pill">
          <span className="stat-value">{completed}</span>
          <span className="stat-label">Cleared</span>
        </div>
        <div className="stat-pill">
          <span className="stat-value">{stars}</span>
          <span className="stat-label">Stars</span>
        </div>
        <div className="stat-pill">
          <span className="stat-value">{continueLevel}</span>
          <span className="stat-label">Level</span>
        </div>
      </div>

      <div className="home-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={onPlay}>
          {completed === 0 ? 'Start Level 1' : `Continue · Level ${continueLevel}`}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onLevels}>
          All Levels
        </button>
        <button type="button" className="btn btn-ghost" onClick={onHowTo}>
          How to Play
        </button>
        {!installed && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleInstallHelp}
            aria-expanded={showInstallHelp}
          >
            Install for Offline
          </button>
        )}
      </div>

      {showInstallHelp && !installed && (
        <div ref={installHelpRef} className="install-help" tabIndex={-1}>
          <h3>Play anywhere, even offline</h3>
          <div className="install-icon-preview" aria-hidden>
            <img src={`${import.meta.env.BASE_URL}apple-touch-icon.png?v=3`} alt="" width={72} height={72} />
          </div>
          <ol>
            <li>
              Use <strong>Safari</strong> (not Chrome) — only Safari installs the real app icon
            </li>
            <li>
              Open exactly:{' '}
              <strong className="install-url">sszettella.github.io/mahjong/</strong>
            </li>
            <li>
              Delete any old <strong>Mahjong</strong> icon from your Home Screen first
            </li>
            <li>
              Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
            </li>
            <li>
              Confirm the preview shows the green tile icon, then tap <strong>Add</strong>
            </li>
          </ol>
          <p className="install-note">
            First open caches the game offline. If the icon is still a screenshot, force-quit Safari,
            reopen the link above, and add again.
          </p>
        </div>
      )}

      <p className="home-footer">Free forever · Progress saved on this device · No ads</p>
    </div>
  )
}
