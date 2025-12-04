const express = require('express');
const multer = require('multer');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');

const DocumentJob = require('../models/DocumentJob');
const { uploadToCloudinary } = require('../utils/cloudinary');

const router = express.Router();

const MAX_CONCURRENT_JOBS = Math.max(
  1,
  parseInt(process.env.DOC_JOB_MAX_CONCURRENCY || '2', 10)
);
let activeJobs = 0;
const jobQueue = [];

function scheduleJob(jobId) {
  jobQueue.push(jobId);
  processNextJob();
}

function processNextJob() {
  if (activeJobs >= MAX_CONCURRENT_JOBS) return;
  const nextId = jobQueue.shift();
  if (!nextId) return;

  activeJobs++;
  setImmediate(() => {
    processDocumentJob(nextId)
      .catch((err) => {
        console.error('[DocumentJob] Unhandled processing error in worker', {
          jobId: nextId,
          message: err.message,
        });
      })
      .finally(() => {
        activeJobs--;
        processNextJob();
      });
  });
}

// ------------------------
// Upload configuration
// ------------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `docjob_${Date.now()}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.doc', '.docx', '.rtf', '.odt'].includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only Word-compatible documents (.doc, .docx, .rtf, .odt) are allowed'));
  },
});

// ------------------------
// Helpers
// ------------------------

function isValidPdf(filePath) {
  try {
    if (!fsSync.existsSync(filePath)) return false;
    const stat = fsSync.statSync(filePath);
    if (stat.size < 100) return false;
    const fd = fsSync.openSync(filePath, 'r');
    const buffer = Buffer.alloc(5);
    fsSync.readSync(fd, buffer, 0, 5, 0);
    fsSync.closeSync(fd);
    return buffer.toString() === '%PDF-';
  } catch (e) {
    return false;
  }
}

async function callLibreOfficeService(inputPath, fileName, jobId) {
  const serviceUrl = (
    process.env.LIBREOFFICE_SERVICE_URL ||
    process.env.CONVERTER_URL ||
    process.env.DOCX_CONVERTER_URL ||
    ''
  ).trim();

  if (!serviceUrl) {
    throw new Error(
      'No LibreOffice service URL configured (LIBREOFFICE_SERVICE_URL / CONVERTER_URL / DOCX_CONVERTER_URL)'
    );
  }

  let sizeBytes = null;
  let sizeMB = null;
  try {
    const stat = fsSync.statSync(inputPath);
    sizeBytes = stat.size;
    sizeMB = Math.round((stat.size / (1024 * 1024)) * 100) / 100;
  } catch (_) {}

  const timeoutMs = Math.max(
    60000,
    parseInt(
      process.env.LIBREOFFICE_SERVICE_TIMEOUT_MS ||
        process.env.CONVERTER_TIMEOUT_MS ||
        '120000',
      10
    )
  );
  const maxContentLength = 100 * 1024 * 1024;
  const maxBodyLength = 100 * 1024 * 1024;

  const meta = {
    jobId,
    serviceUrl,
    timeoutMs,
    maxContentLength,
    maxBodyLength,
    sizeBytes,
    sizeMB,
    fileName,
  };

  const formData = new FormData();
  formData.append('file', fsSync.createReadStream(inputPath), fileName);

  const requestStartedAt = Date.now();
  console.log('[DocumentJob] Starting LibreOffice conversion', {
    ...meta,
    startedAt: new Date(requestStartedAt).toISOString(),
  });

  const config = {
    headers: {
      ...(typeof formData.getHeaders === 'function' ? formData.getHeaders() : {}),
      Accept: 'application/pdf',
    },
    responseType: 'stream',
    timeout: timeoutMs,
    maxContentLength,
    maxBodyLength,
  };

  console.log('[DocumentJob] LibreOffice request config', {
    method: 'POST',
    url: serviceUrl,
    timeoutMs: config.timeout,
    maxContentLength,
    maxBodyLength,
  });

  const pdfPath = path.join(os.tmpdir(), `docjob_${jobId || Date.now()}.pdf`);

  try {
    const response = await axios.post(serviceUrl, formData, config);
    const requestDurationMs = Date.now() - requestStartedAt;
    const contentType = (response.headers?.['content-type'] || '').toLowerCase();
    const contentLengthHeader = response.headers?.['content-length'];
    const contentLength = contentLengthHeader
      ? parseInt(contentLengthHeader, 10) || null
      : null;

    console.log('[DocumentJob] LibreOffice response received', {
      status: response.status,
      statusText: response.statusText,
      requestDurationMs,
      contentType,
      contentLength,
    });

    if (!contentType.includes('application/pdf')) {
      throw new Error(`Expected application/pdf but got ${contentType || 'unknown'}`);
    }

    const writeStartedAt = Date.now();
    let downloadedBytes = 0;

    await new Promise((resolve, reject) => {
      const writeStream = fsSync.createWriteStream(pdfPath);
      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
      });
      response.data.on('error', (err) => reject(err));
      writeStream.on('error', (err) => reject(err));
      writeStream.on('finish', () => resolve());
      response.data.pipe(writeStream);
    });

    console.log('[DocumentJob] PDF stream written', {
      writeDurationMs: Date.now() - writeStartedAt,
      bytes: downloadedBytes,
      pdfPath,
    });

    if (!isValidPdf(pdfPath)) {
      throw new Error('Remote converter returned invalid PDF');
    }

    return { pdfPath, meta: { ...meta, requestDurationMs, downloadedBytes } };
  } catch (error) {
    const durationMs = Date.now() - requestStartedAt;
    let responseSnippet = null;
    try {
      if (error.response && error.response.data) {
        if (Buffer.isBuffer(error.response.data)) {
          responseSnippet = `Binary data length=${error.response.data.length}`;
        } else if (typeof error.response.data === 'string') {
          responseSnippet = error.response.data.substring(0, 500);
        } else {
          responseSnippet = JSON.stringify(error.response.data).substring(0, 500);
        }
      }
    } catch (_) {}

    console.error('[DocumentJob] LibreOffice service call failed', {
      ...meta,
      durationMs,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseHeaders: error.response?.headers,
      responseSnippet,
      stack: error.stack,
    });

    try {
      if (pdfPath && fsSync.existsSync(pdfPath)) {
        await fs.unlink(pdfPath);
      }
    } catch (_) {}

    const err = new Error(`LibreOffice conversion failed: ${error.message}`);
    err.meta = { ...meta, durationMs };
    throw err;
  }
}

async function processDocumentJob(jobId) {
  const job = await DocumentJob.findById(jobId);
  if (!job) {
    console.error('[DocumentJob] Job not found', { jobId });
    return;
  }
  if (job.status !== 'pending') {
    return;
  }

  job.status = 'processing';
  job.startedAt = new Date();
  job.step = 'Starting conversion';
  job.progress = 5;
  await job.save();

  const inputPath = job.sourcePath;
  const fileName = job.originalFilename;

  console.log('[DocumentJob] Processing job', {
    jobId: job._id.toString(),
    inputPath,
    fileName,
    size: job.size,
  });

  if (!inputPath || !fsSync.existsSync(inputPath)) {
    console.error('[DocumentJob] Source file missing for job', {
      jobId: job._id.toString(),
      inputPath,
    });
    job.status = 'failed';
    job.step = 'Failed';
    job.progress = 0;
    job.error = 'Source file not found on disk';
    job.completedAt = new Date();
    await job.save();
    return;
  }

  try {
    const { pdfPath, meta } = await callLibreOfficeService(inputPath, fileName, job._id.toString());

    job.step = 'Uploading PDF';
    job.progress = 90;
    await job.save();

    let pdfUrl = null;
    let keepLocalPdf = true;
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const uploadResult = await uploadToCloudinary(pdfPath, 'documents');
        pdfUrl = uploadResult.secure_url || uploadResult.url || null;

        if (pdfUrl) {
          try {
            await fs.unlink(pdfPath);
            keepLocalPdf = false;
            console.log('[DocumentJob] Local PDF removed after cloud upload', {
              jobId: job._id.toString(),
              pdfPath,
            });
          } catch (cleanupErr) {
            console.error('[DocumentJob] Failed to remove local PDF after cloud upload', {
              jobId: job._id.toString(),
              pdfPath,
              message: cleanupErr.message,
            });
          }
        }
      }
    } catch (uploadErr) {
      console.error('[DocumentJob] Cloud upload failed', {
        jobId: job._id.toString(),
        message: uploadErr.message,
      });
    }

    job.status = 'completed';
    job.step = 'Completed';
    job.progress = 100;
    job.pdfPath = keepLocalPdf ? pdfPath : undefined;
    job.pdfUrl = pdfUrl;
    job.completedAt = new Date();
    job.error = undefined;
    job.errorDetails = undefined;
    job.converterMeta = meta;
    await job.save();

    console.log('[DocumentJob] Job completed', {
      jobId: job._id.toString(),
      pdfPath,
      pdfUrl,
    });
  } catch (err) {
    console.error('[DocumentJob] Job failed', {
      jobId: job._id.toString(),
      message: err.message,
    });

    job.status = 'failed';
    job.step = 'Failed';
    job.progress = 0;
    job.error = err.message;
    job.errorDetails = err.meta || undefined;
    job.completedAt = new Date();
    await job.save();
  } finally {
    // Best-effort cleanup of source file; keep PDF while job is active
    if (inputPath) {
      try {
        await fs.unlink(inputPath);
      } catch (_) {}
    }
  }
}

// ------------------------
// Routes
// ------------------------

// POST /api/documents
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Use field name "file".',
      });
    }

    const { originalname, mimetype, size, path: filePath } = req.file;

    console.log('[DocumentJob] Upload received', {
      originalname,
      mimetype,
      size,
      filePath,
    });

    const job = await DocumentJob.create({
      originalFilename: originalname,
      mimeType: mimetype,
      size,
      sourcePath: filePath,
      sourceStorage: 'local',
      status: 'pending',
      progress: 0,
      step: 'Queued',
    });

    // Kick off async processing via in-memory queue
    scheduleJob(job._id.toString());

    return res.status(202).json({
      success: true,
      id: job._id.toString(),
      status: job.status,
      progress: job.progress,
      step: job.step,
    });
  } catch (err) {
    console.error('[DocumentJob] Upload error', { message: err.message });
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create conversion job',
    });
  }
});

// GET /api/documents/:id/status
router.get('/:id/status', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const job = await DocumentJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    return res.json({
      success: true,
      id: job._id.toString(),
      status: job.status,
      progress: job.progress,
      step: job.step,
      error: job.error || null,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      pdfReady: job.status === 'completed',
      pdfUrl: job.pdfUrl || null,
    });
  } catch (err) {
    console.error('[DocumentJob] Status error', { message: err.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job status',
    });
  }
});

// GET /api/documents/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const job = await DocumentJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Job is not completed (status: ${job.status})`,
      });
    }

    const downloadName = (job.originalFilename || 'document').replace(/\.[^.]+$/, '') + '.pdf';

    // Prefer cloud URL if available
    if (job.pdfUrl) {
      console.log('[DocumentJob] Streaming PDF from cloud', {
        jobId: job._id.toString(),
        pdfUrl: job.pdfUrl,
      });

      const remoteResp = await axios.get(job.pdfUrl, { responseType: 'stream' });
      res.setHeader('Content-Type', remoteResp.headers['content-type'] || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);

      remoteResp.data.on('error', (err) => {
        console.error('[DocumentJob] Error streaming cloud PDF', {
          jobId: job._id.toString(),
          message: err.message,
        });
        if (!res.headersSent) {
          res.status(500).end('Error streaming PDF');
        }
      });

      return remoteResp.data.pipe(res);
    }

    // Fallback to local file if present
    if (job.pdfPath && fsSync.existsSync(job.pdfPath)) {
      console.log('[DocumentJob] Sending local PDF', {
        jobId: job._id.toString(),
        pdfPath: job.pdfPath,
      });
      return res.download(job.pdfPath, downloadName, (err) => {
        if (err && !res.headersSent) {
          console.error('[DocumentJob] Download error', {
            jobId: job._id.toString(),
            message: err.message,
          });
          res.status(500).end('Error sending PDF');
        }
      });
    }

    console.error('[DocumentJob] PDF not found for completed job', {
      jobId: job._id.toString(),
    });
    return res.status(404).json({
      success: false,
      message: 'PDF file not found for this job',
    });
  } catch (err) {
    console.error('[DocumentJob] PDF error', { message: err.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to stream PDF',
    });
  }
});

module.exports = router;
