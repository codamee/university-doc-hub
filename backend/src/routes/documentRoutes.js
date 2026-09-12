const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { UPLOAD_DIR, calculateChecksum, scanForMalware } = require('../services/storageService');
const { logAuditEvent } = require('../services/auditService');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|jpe?g|png|docx?|tiff?)$/i)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format: ${file.mimetype}. Allowed: PDF, JPG, PNG, DOCX, TIFF.`));
    }
  }
});

// POST /api/documents/upload
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided in request.' });
    }

    const { caseId, category = 'Academic Transcript' } = req.body;
    const filePath = req.file.path;

    // 1. Calculate SHA-256 Checksum
    const checksumSha256 = await calculateChecksum(filePath);

    // 2. Perform SecOps Malware Scan
    const scanResult = await scanForMalware(filePath, req.file.originalname);

    // 3. Create Document Record
    const newDoc = db.documents.insert({
      caseId: caseId || null,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      checksumSha256,
      malwareStatus: scanResult.status,
      malwareThreat: scanResult.threatName,
      scanEngine: scanResult.engine,
      category,
      storagePath: req.file.path,
      version: 1,
      pageCount: 1, // Default, updated on OCR
      uploadDate: new Date().toISOString()
    });

    // 4. Audit Log
    logAuditEvent({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'DOC_UPLOAD',
      entity: 'Document',
      entityId: newDoc.id,
      details: JSON.stringify({
        fileName: req.file.originalname,
        size: req.file.size,
        checksumSha256,
        malwareStatus: scanResult.status
      }),
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      document: newDoc,
      scanResult
    });
  } catch (err) {
    console.error('[Document Upload Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'File upload failed' });
  }
});

// GET /api/documents/:id - Get Document Metadata
router.get('/:id', authenticateToken, (req, res) => {
  const doc = db.documents.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }
  res.json({ success: true, document: doc });
});

// GET /api/documents/:id/download - Stream / Download Document
router.get('/:id/download', (req, res) => {
  const doc = db.documents.findById(req.params.id);
  if (!doc) {
    return res.status(404).send('Document not found');
  }

  if (doc.storagePath && fs.existsSync(doc.storagePath)) {
    return res.download(doc.storagePath, doc.originalName);
  }

  // If mock/seed file path doesn't exist on disk, return synthetic representation
  res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
  res.send(`Mock Document Content for ${doc.originalName} [Hash: ${doc.checksumSha256}]`);
});

module.exports = router;

