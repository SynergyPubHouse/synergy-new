require("dotenv").config();
const mongoose = require("mongoose");
const Manuscript = require("../models/Manuscript");

const ISSN_NUMBER = "3139-3616";

async function addIssnNumber() {
  try {
    const mongoUri =
      "mongodb+srv://synergyworldpress_db_user:VMHkJ0WTqlEDEwOe@synergycluster.atmerek.mongodb.net/synergy-world-press?retryWrites=true&w=majority";

    if (!mongoUri) {
      throw new Error(
        "MongoDB connection URL is missing. Add MONGODB_URI to your .env file.",
      );
    }

    await mongoose.connect(mongoUri);

    console.log("Connected to MongoDB");

    const result = await Manuscript.updateMany(
      {},
      {
        $set: {
          issnNumber: ISSN_NUMBER,
        },
      },
    );

    console.log("ISSN update completed");
    console.log(`Matched documents: ${result.matchedCount}`);
    console.log(`Modified documents: ${result.modifiedCount}`);
  } catch (error) {
    console.error("Failed to update ISSN numbers:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
}

addIssnNumber();
