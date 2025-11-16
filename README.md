# stat-watcher

A lightweight [Bun](https://bun.sh)-powered service that streams live system vitals via Socket.IO and renders them in a polished, configurable dashboard.

TODO: this doesn't actually work yet btw!

## Dashboard usage

1. Install dependencies (once):

   ```bash
   bun install
   ```

2. Start the server:

   ```bash
   bun run start
   ```

   The server listens on port `24957` by default (override with `STAT_WATCHER_PORT`).

3. Open the dashboard at [http://localhost:24957/](http://localhost:24957/).

## Development

These steps are for developng stat-watcher itself:

```bash
bun install
bun run dev   # hot reload server
```

The production binary can be built with `bun run build`, which emits `dist/stat-watcher`.
