const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { runCaseValidation } = require('../services/validationService');
const { logAuditEvent } = require('../services/auditService');

// POST /api/validation/run/:caseId - Trigger complete rules engine
router.post('/run/:caseId', authenticateToken, requireRole(['Reviewer', 'Supervisor', 'Compliance Admin']), (req, res) => {
  const caseItem = db.cases.findById(req.params.caseId);
  if (!caseItem) {
    return res.status(404).json({ success: false, error: 'Case not found' });
  }

  const documents = db.documents.find(d => d.caseId === caseItem.id);
  const fields = db.extractedFields.find(f => f.caseId === caseItem.id);

  const results = runCaseValidation(caseItem, documents, fields);

  // Upsert any generated exceptions
  results.exceptionsGenerated.forEach(exc => {
    const existing = db.exceptions.findOne(e => e.caseId === exc.caseId && e.exceptionType === exc.exceptionType && e.fieldKey === exc.fieldKey);
    if (!existing) {
      db.exceptions.insert(exc);
    }
  });

  logAuditEvent({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    action: 'VALIDATION_EXECUTE',
    entity: 'Case',
    entityId: caseItem.id,
    details: JSON.stringify({ rulesCount: results.rules.length, allPassed: results.allPassed }),
    ipAddress: req.ip
  });

  res.json({
    success: true,
    results
  });
});

// POST /api/validation/override-field - Human reviewer overrides AI extracted value
router.post('/override-field', authenticateToken, requireRole(['Reviewer', 'Supervisor', 'Compliance Admin']), (req, res) => {
  const { fieldId, newValue, justificationReason } = req.body;

  if (!fieldId) {
    return res.status(400).json({ success: false, error: 'fieldId is required.' });
  }

  if (!justificationReason || justificationReason.trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: 'A mandatory justification reason (min 5 characters) is required to override an AI extracted value.'
    });
  }

  const field = db.extractedFields.findById(fieldId);
  if (!field) {
    return res.status(404).json({ success: false, error: 'Extracted field record not found.' });
  }

  const prevValue = field.approvedValue || field.extractedValue;
  const updated = db.extractedFields.updateById(fieldId, {
    approvedValue: newValue,
    status: 'OVERRIDDEN',
    reviewerNotes: justificationReason,
    overriddenBy: req.user.email,
    overriddenAt: new Date().toISOString()
  });

  logAuditEvent({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    action: 'FIELD_OVERRIDE',
    entity: 'ExtractedField',
    entityId: field.id,
    details: JSON.stringify({
      fieldKey: field.fieldKey,
      previousValue: prevValue,
      newValue,
      justificationReason
    }),
    previousState: prevValue,
    newState: newValue,
    ipAddress: req.ip
  });

  res.json({ success: true, field: updated });
});

module.exports = router;

