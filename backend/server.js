const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const multer = require("multer");  // 🔥 ADD THIS
const os = require("os");          // 🔥 ADD THIS
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const connectDB = require("./config/db");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });
 

dotenv.config();

const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
  "https://www.synergyworldpress.com",
  "https://synergyworldpress.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:63809",
  "https://orcid.org",
  "https://accounts.google.com"
];

const corsOptions = {
  origin: function (origin, callback) {
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
  maxAge: 86400,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    origin: req.headers.origin,
    'user-agent': req.headers['user-agent']
  });
  next();
});

// ============================================
// ROUTES
// ============================================
// Add this BEFORE your other routes
app.post('/api/test-upload', upload.single('file'), (req, res) => {
    // Respond IMMEDIATELY - no processing
    res.json({ 
        success: true, 
        message: 'File received',
        fileName: req.file?.originalname,
        fileSize: req.file?.size
    });
});
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/auth/editor", require("./routes/editorRoutes"));
app.use("/api/auth/reviewer", require("./routes/reviewerRoutes"));
app.use("/api/institutions", require("./routes/institutionRoutes"));
app.use("/api/send-email", require("./routes/emailRoutes"));

// 🔥 NEW: Conversion routes (add this BEFORE manuscriptRoutes)
app.use("/api/convert", require("./routes/conversionRoutes"));

// Root route
app.get('/', (req, res) => {
  res.send('Backend is working');
});

// 🔥 NEW: Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: Math.round(process.uptime()) 
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime())
  });
});

app.use("/api", require("./routes/manuscriptRoutes"));

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

// 🔥 NEW: Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing...");
  server.close(() => process.exit(0));
});

// Debug: Show all registered routes
console.log('Registered routes:');
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(r.route.path);
  } else if (r.name === 'router') {
    r.handle.stack.forEach((s) => {
      if (s.route && s.route.path) {
        console.log(s.route.path);
      }
    });
  }
});
