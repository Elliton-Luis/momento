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

## PWA

- `manifest.webmanifest` + `sw.js` + icons in `icons/`.
- Open the hosted or `localhost` page in Chrome/Edge/Safari → Install/Add to Home Screen.
- After the first visit the app shell works offline (cache-first for local files).

## Project structure

```text
index.html          # main screen + routine management screen
styles.css          # mobile-first minimal styling
routine.js          # activity model, localStorage persistence, time matching
main-view.js        # renders current/next activity + live clock
manage-view.js      # routine list + add/edit/delete form
app.js              # bootstrapping and view switching
sw.js               # offline cache for PWA
manifest.webmanifest
icons/              # PWA icons (SVG + PNG)
```

Time matching rule: an activity is current when `start <= now < end`. End-exclusive so back-to-back activities never overlap (e.g. `09:00` belongs to `09:00–09:30`, not `08:10–09:00`).
