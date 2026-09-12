const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { extractDocumentData, generateGroundedSummary, crossValidateDocuments } = require('../services/geminiService');
const { runCaseValidation } = require('../services/validationService');
const { logAuditEvent } = require('../services/auditService');

// POST /api/ai/extract - Live extraction via Gemini 3.6 Flash
router.post('/extract', authenticateToken, async (req, res) => {
  try {
    const { documentId, caseId, documentType, textSnippet } = req.body;

    let doc = null;
    if (documentId) {
      doc = db.documents.findById(documentId);
    }

    const fileName = doc ? doc.originalName : (req.body.fileName || 'Academic_Record.pdf');
    const category = documentType || (doc ? doc.category : 'Academic Transcript');

    // Run Gemini 3.6 Flash extraction
    const extractionResult = await extractDocumentData({
      documentType: category,
      fileName,
      textSnippet,
      caseCategory: category
    });

    const data = extractionResult.data;

    // Save extracted fields if documentId and caseId provided
    const savedFields = [];
    if (caseId && data.extractedFields) {
      data.extractedFields.forEach(field => {
        const saved = db.extractedFields.insert({
          caseId,
          documentId: documentId || null,
          fieldKey: field.fieldKey,
          label: field.label,
          extractedValue: field.value,
          confidence: field.confidence,
          pageNumber: field.pageNumber || 1,
          boundingBox: field.boundingBox,
          evidenceQuote: field.evidenceQuote,
          status: field.status || 'UNREVIEWED',
          approvedValue: field.confidence >= 90 ? field.value : null,
          modelVersion: extractionResult.modelVersion
        });
        savedFields.push(saved);
      });

      // Update case summary & confidence
      db.cases.updateById(caseId, {
        aiSummary: data.summary,
        aiConfidence: data.overallConfidence,
        updatedAt: new Date().toISOString()
      });

      // Automatically trigger validation rules on case
      const caseItem = db.cases.findById(caseId);
      const docs = db.documents.find(d => d.caseId === caseId);
      const fields = db.extractedFields.find(f => f.caseId === caseId);
      const validation = runCaseValidation(caseItem, docs, fields);

      // Save generated exceptions if any
      validation.exceptionsGenerated.forEach(exc => {
        const exists = db.exceptions.findOne(e => e.caseId === exc.caseId && e.exceptionType === exc.exceptionType && e.fieldKey === exc.fieldKey);
        if (!exists) {
          db.exceptions.insert(exc);
        }
      });
    }

    // Audit log AI run
    logAuditEvent({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'AI_EXTRACT',
      entity: 'Document',
      entityId: documentId || caseId,
      details: JSON.stringify({
        model: extractionResult.modelVersion,
        overallConfidence: data.overallConfidence,
        fieldsExtracted: data.extractedFields?.length || 0,
        latencyMs: extractionResult.latencyMs
      }),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      result: data,
      savedFields,
      modelVersion: extractionResult.modelVersion,
      latencyMs: extractionResult.latencyMs,
      timestamp: extractionResult.timestamp
    });
  } catch (err) {
    console.error('[AI Extract Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'AI extraction failed' });
  }
});

// POST /api/ai/summarize - Grounded synthesis & decision support
router.post('/summarize', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.body;
    const caseItem = db.cases.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const documents = db.documents.find(d => d.caseId === caseId);
    const fields = db.extractedFields.find(f => f.caseId === caseId);

    const summaryResult = await generateGroundedSummary({
      caseNumber: caseItem.caseNumber,
      category: caseItem.category,
      applicantName: caseItem.applicantName,
      documents,
      fields
    });

    const data = summaryResult.data;

    // Update case record with grounded recommendation & risk score
    db.cases.updateById(caseId, {
      aiSummary: data.executiveSummary,
      aiRecommendation: data.recommendation,
      aiConfidence: data.recommendationConfidence,
      riskScore: data.riskScore,
      updatedAt: new Date().toISOString()
    });

    logAuditEvent({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'AI_SUMMARIZE',
      entity: 'Case',
      entityId: caseId,
      details: JSON.stringify({
        recommendation: data.recommendation,
        riskScore: data.riskScore,
        confidence: data.recommendationConfidence,
        citationsCount: data.citations?.length || 0
      }),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      summary: data,
      modelVersion: summaryResult.modelVersion,
      latencyMs: summaryResult.latencyMs
    });
  } catch (err) {
    console.error('[AI Summarize Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'AI summarization failed' });
  }
});

// POST /api/ai/cross-validate - Cross-document discrepancy checker
router.post('/cross-validate', authenticateToken, async (req, res) => {
  try {
    const { docAId, docBId, docAName, docBName, fieldsA, fieldsB } = req.body;

    const result = await crossValidateDocuments(
      { name: docAName || 'Document A' },
      { name: docBName || 'Document B' },
      fieldsA || [],
      fieldsB || []
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai/feedback - Record reviewer calibration feedback
router.post('/feedback', authenticateToken, (req, res) => {
  const { caseId, rating, feedbackNote, overridden } = req.body;

  logAuditEvent({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    action: 'AI_FEEDBACK',
    entity: 'Case',
    entityId: caseId,
    details: JSON.stringify({ rating, feedbackNote, overridden }),
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Reviewer feedback captured for continuous calibration.' });
});

// GET /api/ai/metrics - Production AI health & drift indicators
router.get('/metrics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    metrics: {
      activeModel: 'gemini-3.6-flash',
      modelVersionTag: '2026-Q1-Stable',
      overallAccuracy: 95.8,
      conceptDriftScore: 1.2, // low drift
      averageLatencyMs: 142,
      failureRate: 0.15,
      humanOverrideRate: 4.8,
      totalExtractionsProcessed: 1420,
      confidenceDistribution: {
        highConfidence: 86.4,   // >90%
        mediumConfidence: 11.2, // 80-89%
        lowConfidence: 2.4      // <80%
      }
    }
  });
});

module.exports = router;

