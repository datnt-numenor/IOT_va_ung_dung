const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

const backendRoot = path.join(__dirname, "..");
const frontendRoot = path.join(backendRoot, "..", "frontend");
const viteEntry = path.join(frontendRoot, "node_modules", "vite", "bin", "vite.js");
const mqttPort = Number(process.env.MQTT_PORT || 1883);
const sharedEnv = {
  ...process.env,
  PORT: process.env.PORT || "3000",
  MQTT_URL: process.env.MQTT_URL || `mqtt://127.0.0.1:${mqttPort}`,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://127.0.0.1:5173,http://localhost:5173",
};
const children = [];
let stopping = false;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const finish = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(500);
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });
}

function start(command, args, cwd) {
  const child = spawn(command, args, { cwd, env: sharedEnv, stdio: "inherit" });
  children.push(child);
  child.on("exit", (code) => {
    if (!stopping && code) shutdown(code);
  });
  return child;
}

function stopChild(child) {
  if (!child.pid || child.exitCode !== null) return Promise.resolve();

  if (process.platform === "win32") {
    return new Promise((resolve) => {
      const killer = spawn(
        "taskkill",
        ["/pid", String(child.pid), "/T", "/F"],
        { stdio: "ignore", windowsHide: true },
      );
      killer.once("exit", resolve);
      killer.once("error", resolve);
    });
  }

  child.kill("SIGTERM");
  return Promise.resolve();
}

async function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.map(stopChild));
  process.exit(exitCode);
}

async function main() {
  if (await isPortOpen(mqttPort)) {
    console.log(`Using MQTT broker already listening on 127.0.0.1:${mqttPort}`);
  } else {
    start(process.execPath, [path.join(__dirname, "e2eBroker.js")], backendRoot);
  }
  start(process.execPath, [path.join(backendRoot, "server.js")], backendRoot);
  start(process.execPath, [path.join(__dirname, "mockEsp32.js")], backendRoot);
  start(process.execPath, [viteEntry, "--host", "127.0.0.1", "--port", "5173"], frontendRoot);
  console.log("E2E stack starting: MQTT + backend + mock ESP32 + frontend");
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
main().catch((error) => {
  console.error(error);
  shutdown(1);
});
