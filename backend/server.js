const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
  "https://www.synergyworldpress.com",
  "https://synergyworldpress.com" // Include both www and non-www versions
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "X-CSRF-Token"
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // Increase preflight cache to 24 hours
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Explicit OPTIONS handler for preflight requests
app.options("*", cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    origin: req.headers.origin,
    'user-agent': req.headers['user-agent']
  });
  next();
});

// Routes - More specific routes first
app.use("/api/auth/editor", require("./routes/editorRoutes"));
app.use("/api/auth/reviewer", require("./routes/reviewerRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/manuscriptRoutes"));

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