// MongoDB initialization script
db = db.getSiblingDB("synergy-world-press");

// Create collections
db.createCollection("users");
db.createCollection("manuscripts");
db.createCollection("editors");
db.createCollection("reviewers");

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.manuscripts.createIndex({ author: 1 });
db.manuscripts.createIndex({ status: 1 });
db.manuscripts.createIndex({ createdAt: 1 });

print("Database initialized successfully!");
