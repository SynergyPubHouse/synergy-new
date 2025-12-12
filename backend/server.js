const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const multer = require("multer");  // 🔥 ADD THIS
const os = require("os");          // 🔥 ADD THIS
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const connectDB = require("./config/db");
const googleAuthRoutes = require('./routes/googleAuthRoutes');
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

const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const effectiveOrigins = [...allowedOrigins, ...extraOrigins];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (/^http:\/\/localhost(?::\d+)?$/.test(origin)) return callback(null, true);
    const allowed = effectiveOrigins.includes(origin) || effectiveOrigins.some(p => p.startsWith('*.') && origin.endsWith(p.slice(1)));
    if (allowed) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
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
app.use('/auth', googleAuthRoutes);
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

// 🔥 ADD THIS - LibreOffice Test Route
app.get('/test-libreoffice', async (req, res) => {
    const results = {
        timestamp: new Date().toISOString(),
        platform: process.platform,
        nodeEnv: process.env.NODE_ENV,
        home: process.env.HOME,
        libreoffice: null,
        path: null,
        error: null
    };
    
    try {
        const { execSync } = require('child_process');
        
        // Try libreoffice --version
        try {
            results.libreoffice = execSync('libreoffice --version 2>&1', { 
                timeout: 15000, 
                encoding: 'utf8' 
            }).trim();
        } catch (e) {
            // Try soffice --version
            try {
                results.libreoffice = execSync('soffice --version 2>&1', { 
                    timeout: 15000, 
                    encoding: 'utf8' 
                }).trim();
            } catch (e2) {
                results.libreoffice = "NOT FOUND: " + e2.message;
            }
        }
        
        // Try which
        try {
            results.path = execSync('which libreoffice || which soffice || echo "not found"', { 
                timeout: 5000, 
                encoding: 'utf8' 
            }).trim();
        } catch (e) {
            results.path = "which failed: " + e.message;
        }
        
        res.json(results);
        
    } catch (error) {
        results.error = error.message;
        res.status(500).json(results);
    }
});
// Add this route in your server
app.get('/debug-libreoffice', async (req, res) => {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const results = {
        timestamp: new Date().toISOString(),
        platform: process.platform,
        tests: []
    };
    
    try {
        // Test 1: Check LibreOffice version
        const { stdout: version } = await execPromise('/usr/bin/libreoffice --version', { timeout: 10000 });
        results.tests.push({ test: 'version', success: true, output: version.trim() });
    } catch (e) {
        results.tests.push({ test: 'version', success: false, error: e.message });
    }
    
    try {
        // Test 2: Create a test DOCX and convert
        const testDir = path.join(os.tmpdir(), `lo-test-${Date.now()}`);
        fs.mkdirSync(testDir, { recursive: true });
        
        // Create minimal DOCX (actually just a text file for testing)
        const testFile = path.join(testDir, 'test.txt');
        fs.writeFileSync(testFile, 'Hello World Test');
        
        const profileDir = path.join(os.tmpdir(), `lo-profile-${Date.now()}`);
        
        const command = `/usr/bin/libreoffice --headless --nofirststartwizard --norestore "-env:UserInstallation=file://${profileDir}" --convert-to pdf --outdir "${testDir}" "${testFile}"`;
        
        results.tests.push({ test: 'command', command });
        
        const { stdout, stderr } = await execPromise(command, { 
            timeout: 60000,
            env: { ...process.env, HOME: '/tmp' }
        });
        
        results.tests.push({ 
            test: 'conversion', 
            success: true, 
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            files: fs.readdirSync(testDir)
        });
        
        // Cleanup
        fs.rmSync(testDir, { recursive: true, force: true });
        fs.rmSync(profileDir, { recursive: true, force: true });
        
    } catch (e) {
        results.tests.push({ 
            test: 'conversion', 
            success: false, 
            error: e.message,
            stderr: e.stderr,
            stdout: e.stdout
        });
    }
    
    res.json(results);
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
