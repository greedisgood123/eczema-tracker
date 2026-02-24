# Changelog

All notable changes to Eczema Tracker will be documented here.

## [1.1.0] - 2026-02-24

### Added
- Per-day photo uploads — attach skin photos to any day's journal entry
- `data/photos/` directory auto-created on server start
- `POST /api/day/:day/photo` endpoint (multipart upload via multer)
- `DELETE /api/day/:day/photo/:filename` endpoint (removes file from disk and JSON)
- `/photos` static file route served by Express
- `/photos` proxy in Vite dev config
- 3-column thumbnail grid in the Journal view with × delete overlay on each photo
- "Add Photo" button triggers hidden file input
- Photo strip (up to 3 thumbnails + "+N" overflow badge) in the Progress view's Past Entries cards

### Dependencies
- Added `multer ^1.4.5-lts.1`

---

## [1.0.0] - Initial release

### Added
- 14-day Ramadan gut reset protocol tracker
- Day selector (pills 1–14) with today indicator
- Journal view with:
  - Itch level slider (1–10)
  - Overall feeling slider (1–10)
  - Symptom multi-select (Itching, Redness, Dry/Flaky, Cracking, Oozing, Swelling, New patches, Sleep disruption, Headache, Bloating)
  - Body area severity sliders (Face/Neck, Arms/Hands, Legs/Feet, Torso/Back)
  - Diet & protocol checklist (15 items)
  - Suhoor and Iftar meal text fields
  - Notes textarea
  - Save entry (persists to `data/eczema-data.json`)
- Expected view — per-day protocol milestone and phase description
- Progress view — itch level bar chart, days/hours stats, Past Entries list
- Protocol start date picker with auto-calculation of current day
- Express REST API (`/api/data`, `/api/start-date`, `/api/day/:day`)
- JSON file-based persistence in `data/`
- React 18 + Vite frontend, Express backend
