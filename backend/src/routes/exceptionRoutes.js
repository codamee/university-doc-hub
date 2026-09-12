const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { logAuditEvent } = require('../services/auditService');

// GET /api/exceptions - List exception queue
router.get('/', authenticateToken, requireRole(['Reviewer', 'Supervisor', 'Compliance Admin']), (req, res) => {
  const { type, severity, status = 'OPEN' } = req.query;

  let exceptions = db.exceptions.getAll();

  if (type && type !== 'ALL') {
    exceptions = exceptions.filter(e => e.exceptionType === type);
  }
  if (severity && severity !== 'ALL') {
    exceptions = exceptions.filter(e => e.severity === severity);
  }
  if (status && status !== 'ALL') {
    exceptions = exceptions.filter(e => e.status === status);
  }

  // Enrich with case details
  const enriched = exceptions.map(exc => {
    const caseItem = db.cases.findById(exc.caseId) || {};
    return {
      ...exc,
      caseNumber: exc.caseNumber || caseItem.caseNumber || 'N/A',
      applicantName: exc.applicantName || caseItem.applicantName || 'Unknown Applicant',
      category: caseItem.category || 'General',
      department: caseItem.department || 'N/A'
    };
  });

  // Sort by createdAt descending
  enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    total: enriched.length,
    exceptions: enriched
  });
});

// POST /api/exceptions/:id/resolve - Resolve, Override, Request Correction, or Escalate
router.post('/:id/resolve', authenticateToken, requireRole(['Reviewer', 'Supervisor', 'Compliance Admin']), (req, res) => {
  const { action, reason, correctionNote } = req.body;
  const exc = db.exceptions.findById(req.params.id);

  if (!exc) {
    return res.status(404).json({ success: false, error: 'Exception record not found' });
  }

  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: 'A mandatory justification reason (min 5 characters) is required to resolve an exception.'
    });
  }

  let newStatus = 'RESOLVED';
  if (action === 'OVERRIDE') newStatus = 'OVERRIDDEN';
  if (action === 'ESCALATE') newStatus = 'ESCALATED';
  if (action === 'REQUEST_CORRECTION') newStatus = 'CORRECTION_REQUESTED';

  const updated = db.exceptions.updateById(exc.id, {
    status: newStatus,
    resolutionAction: action,
    resolutionReason: reason,
    correctionNote: correctionNote || null,
    resolvedBy: req.user.email,
    resolvedByName: req.user.name,
    resolvedAt: new Date().toISOString()
  });

  // Also update case status if escalated or correction requested
  if (exc.caseId) {
    if (action === 'ESCALATE') {
      db.cases.updateById(exc.caseId, {
        status: 'ESCALATED',
        assignedTo: 'supervisor@university.edu',
        assignedToName: 'Prof. Marcus Vance'
      });
    } else if (action === 'REQUEST_CORRECTION') {
      db.cases.updateById(exc.caseId, {
        status: 'UNDER_REVIEW',
        reviewerNotes: `Correction requested: ${reason}`
      });
    }
  }

  logAuditEvent({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    action: `EXCEPTION_${action}`,
    entity: 'Exception',
    entityId: exc.id,
    details: JSON.stringify({ action, reason, correctionNote }),
    previousState: exc.status,
    newState: newStatus,
    ipAddress: req.ip
  });

  res.json({ success: true, exception: updated });
});

module.exports = router;

