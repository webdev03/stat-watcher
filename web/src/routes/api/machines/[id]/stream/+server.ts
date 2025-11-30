import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { machine } from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "$lib/auth";
import { latestStats } from "$lib/server/stats-store";
import type { Stats } from "$lib/types/stats";

export const GET: RequestHandler = async ({ request, params }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const machineId = params.id;
  if (!machineId) {
    return new Response("Machine ID required", { status: 400 });
  }

  // Verify ownership
  const machineRecord = await db.query.machine.findFirst({
    where: and(eq(machine.id, machineId), eq(machine.userId, session.user.id)),
  });

  if (!machineRecord) {
    return new Response("Machine not found", { status: 404 });
  }

  // Set up SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(encoder.encode(`event: connected\ndata: {"machineId": "${machineId}"}\n\n`));

      // Send current stats if available
      const current = latestStats.get(machineId);
      if (current) {
        controller.enqueue(
          encoder.encode(`event: stats\ndata: ${JSON.stringify(current.stats)}\n\n`),
        );
      }

      // Create listener for new stats
      const listener = (stats: Stats) => {
        try {
          controller.enqueue(encoder.encode(`event: stats\ndata: ${JSON.stringify(stats)}\n\n`));
        } catch {
          // Stream closed, will be cleaned up
        }
      };

      // Register listener
      let entry = latestStats.get(machineId);
      if (!entry) {
        entry = {
          stats: null as unknown as Stats,
          timestamp: new Date(),
          listeners: new Set(),
        };
        latestStats.set(machineId, entry);
      }
      entry.listeners.add(listener);

      // Set up heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Clean up on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        const entry = latestStats.get(machineId);
        if (entry) {
          entry.listeners.delete(listener);
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
