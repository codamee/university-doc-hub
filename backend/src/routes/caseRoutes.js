const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { logAuditEvent } = require('../services/auditService');

// GET /api/cases - List with filtering, search, pagination & role-isolation
router.get('/', authenticateToken, (req, res) => {
  const { search, category, status, priority, page = 1, limit = 20 } = req.query;
  const user = req.user;

  let cases = db.cases.getAll();

  // Role-based visibility enforcement
  if (user.role === 'Applicant') {
    cases = cases.filter(c => c.applicantEmail?.toLowerCase() === user.email.toLowerCase() || c.applicantId === user.id);
  }

  // Filters
  if (search) {
    const q = search.toLowerCase();
    cases = cases.filter(c =>
      c.caseNumber.toLowerCase().includes(q) ||
      c.applicantName.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      (c.degreeProgram && c.degreeProgram.toLowerCase().includes(q))
    );
  }

  if (category && category !== 'ALL') {
    cases = cases.filter(c => c.category === category);
  }

  if (status && status !== 'ALL') {
    cases = cases.filter(c => c.status === status);
  }

  if (priority && priority !== 'ALL') {
    cases = cases.filter(c => c.priority === priority);
  }

  // Sort by updatedAt descending
  cases.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  const total = cases.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const paginated = cases.slice((p - 1) * l, p * l);

  res.json({
    success: true,
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l),
    cases: paginated
  });
});

// GET /api/cases/:id - Single case with full aggregated context
router.get('/:id', authenticateToken, (req, res) => {
  const caseItem = db.cases.findById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ success: false, error: 'Case not found' });
  }

  // Permissions check for Applicant
  if (req.user.role === 'Applicant' && caseItem.applicantEmail?.toLowerCase() !== req.user.email.toLowerCase() && caseItem.applicantId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied to this case' });
  }

  const documents = db.documents.find(d => d.caseId === caseItem.id);
  const extractedFields = db.extractedFields.find(f => f.caseId === caseItem.id);
  const exceptions = db.exceptions.find(e => e.caseId === caseItem.id);
  const decisionLogs = db.decisionLogs.find(d => d.caseId === caseItem.id);
  const comments = caseItem.comments || [];

  res.json({
    success: true,
    case: caseItem,
    documents,
    extractedFields,
    exceptions,
    decisionLogs,
    comments
  });
});

// POST /api/cases - Create new case
router.post('/', authenticateToken, (req, res) => {
  const { category, applicantName, applicantEmail, department, degreeProgram, priority = 'MEDIUM' } = req.body;

  if (!category || !applicantName) {
    return res.status(400).json({ success: false, error: 'Category and Applicant Name are required.' });
  }

  const caseNumPrefix = category.slice(0, 3).toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const caseNumber = `UHD-2026-${caseNumPrefix}-${randomNum}`;

  const newCase = db.cases.insert({
    caseNumber,
    category,
    applicantName,
    applicantEmail: applicantEmail || req.user.email,
    applicantId: req.user.id,
    department: department || req.user.department || 'General Admissions',
    degreeProgram: degreeProgram || 'Degree Program Pending Review',
    priority,
    status: 'UNDER_REVIEW',
    assignedTo: 'reviewer@university.edu',
    assignedToName: 'Dr. Elena Rostova',
    aiSummary: 'New case submitted. Awaiting document ingestion and AI extraction processing.',
    aiRecommendation: 'PENDING_EXTRACTION',
    aiConfidence: null,
    riskScore: null,
    slaHoursRemaining: 48,
    comments: []
  });

  logAuditEvent({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    action: 'CASE_CREATE',
    entity: 'Case',
    entityId: newCase.id,
    details: JSON.stringify({ caseNumber, category, applicantName }),
    ipAddress: req.ip
  });

  // Notify Reviewers
  db.notifications.insert({
    recipientRole: 'Reviewer',
    title: `New Case Intake: ${caseNumber}`,
    message: `${applicantName} submitted a new ${category} case.`,
    type: 'ASSIGNMENT',
    severity: 'NORMAL',
    isRead: false,
    link: `/cases/${newCase.id}`
  });

  res.status(201).json({ success: true, case: newCase });
});

// PATCH /api/cases/:id/status - Authorised human decision (Approve, Reject, Request Correction, Escalate)
router.patch('/:id/status', authenticateToken, requireRole(['Reviewer', 'Supervisor', 'Compliance Admin']), (req, res) => {
  const { status, reason, overrideNote } = req.body;
  const caseItem = db.cases.findById(req.params.id);

  if (!caseItem) {
    return res.status(404).json({ success: false, error: 'Case not found' });
  }

  if (!status) {
    return res.status(400).json({ success: false, error: 'New status is required.' });
  }

  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: 'A mandatory justification reason (min 5 characters) is required for material decisions.'
    });
  }

  const previousStatus = caseItem.status;
  const updated = db.cases.updateById(caseItem.id, {
    status,
    reviewerNotes: reason,
    updatedAt: new Date().toISOString()
  });

  // Record Decision Log
  db.decisionLogs.insert({
    caseId: caseItem.id,
    caseNumber: caseItem.caseNumber,
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: status,
    previousStatus,
    newStatus: status,
    reason,
    overrideNote: overrideNote || null,
    timestamp: new Date().toISOString()
  });

  logAuditEvent({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    action: `CASE_${status}`,
    entity: 'Case',
    entityId: caseItem.id,
    details: JSON.stringify({ reason, previousStatus, newStatus: status, overrideNote }),
    previousState: previousStatus,
    newState: status,
    ipAddress: req.ip
  });

  res.json({ success: true, case: updated });
});

// POST /api/cases/:id/comments - Add collaboration comment
router.post('/:id/comments', authenticateToken, (req, res) => {
  const { text } = req.body;
  const caseItem = db.cases.findById(req.params.id);

  if (!caseItem) {
    return res.status(404).json({ success: false, error: 'Case not found' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: 'Comment text cannot be empty' });
  }

  const comments = caseItem.comments || [];
  const newComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    authorId: req.user.id,
    authorName: req.user.name,
    authorRole: req.user.role,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  db.cases.updateById(caseItem.id, { comments });

  res.status(201).json({ success: true, comment: newComment });
});

// POST /api/cases/:id/reassign - Supervisor reassigns case
router.post('/:id/reassign', authenticateToken, requireRole(['Supervisor', 'Compliance Admin']), (req, res) => {
  const { assignedToEmail, assignedToName, reason } = req.body;
  const caseItem = db.cases.findById(req.params.id);

  if (!caseItem) {
    return res.status(404).json({ success: false, error: 'Case not found' });
  }

  const prevAssignee = caseItem.assignedTo;
  const updated = db.cases.updateById(caseItem.id, {
    assignedTo: assignedToEmail,
    assignedToName: assignedToName || assignedToEmail
  });

  logAuditEvent({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    action: 'CASE_REASSIGN',
    entity: 'Case',
    entityId: caseItem.id,
    details: JSON.stringify({ previousAssignee: prevAssignee, newAssignee: assignedToEmail, reason }),
    ipAddress: req.ip
  });

  res.json({ success: true, case: updated });
});

module.exports = router;

