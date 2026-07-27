# Mahjong Solitaire

Mobile-first Mahjong Solitaire for iPhone — **100 levels, no ads, works offline**.

## Play offline on iPhone (recommended)

The game is a **Progressive Web App (PWA)**. After one visit, Safari caches it on your phone.

1. Open the live site in **Safari** (not Chrome):  
   **https://sszettella.github.io/mahjong/**
2. Tap **Share** → **Add to Home Screen**
3. Open **Mahjong** from your home screen anytime — **no Wi‑Fi required** after that first load

Progress is stored on your device (`localStorage`). There are no ads and no accounts.

## Local development

```bash
npm install
npm run dev -- --host   # phone on same Wi‑Fi can use the Network URL
```

### Test offline mode on your machine

```bash
npm run build
npm run preview:offline
```

Open the preview URL once online, then turn off the network and reload — the service worker serves the app from cache.

### Build for GitHub Pages

```bash
npm run build:pages   # sets base path to /mahjong/
```

Pushing to `main` deploys automatically via GitHub Actions (`.github/workflows/deploy-pages.yml`).

## Game rules (short)

- Tap a **free** tile
- If it **matches** something in storage → both clear (with animation)
- Else it **parks** in storage (safe for 3 tiles)
- A **4th** tile into storage with no match → level fails

## Stack

React 19 · TypeScript · Vite · vite-plugin-pwa (Workbox)
