import { json, type RequestHandler } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { machine } from "$lib/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "$lib/auth";

// Get all machines for authenticated user
export const GET: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const machines = await db.query.machine.findMany({
    where: eq(machine.userId, session.user.id),
    orderBy: [desc(machine.createdAt)],
  });

  // Add online status (considered online if seen in last 10 seconds)
  const now = Date.now();
  const machinesWithStatus = machines.map((m) => ({
    ...m,
    isOnline: m.lastSeen ? now - m.lastSeen.getTime() < 10000 : false,
  }));

  return json({ machines: machinesWithStatus });
};

// Create a new machine
export const POST: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
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

  // Generate a secure token for the agent
  const token = `sw_${nanoid(32)}`;

  const newMachine = await db
    .insert(machine)
    .values({
      id: nanoid(),
      userId: session.user.id,
      name,
      token,
    })
    .returning();

  return json({
    machine: newMachine[0],
    // Only return the token once during creation
    token,
  });
};
