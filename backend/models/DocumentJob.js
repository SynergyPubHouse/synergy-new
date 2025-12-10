const mongoose = require('mongoose');

const DocumentJobSchema = new mongoose.Schema(
  {
    originalFilename: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number }, // bytes

    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    progress: { type: Number, default: 0 },
    step: { type: String, default: 'Queued' },

    sourcePath: { type: String },
    sourceStorage: {
      type: String,
      enum: ['local', 'cloud'],
      default: 'local',
    },

    pdfPath: { type: String },
    pdfUrl: { type: String },
    // Google Drive fields for the generated PDF
    driveFileId: { type: String },
    driveViewUrl: { type: String },

    converterMeta: { type: mongoose.Schema.Types.Mixed },

    error: { type: String },
    errorDetails: { type: mongoose.Schema.Types.Mixed },

    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DocumentJob', DocumentJobSchema);
