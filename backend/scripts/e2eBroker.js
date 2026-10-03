const net = require("net");
const { Aedes } = require("aedes");

const port = Number(process.env.MQTT_PORT || 1883);
let broker;
let server;

Aedes.createBroker().then((created) => {
  broker = created;
  server = net.createServer(broker.handle);
  server.listen(port, "127.0.0.1", () => {
    console.log(`Development MQTT broker listening on mqtt://127.0.0.1:${port}`);
  });
});

function shutdown() {
  server?.close(() => broker.close(() => process.exit(0)));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
