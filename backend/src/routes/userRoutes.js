const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { logAuditEvent } = require('../services/auditService');

// GET /api/users - List users (Admin & Supervisor)
router.get('/', authenticateToken, requireRole(['Compliance Admin', 'Supervisor']), (req, res) => {
  const users = db.users.getAll().map(u => {
    const { passwordHash, ...safe } = u;
    return safe;
  });

  res.json({ success: true, users });
});

// POST /api/users - Create new user (Admin only)
router.post('/', authenticateToken, requireRole(['Compliance Admin']), async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, error: 'Name, email, password, and role are required.' });
  }

  const existing = db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, error: 'A user with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = db.users.insert({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    department: department || 'General',
    status: 'ACTIVE',
    lastLogin: null
  });

  logAuditEvent({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    action: 'USER_CREATE',
    entity: 'User',
    entityId: newUser.id,
    details: JSON.stringify({ email, role, department }),
    ipAddress: req.ip
  });

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, user: safeUser });
});

// PATCH /api/users/:id - Update user status or role (Admin only)
router.patch('/:id', authenticateToken, requireRole(['Compliance Admin']), async (req, res) => {
  const { role, department, status, password } = req.body;
  const user = db.users.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const updates = {};
  if (role) updates.role = role;
  if (department) updates.department = department;
  if (status) updates.status = status;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  const prev = { role: user.role, department: user.department, status: user.status };
  const updated = db.users.updateById(user.id, updates);

  logAuditEvent({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    action: 'USER_UPDATE',
    entity: 'User',
    entityId: user.id,
    details: JSON.stringify({ previous: prev, updated: updates }),
    previousState: prev,
    newState: updates,
    ipAddress: req.ip
  });

  const { passwordHash: _, ...safe } = updated;
  res.json({ success: true, user: safe });
});

module.exports = router;

