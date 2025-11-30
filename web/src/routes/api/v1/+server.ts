import { json, type RequestHandler } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { machine } from "$lib/server/db/schema";
import { latestStats } from "$lib/server/stats-store";
import type { StatsPayload } from "$lib/types/stats";
import { eq } from "drizzle-orm";

export const POST: RequestHandler = async ({ request }) => {
  // Get bearer token from Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json(
      { error: "Missing or invalid authorization header" },
      { status: 401 },
    );
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  // Find machine by token
  const machineRecord = await db.query.machine.findFirst({
    where: eq(machine.token, token),
  });

  if (!machineRecord) {
    return json({ error: "Invalid token" }, { status: 401 });
  }

  // Parse stats payload
  let payload: StatsPayload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.data) {
    return json({ error: "Missing data field" }, { status: 400 });
  }

  const now = new Date();

  // Update last seen timestamp
  await db
    .update(machine)
    .set({ lastSeen: now })
    .where(eq(machine.id, machineRecord.id));

  // Store stats in memory for real-time streaming
  const existingEntry = latestStats.get(machineRecord.id);
  if (existingEntry) {
    existingEntry.stats = payload.data;
    existingEntry.timestamp = now;
    // Notify all listeners
    existingEntry.listeners.forEach((listener) => listener(payload.data));
  } else {
    latestStats.set(machineRecord.id, {
      stats: payload.data,
      timestamp: now,
      listeners: new Set(),
    });
  }

  return json({ success: true });
};
