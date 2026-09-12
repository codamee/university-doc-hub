const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { logAuditEvent } = require('../services/auditService');

// GET /api/audit-logs - Searchable, immutable audit trail (Admin & Supervisor)
router.get('/logs', authenticateToken, requireRole(['Compliance Admin', 'Supervisor']), (req, res) => {
  const { action, actorRole, entity, search, page = 1, limit = 50 } = req.query;

  let logs = db.auditLogs.getAll();

  if (action && action !== 'ALL') {
    logs = logs.filter(l => l.action === action);
  }
  if (actorRole && actorRole !== 'ALL') {
    logs = logs.filter(l => l.actorRole === actorRole);
  }
  if (entity && entity !== 'ALL') {
    logs = logs.filter(l => l.entity === entity);
  }
  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter(l =>
      (l.actorEmail && l.actorEmail.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q)) ||
      (l.entityId && l.entityId.toLowerCase().includes(q)) ||
      (l.action && l.action.toLowerCase().includes(q))
    );
  }

  // Immutable audit logs: sorted by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const total = logs.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const paginated = logs.slice((p - 1) * l, p * l);

  res.json({
    success: true,
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l),
    logs: paginated
  });
});

// GET /api/settings - System settings & thresholds
router.get('/settings', authenticateToken, (req, res) => {
  res.json({
    success: true,
    settings: db.getSettings()
  });
});

// PATCH /api/settings - Update system thresholds (Admin only)
router.patch('/settings', authenticateToken, requireRole(['Compliance Admin']), (req, res) => {
  const previous = db.getSettings();
  const updated = db.updateSettings(req.body);

  logAuditEvent({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    action: 'SETTINGS_UPDATE',
    entity: 'Settings',
    details: JSON.stringify({ previous, updated }),
    previousState: previous,
    newState: updated,
    ipAddress: req.ip
  });

  res.json({
    success: true,
    settings: updated
  });
});

module.exports = router;

