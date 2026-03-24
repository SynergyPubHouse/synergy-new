const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log(`MongoDB connected successfully: ${process.env.MONGO_URI}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.error("Full error:", error);

    // Don't exit in development, allow for reconnection attempts
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.log("Retrying MongoDB connection in 5 seconds...");
      setTimeout(connectDB, 5000);
    }
  }
};

// Connection event listeners
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from MongoDB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed through app termination");
  process.exit(0);
});

module.exports = connectDB;
