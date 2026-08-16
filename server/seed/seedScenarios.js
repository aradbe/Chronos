// Writes the built-in scenarios into MongoDB.
//
// Run it with:   npm run seed
//
// It is safe to run more than once. Each scenario is matched by title and
// overwritten, so running it twice does not create two copies of Pompeii.

const mongoose = require("mongoose");
require("dotenv").config();

const Scenario = require("../models/Scenario");
const pompeiiScenario = require("./pompeiiScenario");

const scenarios = [pompeiiScenario];

const seedScenarios = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Copy .env.example to .env first.");
  }

  await mongoose.connect(process.env.MONGO_URI, { dbName: "chronos" });
  console.log("Connected to MongoDB");

  for (const scenario of scenarios) {
    const saved = await Scenario.findOneAndUpdate(
      { title: scenario.title },
      scenario,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    console.log(
      `Seeded "${saved.title}" (${saved._id}) — ` +
        `${saved.locations.length} locations, ` +
        `${saved.characters.length} characters, ` +
        `${saved.items.length} items, ` +
        `${saved.objectives.length} objectives, ` +
        `${saved.events.length} events`,
    );
  }
};

seedScenarios()
  .then(() => {
    console.log("Seeding finished");
    return mongoose.disconnect();
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
