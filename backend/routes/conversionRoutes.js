const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { convertDocxToPdfNode, warmupBrowser } = require('../utils/convertDocxToPdfNode');

const router = express.Router();

// ============================================
// JOB STORAGE
// ============================================
const jobs = new Map();

const STATUS = {
    QUEUED: 'queued',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

// ============================================
// MULTER CONFIG
// ============================================
const uploadDir = '/tmp/docx-uploads';

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true }).catch(() => {});

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.docx', '.doc'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only .docx and .doc files are allowed'));
        }
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================
function createJob(inputPath, originalName, fileSize) {
    const jobId = uuidv4();
    const outputPath = inputPath.replace(/\.[^.]+$/, '.pdf');
    
    const job = {
        id: jobId,
        status: STATUS.QUEUED,
        progress: 0,
        step: 'Queued',
        inputPath,
        outputPath,
        originalName,
        fileSize,
        createdAt: Date.now(),
        completedAt: null,
        error: null
    };
    
    jobs.set(jobId, job);
    console.log(`[Conversion] Created job ${jobId}: ${originalName} (${(fileSize/1024/1024).toFixed(2)} MB)`);
    
    return jobId;
}

function updateJob(jobId, updates) {
    const job = jobs.get(jobId);
    if (job) {
        jobs.set(jobId, { ...job, ...updates });
    }
}

async function processJob(jobId) {
    const job = jobs.get(jobId);
    if (!job) return;
    
    console.log(`[Conversion] Processing job ${jobId}`);
    
    updateJob(jobId, { 
        status: STATUS.PROCESSING, 
        progress: 5, 
        step: 'Starting conversion...' 
    });
    
    try {
        await convertDocxToPdfNode(
            job.inputPath,
            job.outputPath,
            (progress, step) => {
                updateJob(jobId, { progress, step });
            }
        );
        
        const outputStats = await fs.stat(job.outputPath);
        
        updateJob(jobId, {
            status: STATUS.COMPLETED,
            progress: 100,
            step: 'Complete!',
            completedAt: Date.now(),
            outputSize: outputStats.size
        });
        
        console.log(`[Conversion] ✅ Job ${jobId} completed`);
        
    } catch (error) {
        console.error(`[Conversion] ❌ Job ${jobId} failed:`, error.message);
        
        updateJob(jobId, {
            status: STATUS.FAILED,
            progress: 0,
            step: 'Failed',
            error: error.message,
            completedAt: Date.now()
        });
        
        // Cleanup input file on failure
        await fs.unlink(job.inputPath).catch(() => {});
    }
}

async function deleteJob(jobId) {
    const job = jobs.get(jobId);
    if (!job) return;
    
    await fs.unlink(job.inputPath).catch(() => {});
    await fs.unlink(job.outputPath).catch(() => {});
    jobs.delete(jobId);
    console.log(`[Conversion] Deleted job ${jobId}`);
}

// Cleanup old jobs every 5 minutes
setInterval(async () => {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [jobId, job] of jobs.entries()) {
        if (now - job.createdAt > maxAge) {
            await deleteJob(jobId);
        }
    }
}, 5 * 60 * 1000);

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/convert/docx-to-pdf
 * Upload DOCX and start conversion
 * Returns immediately with jobId
 */
router.post('/docx-to-pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        const { path: inputPath, originalname, size } = req.file;
        
        // Create job
        const jobId = createJob(inputPath, originalname, size);
        
        // ⚡ Respond immediately
        res.json({
            success: true,
            jobId,
            message: 'Conversion started',
            originalName: originalname,
            fileSize: size
        });
        
        // 🔥 Process in background after response sent
        setImmediate(() => {
            processJob(jobId).catch(err => {
                console.error(`[Conversion] Unhandled error:`, err);
                updateJob(jobId, {
                    status: STATUS.FAILED,
                    error: err.message
                });
            });
        });
        
    } catch (error) {
        console.error('[Conversion] Upload error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * GET /api/convert/status/:jobId
 * Check conversion status
 */
router.get('/status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    
    if (!job) {
        return res.status(404).json({ 
            success: false, 
            error: 'Job not found' 
        });
    }
    
    res.json({
        success: true,
        id: job.id,
        status: job.status,
        progress: job.progress,
        step: job.step,
        originalName: job.originalName,
        fileSize: job.fileSize,
        outputSize: job.outputSize,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt
    });
});

/**
 * GET /api/convert/download/:jobId
 * Download converted PDF
 */
router.get('/download/:jobId', async (req, res) => {
    const job = jobs.get(req.params.jobId);
    
    if (!job) {
        return res.status(404).json({ 
            success: false, 
            error: 'Job not found' 
        });
    }
    
    if (job.status !== STATUS.COMPLETED) {
        return res.status(400).json({ 
            success: false, 
            error: 'Conversion not complete',
            status: job.status,
            progress: job.progress
        });
    }
    
    try {
        await fs.access(job.outputPath);
        
        const downloadName = job.originalName.replace(/\.[^.]+$/, '.pdf');
        
        res.download(job.outputPath, downloadName, async (err) => {
            if (err && !res.headersSent) {
                console.error('[Conversion] Download error:', err);
            }
            // Cleanup after download
            setTimeout(() => deleteJob(job.id), 5000);
        });
        
    } catch (error) {
        res.status(404).json({ 
            success: false, 
            error: 'PDF file not found' 
        });
    }
});

/**
 * GET /api/convert/health
 * Health check for conversion service
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'docx-to-pdf',
        activeJobs: jobs.size
    });
});

module.exports = router;