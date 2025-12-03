const { v4: uuidv4 } = require('uuid');
const { convertDocxToPdfNode, convertMultipleDocxToPdf } = require('./docxConverter');
const fs = require('fs').promises;

// ============================================
// JOB STORAGE (Use Redis in production for multiple instances)
// ============================================
const jobs = new Map();

// Job statuses
const STATUS = {
    QUEUED: 'queued',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

/**
 * Create a new conversion job
 * Returns immediately with jobId
 */
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
    console.log(`[JobProcessor] Created job ${jobId}: ${originalName} (${(fileSize/1024/1024).toFixed(2)} MB)`);
    
    return jobId;
}

/**
 * Get job by ID
 */
function getJob(jobId) {
    return jobs.get(jobId) || null;
}

/**
 * Update job
 */
function updateJob(jobId, updates) {
    const job = jobs.get(jobId);
    if (job) {
        jobs.set(jobId, { ...job, ...updates });
    }
}

/**
 * Process a job in background
 * This is called with setImmediate so it doesn't block
 */
async function processJob(jobId) {
    const job = jobs.get(jobId);
    if (!job) {
        console.error(`[JobProcessor] Job ${jobId} not found`);
        return;
    }
    
    console.log(`[JobProcessor] Starting job ${jobId}`);
    
    updateJob(jobId, { 
        status: STATUS.PROCESSING, 
        progress: 5, 
        step: 'Starting conversion...' 
    });
    
    try {
        // Call your original conversion function with progress callback
        await convertDocxToPdfNode(
            job.inputPath,
            job.outputPath,
            (progress, step) => {
                updateJob(jobId, { progress, step });
            }
        );
        
        // Verify output exists
        const outputStats = await fs.stat(job.outputPath);
        
        updateJob(jobId, {
            status: STATUS.COMPLETED,
            progress: 100,
            step: 'Complete!',
            completedAt: Date.now(),
            outputSize: outputStats.size
        });
        
        console.log(`[JobProcessor] ✅ Job ${jobId} completed`);
        
    } catch (error) {
        console.error(`[JobProcessor] ❌ Job ${jobId} failed:`, error.message);
        
        updateJob(jobId, {
            status: STATUS.FAILED,
            progress: 0,
            step: 'Failed',
            error: error.message,
            completedAt: Date.now()
        });
        
        // Cleanup input file on failure
        try {
            await fs.unlink(job.inputPath);
        } catch (e) {}
    }
}

/**
 * Start processing a job (non-blocking)
 */
function startJob(jobId) {
    // Use setImmediate to not block the event loop
    setImmediate(() => {
        processJob(jobId).catch(err => {
            console.error(`[JobProcessor] Unhandled error in job ${jobId}:`, err);
            updateJob(jobId, {
                status: STATUS.FAILED,
                error: err.message
            });
        });
    });
}

/**
 * Delete a job and cleanup files
 */
async function deleteJob(jobId) {
    const job = jobs.get(jobId);
    if (!job) return;
    
    try {
        await fs.unlink(job.inputPath).catch(() => {});
        await fs.unlink(job.outputPath).catch(() => {});
    } catch (e) {}
    
    jobs.delete(jobId);
    console.log(`[JobProcessor] Deleted job ${jobId}`);
}

/**
 * Cleanup old jobs (call periodically)
 */
async function cleanupOldJobs(maxAgeMs = 30 * 60 * 1000) {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [jobId, job] of jobs.entries()) {
        if (now - job.createdAt > maxAgeMs) {
            await deleteJob(jobId);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`[JobProcessor] Cleaned up ${cleaned} old jobs`);
    }
}

/**
 * Get all jobs (for debugging)
 */
function getAllJobs() {
    return Array.from(jobs.values());
}

/**
 * Get job count
 */
function getJobCount() {
    return jobs.size;
}

// Start cleanup interval (every 5 minutes)
setInterval(() => {
    cleanupOldJobs();
}, 5 * 60 * 1000);

module.exports = {
    createJob,
    getJob,
    updateJob,
    startJob,
    deleteJob,
    cleanupOldJobs,
    getAllJobs,
    getJobCount,
    STATUS
};