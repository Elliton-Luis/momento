# Momento

Minimalist routine viewer. Answers a single question: **what should I be doing right now?**

Open the app → see the current activity → close the app.

## How it works

- You register a daily routine: activities with start time, end time, name and optional description.
- The main screen shows **only the activity matching the current device time**, with time range, name and description.
- The next activity appears discreetly below for context.
- When nothing is scheduled now, the screen says so and shows the next activity, if any.
- The clock updates every second. No checkboxes, no completion tracking.

## Features

- Minimalist main screen (current activity + discreet next activity + live clock).
- Routine management: add, edit, delete and list activities in chronological order.
- Native clock picker when tapping a time field (mobile-friendly).
- Import from Markdown/TXT and JSON export/import (manage area only).
- Contemplative light and dark themes with a manual toggle (☾/☀), persisted locally.
  Without a stored choice, the system preference applies.
- Local persistence with `localStorage` — no backend, no account.
- Mobile-first, works on desktop.
- Installable PWA (manifest + service worker, offline cache).

## Run locally

A static server is required (ES modules and service worker do not work over `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No dependencies, no build step.

## Import and export

Import/export buttons live only in the routine management area. The main screen is untouched.

### Markdown / TXT import

Each line may define one activity. Supported (and equivalent) forms:

```markdown
## Morning

- **06:30** — ☀️ Wake up
- **06:40–07:20** — ✝️ Daily liturgy
- 07:20-07:40: 🙏 Prayer | silent contemplation
- *08:10–09:00* — 📖 Philosophy
```

Rules:

- Bullets (`-`, `*`, `+`, `1.`), `**bold**`, and `-`, `–`, `—`, `:` separators are all accepted.
- A lone start time (`06:30 — Wake up`) ends when the next activity starts.
- `|` after the name introduces the optional description.
- Headings and blank lines are ignored. Lines that look like activities but cannot be parsed are listed to you — never dropped silently.
- Importing replaces the current routine only after you confirm. Cancelling keeps everything.

### JSON export / import

`Exportar JSON` downloads the current routine as `momento-rotina.json`:

```json
{
  "activities": [
    {
      "start": "09:00",
      "end": "09:30",
      "name": "Treino de raciocínio",
      "description": "Matemática, lógica ou ocasionalmente xadrez"
    }
  ]
}
```

The file carries only `start`, `end`, `name` and `description` — no internal ids.
`Importar JSON` accepts files in this shape (or a bare `[...]` list), validates every activity and refuses the whole file — keeping your current routine — if anything is invalid.

## PWA

- `manifest.webmanifest` + `sw.js` + icons in `icons/`.
- Open the hosted or `localhost` page in Chrome/Edge/Safari → Install/Add to Home Screen.
- After the first visit the app shell works offline (cache-first for local files).

## Project structure

```text
index.html          # main screen + routine management screen
styles.css          # mobile-first styling, light/dark themes
routine.js          # activity model, localStorage persistence, time matching
theme.js            # light/dark resolution, manual toggle, preference storage
transfer.js         # Markdown/TXT import, JSON export/import
main-view.js        # renders current/next activity + live clock
manage-view.js      # routine list + add/edit/delete form + transfer wiring
app.js              # bootstrapping and view switching
sw.js               # offline cache for PWA
manifest.webmanifest
icons/              # PWA icons (SVG + PNG)
```

Time matching rule: an activity is current when `start <= now < end`. End-exclusive so back-to-back activities never overlap (e.g. `09:00` belongs to `09:00–09:30`, not `08:10–09:00`).
