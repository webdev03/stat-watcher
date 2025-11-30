import { json, type RequestHandler } from "@sveltejs/kit";
import { auth } from "$lib/auth";
import { db } from "$lib/server/db";
import { machine, statsSnapshot } from "$lib/server/db/schema";
import { latestStats } from "$lib/server/stats-store";
import { and, desc, eq } from "drizzle-orm";

// Get machine details and latest stats
export const GET: RequestHandler = async ({ request, params }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const machineId = params.id;
  if (!machineId) {
    return json({ error: "Machine ID required" }, { status: 400 });
  }

  // Get machine and verify ownership
  const machineRecord = await db.query.machine.findFirst({
    where: and(eq(machine.id, machineId), eq(machine.userId, session.user.id)),
  });

  if (!machineRecord) {
    return json({ error: "Machine not found" }, { status: 404 });
  }

  // Get latest stats from memory or database
  const memoryStats = latestStats.get(machineId);
  let currentStats = memoryStats?.stats ?? null;
  let lastUpdated = memoryStats?.timestamp ?? null;

  // If no memory stats, try to get the latest from database
  if (!currentStats) {
    const latestSnapshot = await db.query.statsSnapshot.findFirst({
      where: eq(statsSnapshot.machineId, machineId),
      orderBy: [desc(statsSnapshot.createdAt)],
    });
    if (latestSnapshot) {
      currentStats = latestSnapshot.data as typeof currentStats;
      lastUpdated = latestSnapshot.createdAt;
    }
  }

  const now = Date.now();
  const isOnline = machineRecord.lastSeen
    ? now - machineRecord.lastSeen.getTime() < 10000
    : false;

  return json({
    machine: {
      ...machineRecord,
      isOnline,
    },
    stats: currentStats,
    lastUpdated,
  });
};

// Delete a machine
export const DELETE: RequestHandler = async ({ request, params }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const machineId = params.id;
  if (!machineId) {
    return json({ error: "Machine ID required" }, { status: 400 });
  }

  // Verify ownership before deletion
  const machineRecord = await db.query.machine.findFirst({
    where: and(eq(machine.id, machineId), eq(machine.userId, session.user.id)),
  });

  if (!machineRecord) {
    return json({ error: "Machine not found" }, { status: 404 });
  }

  // Delete from database (cascades to stats)
  await db.delete(machine).where(eq(machine.id, machineId));

  // Clean up memory stats
  latestStats.delete(machineId);

  return json({ success: true });
};

// Update machine name
export const PATCH: RequestHandler = async ({ request, params }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const machineId = params.id;
  if (!machineId) {
    return json({ error: "Machine ID required" }, { status: 400 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return json({ error: "Machine name is required" }, { status: 400 });
  }

  // Verify ownership
  const machineRecord = await db.query.machine.findFirst({
    where: and(eq(machine.id, machineId), eq(machine.userId, session.user.id)),
  });

  if (!machineRecord) {
    return json({ error: "Machine not found" }, { status: 404 });
  }

  const updated = await db
    .update(machine)
    .set({ name })
    .where(eq(machine.id, machineId))
    .returning();

  return json({ machine: updated[0] });
};
