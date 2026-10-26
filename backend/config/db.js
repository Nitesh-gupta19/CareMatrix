const mongoose = require("mongoose");

/**
 * Connects to MongoDB using MONGO_URI from the environment.
 * The app must NOT continue running with a broken/absent DB connection,
 * so a failed connection exits the process rather than failing silently
 * on the first request.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error(
      "[db] MONGO_URI is not set. Create a .env file (see .env.example) before starting the server."
    );
    process.exit(1);
  }

  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on("error", (err) => {
      console.error("[db] MongoDB connection error after initial connect:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[db] MongoDB disconnected.");
    });
  } catch (err) {
    console.error("[db] Initial MongoDB connection failed:", err.message);
    console.error(
      "[db] Is MongoDB running and reachable at the MONGO_URI in your .env? Exiting."
    );
    process.exit(1);
  }
}

module.exports = connectDB;
