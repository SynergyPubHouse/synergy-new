const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// CORS configuration
app.use(
	cors({
		origin: "https://synergyworldpress.com",
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"X-Requested-With",
			"Accept",
		],
		exposedHeaders: ["Content-Range", "X-Content-Range"],
		maxAge: 600, // Cache preflight request for 10 minutes
		preflightContinue: false,
		optionsSuccessStatus: 204,
	})
);

// Handle preflight requests
app.options("*", cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes - More specific routes first
app.use("/api/auth/editor", require("./routes/editorRoutes"));
app.use("/api/auth/reviewer", require("./routes/reviewerRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/manuscriptRoutes"));

// Debug middleware to log all requests
app.use((req, res, next) => {
	console.log(`${req.method} ${req.url}`);
	next();
});

// Root route to confirm backend is working
app.get('/', (req, res) => {
	res.send('Backend is working');
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
	console.log(`Error: ${err.message}`);
	server.close(() => process.exit(1));
});
