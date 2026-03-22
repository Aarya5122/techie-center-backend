const config = require("./config"); // must be first — loads dotenv before any other module
const mongoose = require("mongoose");
const { app } = require("./app");

async function start() {
  if (!config.mongoUri) {
    console.error("Missing MONGODB_URI in environment");
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");

  app.listen(config.port, () => {
    console.log(`Listening on http://localhost:${config.port} (${config.env})`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
