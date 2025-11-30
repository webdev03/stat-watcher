import type { Stats } from "$lib/types/stats";

// In-memory store for latest stats (for SSE streaming)
// Key: machineId, Value: { stats, timestamp, listeners }
export const latestStats = new Map<
  string,
  {
    stats: Stats;
    timestamp: Date;
    listeners: Set<(stats: Stats) => void>;
  }
>();
