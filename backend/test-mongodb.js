const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const testConnection = async () => {
	try {
		console.log("Testing MongoDB connection...");
		console.log(
			"MongoDB URI:",
			process.env.MONGO_URI ? "URI is set" : "URI is missing"
		);

		const conn = await mongoose.connect(process.env.MONGO_URI, {
			serverSelectionTimeoutMS: 10000, // 10 seconds
			socketTimeoutMS: 45000,
		});

		console.log(
			`✅ MongoDB connected successfully: ${conn.connection.host}`
		);
		console.log(`Database name: ${conn.connection.name}`);
		console.log(`Connection state: ${conn.connection.readyState}`);

		// List databases to verify connection works
		const admin = conn.connection.db.admin();
		const databases = await admin.listDatabases();
		console.log(
			"Available databases:",
			databases.databases.map((db) => db.name)
		);

		await mongoose.connection.close();
		console.log("✅ Connection test completed successfully");
		process.exit(0);
	} catch (error) {
		console.error("❌ MongoDB connection failed:");
		console.error("Error message:", error.message);
		console.error("Error code:", error.code);
		console.error("Error cause:", error.cause);

		// More specific error messages
		if (error.message.includes("ECONNREFUSED")) {
			console.error("\n🔍 Network connection refused. Possible causes:");
			console.error("- MongoDB cluster is not running or accessible");
			console.error("- Network/firewall issues");
			console.error("- Incorrect connection string");
		}

		if (error.message.includes("authentication")) {
			console.error("\n🔍 Authentication failed. Possible causes:");
			console.error("- Incorrect username or password");
			console.error("- Database user doesn't exist");
			console.error("- User doesn't have access to the database");
		}

		process.exit(1);
	}
};

console.log("Starting MongoDB connection test...");
testConnection();
