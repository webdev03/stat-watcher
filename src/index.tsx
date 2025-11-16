import { serve } from "@hono/node-server";
import { version_with_sha } from "bun";
import { Hono } from "hono";
import { Server } from "socket.io";
import { Dashboard } from "./dashboard";
import { getStats } from "./stats";

let stats = await getStats();
setInterval(async () => {
  stats = await getStats();
  io.emit("data", stats);
}, Number(process.env.STATS_INTERVAL) || 500);

const PORT = Number(process.env.STAT_WATCHER_PORT) || 24_957;

const app = new Hono();

app.get("/", (c) => c.html(<Dashboard />));

app.get("/api/v1", (c) => c.json(stats));

const server = serve({
  port: PORT,
  fetch: app.fetch,
});

const io = new Server(server, {
  serveClient: true,
});

io.on("connection", (socket) => {
  socket.emit("data", stats);
});

console.log("** stat-watcher **");
console.log(`Running on Bun ${version_with_sha}`);
