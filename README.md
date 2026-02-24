# Eczema Tracker

A 14-day eczema healing protocol tracker. Log daily symptoms, diet compliance, itch levels, and body area responses.

## Running the app

### Option 1 — Double-click (easiest)

1. Make sure [Node.js](https://nodejs.org) is installed
2. Double-click `start.command` in Finder
3. Terminal opens, the app builds automatically, and your browser opens to `http://localhost:3001`

On the first launch it installs dependencies and builds the frontend — this takes ~30 seconds. Subsequent launches start in under a second.

To stop the app, close the Terminal window.

### Option 2 — Terminal

```bash
npm install       # first time only
npm run build     # first time only
node server.js
```

Then open `http://localhost:3001` in your browser.

---

## Stack
- React 18 + Vite (frontend)
- Express (backend API)
- JSON file storage (local, inside `data/`)

## Requirements
- Node.js 18 or later — download from [nodejs.org](https://nodejs.org) or install via Homebrew: `brew install node`
