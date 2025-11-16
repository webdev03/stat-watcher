# stat-watcher

A lightweight Bun-powered service that streams live system vitals via Socket.IO and renders them in a polished, configurable dashboard.

## Dashboard usage

1. Install dependencies (once):

   ```bash
   bun install
   ```

2. Start the watcher:

   ```bash
   bun run start
   ```

   The server listens on port `24957` by default (override with `STAT_WATCHER_PORT`).

3. Open the dashboard at [http://localhost:24957/](http://localhost:24957/).

### Features

- **Responsive tiles** – CPU, memory, thermals, storage, and battery stats auto-arrange across mobile and desktop breakpoints.
- **Live data** – Tiles update in real time over Socket.IO and show connection/last-update indicators.
- **Customization** – Toggle tiles, adjust density, switch light/dark/system themes, and tweak per-tile options (e.g., memory metric, CPU temp thresholds, storage volume count). Preferences persist in `localStorage` and can be reset from the settings drawer.
- **Accessibility-friendly** – Supports reduced-motion users, keyboard navigation for the customization drawer, and clearly labeled meters/pills.

## Development

These steps are for hacking on stat-watcher itself:

```bash
bun install
bun run dev   # hot reload server
```

The production binary can be built with `bun run build`, which emits `dist/stat-watcher`.
