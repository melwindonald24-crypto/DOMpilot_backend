import { config } from "./config.js";
import { createApp } from "./app.js";

const app = createApp();

const server = app.listen(config.port, () => {
  console.info(JSON.stringify({ event: "server_started", port: config.port, stateless: true, vlmModel: config.ollamaVlmModel, actModel: config.ollamaActModel }));
});

function shutdown(signal: string) {
  console.info(JSON.stringify({ event: "shutdown_initiated", signal }));
  server.close(() => {
    console.info(JSON.stringify({ event: "server_closed" }));
    process.exit(0);
  });
  setTimeout(() => {
    console.error(JSON.stringify({ event: "forced_shutdown" }));
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));