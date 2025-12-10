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
const { uploadPdfToDrive } = require('../services/driveStorage');

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
  // Hard-coded external LibreOffice HTTP service URL for now (no env lookup)
  const CONVERTER_BASE = 'https://doc-converter-kypa.onrender.com';
  const CONVERTER_ENDPOINTS = [
    '/api/convert/docx-to-pdf',
    '/convert',
    '/api/convert',
    '/convert/docx-to-pdf',
  ];
  let serviceUrl = `${CONVERTER_BASE}${CONVERTER_ENDPOINTS[0]}`;

  let sizeBytes = null;
  let sizeMB = null;
  try {
    const stat = fsSync.statSync(inputPath);
    sizeBytes = stat.size;
    sizeMB = Math.round((stat.size / (1024 * 1024)) * 100) / 100;
  } catch (_) {}

  // Hard-coded request timeout for converter (120s)
  const timeoutMs = 120000;
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

  const requestStartedAt = Date.now();
  console.log('[DocumentJob] Starting LibreOffice conversion', {
    ...meta,
    startedAt: new Date(requestStartedAt).toISOString(),
  });

  const pdfPath = path.join(os.tmpdir(), `docjob_${jobId || Date.now()}.pdf`);

  try {
    let response;
    const attempted = [];
    for (const endpoint of CONVERTER_ENDPOINTS) {
      serviceUrl = `${CONVERTER_BASE}${endpoint}`;
      attempted.push(serviceUrl);
      // Recreate form-data and stream for each attempt
      const formData = new FormData();
      formData.append('file', fsSync.createReadStream(inputPath), fileName);

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

      try {
        const len = await new Promise((resolve) =>
          typeof formData.getLength === 'function'
            ? formData.getLength((err, length) => resolve(err ? undefined : length))
            : resolve(undefined)
        );
        if (typeof len === 'number' && Number.isFinite(len)) {
          config.headers['Content-Length'] = len;
        }
      } catch (_) {}

      console.log('[DocumentJob] LibreOffice request config', {
        method: 'POST',
        url: serviceUrl,
        timeoutMs: config.timeout,
        maxContentLength,
        maxBodyLength,
      });

      console.log('[LO-HTTP][documents] Calling converter at', serviceUrl, 'for job', jobId || null);
      try {
        response = await axios.post(serviceUrl, formData, config);
        break; // success
      } catch (err) {
        const status = err.response?.status;
        if (status === 404 || status === 405) {
          console.error('[DocumentJob] Converter endpoint not found/allowed', { status, url: serviceUrl });
          continue; // try next endpoint
        }
        throw err; // rethrow other errors
      }
    }

    if (!response) {
      throw new Error(`No converter endpoint available (tried: ${attempted.join(', ')})`);
    }
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
      let nonPdfSnippet = null;
      try {
        const MAX_SNIPPET = 1024;
        let collected = 0;
        let chunks = [];
        await new Promise((resolve, reject) => {
          response.data.on('data', (chunk) => {
            if (collected < MAX_SNIPPET) {
              const remaining = MAX_SNIPPET - collected;
              const piece = chunk.slice(0, remaining);
              chunks.push(piece);
              collected += piece.length;
            } else {
              // we have enough, stop reading further
              response.data.removeAllListeners('data');
              response.data.destroy();
              resolve();
            }
          });
          response.data.on('end', resolve);
          response.data.on('error', reject);
        });
        nonPdfSnippet = Buffer.concat(chunks).toString('utf8');
      } catch (_) {}

      console.error('[DocumentJob] Non-PDF response from converter', {
        url: serviceUrl,
        status: response.status,
        contentType,
        nonPdfSnippet,
      });
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

    // Reflect the actual URL used in meta
    meta.serviceUrl = serviceUrl;
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
      const drive = await uploadPdfToDrive(pdfPath, { filename: `docjob_${job._id.toString()}.pdf` });
      job.driveFileId = drive.driveFileId;
      job.driveViewUrl = drive.driveViewUrl;
      pdfUrl = drive.driveViewUrl; // legacy compatibility
      try {
        await fs.unlink(pdfPath);
        keepLocalPdf = false;
        console.log('[DocumentJob] Local PDF removed after Drive upload', {
          jobId: job._id.toString(),
          pdfPath,
        });
      } catch (cleanupErr) {
        console.error('[DocumentJob] Failed to remove local PDF after Drive upload', {
          jobId: job._id.toString(),
          pdfPath,
          message: cleanupErr.message,
        });
      }
    } catch (uploadErr) {
      console.error('[DocumentJob] Drive upload failed', {
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
      driveViewUrl: job.driveViewUrl || null,
      driveFileId: job.driveFileId || null,
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

    // Prefer Google Drive URL if available
    if (job.driveViewUrl) {
      return res.redirect(302, job.driveViewUrl);
    }

    // Prefer cloud URL if available (legacy)
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
