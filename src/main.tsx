import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Install / update service worker so the game works fully offline after first load
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    // Check for updates periodically while the app is open
    if (registration) {
      window.setInterval(() => {
        void registration.update()
      }, 60 * 60 * 1000)
    }
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
