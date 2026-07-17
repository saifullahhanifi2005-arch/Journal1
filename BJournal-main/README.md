# Apex Journal — Professional Forex Trading Journal ⚔️

Premium desktop-class trading journal built with React, Vite, and Tailwind CSS.

## Features

- **Command Center dashboard** with equity curve, session edge, instrument leaders
- **Full trade journal** — log, filter, edit, review, delete
- **Analytics suite** — profit factor, expectancy, pair/strategy/session breakdowns
- **Trade calendar heatmap** — daily PnL visualization
- **Strategy playbook** — codify rules and measure edge per setup
- **Mindset lab** — emotion impact, plan adherence, lessons vault
- **Live Forex News** — Finnhub + ForexFactory economic calendar (via backend)
- **Auto-Send Gmail** — email reports and Excel files automatically (via backend)
- **Local data vault** — autosave to browser storage, JSON export/import
- **Glassmorphism UI** with water-fill click buttons and premium dark theme
- **Arena** — public leaderboard with privacy-first snapshot sharing
- **Chat** — group messaging with stickers, GIFs, and trade sharing

## Quick Start

### Frontend only (works offline with seed data)

```bash
npm install
npm run dev
```

### Full-stack (live news + auto email)

```bash
# Terminal 1: Backend
cd server
npm install
npm run dev

# Terminal 2: Frontend
npm install
npm run dev
```

## Backend Setup

The backend is in the `server/` directory. It provides:
- 📡 Live forex news (Finnhub + ForexFactory)
- 📧 Gmail auto-send for reports
- ⏰ Scheduled report emails (cron)

### Live News Setup

1. Get a **free** Finnhub API key at https://finnhub.io/register
2. Edit `server/.env`:
   ```
   FINNHUB_API_KEY=your_key_here
   ```
3. Restart the backend

> Even without Finnhub, ForexFactory data works automatically (no key needed).

### Gmail Auto-Send Setup

1. Go to https://myaccount.google.com/security → Enable 2-Step Verification
2. Go to https://myaccount.google.com/apppasswords → Create App Password
3. Edit `server/.env`:
   ```
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```
4. Restart the backend

See `server/.env.example` for all configuration options.

## Production build

```bash
npm run build
npm run preview
```

## Data

All trades, strategies, and settings persist in `localStorage` under:
`apex-forex-journal-v1`

Use **Settings → Export JSON** before clearing browser data.

## Architecture

```
Frontend (React + Vite)    Backend (Express)
localhost:5173              localhost:3001
     │                           │
     ├── /api/news/*    ◄────────┤ Finnhub + ForexFactory
     ├── /api/email/*   ◄────────┤ Gmail SMTP (Nodemailer)
     └── localStorage            └── No database needed
```

- Frontend works fully offline (with seed data)
- Backend adds live news + auto email
- Your trade data is AES-256 encrypted and stays in the browser

## Brand

- App name: **Apex Journal** / **The Fools Hunting Room**
- Icon: `public/images/app-icon.png`
- Splash: `public/images/splash-bg.jpg`
- Creator: **Saifullah Hanifi**
