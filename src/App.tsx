import { useState } from 'react'
import type { Progress, Screen } from './types'
import { loadProgress } from './storage'
import { HomeScreen } from './components/HomeScreen'
import { LevelSelect } from './components/LevelSelect'
import { GameScreen } from './components/GameScreen'
import { HowToPlay } from './components/HowToPlay'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [currentLevel, setCurrentLevel] = useState(1)

  const playLevel = (level: number) => {
    setCurrentLevel(level)
    setScreen('game')
  }

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen
          progress={progress}
          onPlay={() => playLevel(Math.min(100, progress.unlockedLevel))}
          onLevels={() => setScreen('levels')}
          onHowTo={() => setScreen('how-to-play')}
        />
      )}
      {screen === 'levels' && (
        <LevelSelect
          progress={progress}
          onSelect={playLevel}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          level={currentLevel}
          progress={progress}
          onProgress={setProgress}
          onBack={() => setScreen('levels')}
          onNext={(n) => playLevel(n)}
        />
      )}
      {screen === 'how-to-play' && (
        <HowToPlay onBack={() => setScreen('home')} />
      )}
    </div>
  )
}
