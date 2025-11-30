import { version_with_sha } from "bun";
import Conf from "conf";
import { getStats } from "./stats";

console.log("** stat-watcher **");
console.log(`Running on Bun ${version_with_sha}`);

const config = new Conf({ projectName: "stat-watcher-agent" });

console.log(`Configuration at ${config.path}`);

if (!config.has("url")) {
  config.set("url", "https://stat-watcher.devarsh.me/api/v1");
}

if (!config.has("token") || config.get("token") === "FILL_HERE") {
  config.set("token", "FILL_HERE");
  console.log(
    `Please fill out the token and instance URL in \`${config.path}\` - open it in a text editor and follow the instructions from the site`,
  );
  process.exit(1);
}

let stats = await getStats();

async function sendStats() {
  const url = String(config.get("url"));
  if (!url) {
    throw new Error("No/invalid URL provided in config!");
  }

  const token = String(config.get("token"));
  if (!token) {
    throw new Error("No/invalid token provided in config!");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: stats,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Uploading stats failed with ${res.status} - ${res.statusText}`,
    );
  }
}

await sendStats();

setInterval(
  async () => {
    stats = await getStats();
    await sendStats();
  },
  Number(config.get("stats_poll_interval")) || 500,
);
