const { v4: uuidv4 } = require('uuid');

// ============================================
// JOB STORAGE (In-memory for simplicity)
// For production with multiple instances, use Redis
// ============================================
const jobs = new Map();

const STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

/**
 * Create a new job
 */
function createJob(data = {}) {
    const jobId = uuidv4();
    
    const job = {
        id: jobId,
        status: STATUS.PENDING,
        progress: 0,
        step: 'Queued for processing',
        data: data,
        result: null,
        error: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        completedAt: null
    };
    
    jobs.set(jobId, job);
    console.log(`[JobProcessor] Created job ${jobId}`);
    
    return jobId;
}

/**
 * Get job by ID
 */
function getJob(jobId) {
    return jobs.get(jobId) || null;
}

/**
 * Update job progress
 */
function updateJob(jobId, updates) {
    const job = jobs.get(jobId);
    if (job) {
        jobs.set(jobId, { 
            ...job, 
            ...updates, 
            updatedAt: Date.now() 
        });
    }
}

/**
 * Mark job as completed
 */
function completeJob(jobId, result) {
    updateJob(jobId, {
        status: STATUS.COMPLETED,
        progress: 100,
        step: 'Complete!',
        result: result,
        completedAt: Date.now()
    });
    console.log(`[JobProcessor] ✅ Job ${jobId} completed`);
}

/**
 * Mark job as failed
 */
function failJob(jobId, error) {
    updateJob(jobId, {
        status: STATUS.FAILED,
        step: 'Failed',
        error: error.message || error,
        completedAt: Date.now()
    });
    console.error(`[JobProcessor] ❌ Job ${jobId} failed:`, error);
}

/**
 * Delete a job
 */
function deleteJob(jobId) {
    jobs.delete(jobId);
}

/**
 * Cleanup old jobs (call periodically)
 */
function cleanupOldJobs(maxAgeMs = 60 * 60 * 1000) {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [jobId, job] of jobs.entries()) {
        if (now - job.createdAt > maxAgeMs) {
            jobs.delete(jobId);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`[JobProcessor] Cleaned ${cleaned} old jobs`);
    }
}

// Cleanup every 10 minutes
setInterval(() => cleanupOldJobs(), 10 * 60 * 1000);

module.exports = {
    createJob,
    getJob,
    updateJob,
    completeJob,
    failJob,
    deleteJob,
    cleanupOldJobs,
    STATUS
}; 