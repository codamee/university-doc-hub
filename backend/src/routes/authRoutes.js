const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET, authenticateToken } = require('../middleware/authMiddleware');
const { logAuditEvent } = require('../services/auditService');

const VALID_ROLES = ['Applicant', 'Reviewer', 'Supervisor', 'Compliance Admin'];

// POST /api/auth/register - Register a new university user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'Applicant', department } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role selected. Allowed roles: ${VALID_ROLES.join(', ')}`
      });
    }

    // Check if user already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.users.findOne(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Default department mapping if not provided
    const defaultDept = {
      'Applicant': 'Student Admissions Candidate',
      'Reviewer': 'Academic Admissions & Verification',
      'Supervisor': 'Registrar Supervisory Operations',
      'Compliance Admin': 'Governance & Institutional Compliance'
    };

    const newUser = db.users.insert({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      department: department?.trim() || defaultDept[role] || 'University General',
      status: 'ACTIVE',
      lastLogin: new Date().toISOString()
    });

    // Sign JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logAuditEvent({
      actorId: newUser.id,
      actorEmail: newUser.email,
      actorRole: newUser.role,
      action: 'AUTH_REGISTER',
      entity: 'User',
      entityId: newUser.id,
      details: JSON.stringify({ name: newUser.name, email: newUser.email, role: newUser.role, department: newUser.department }),
      ipAddress: req.ip || req.connection.remoteAddress,
      status: 'SUCCESS'
    });

    const { passwordHash: _, ...userProfile } = newUser;
    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login - Sign in
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.findOne(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    logAuditEvent({
      actorEmail: normalizedEmail,
      actorRole: 'Unknown',
      action: 'AUTH_LOGIN_FAILED',
      entity: 'User',
      details: 'User account not found',
      ipAddress: req.ip || req.connection.remoteAddress,
      status: 'FAILED'
    });
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password. Please verify your credentials or register.'
    });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'AUTH_LOGIN_FAILED',
      entity: 'User',
      entityId: user.id,
      details: 'Incorrect password entered',
      ipAddress: req.ip || req.connection.remoteAddress,
      status: 'FAILED'
    });
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password. Please try again.'
    });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      error: 'Your account has been deactivated. Please contact an administrator.'
    });
  }

  // Update last login
  db.users.updateById(user.id, { lastLogin: new Date().toISOString() });

  // Sign JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  logAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'AUTH_LOGIN_SUCCESS',
    entity: 'User',
    entityId: user.id,
    details: 'User signed in successfully',
    ipAddress: req.ip || req.connection.remoteAddress,
    status: 'SUCCESS'
  });

  const { passwordHash: _, ...userProfile } = user;
  res.json({
    success: true,
    token,
    user: userProfile
  });
});

// GET /api/auth/me - Check current token session
router.get('/me', authenticateToken, (req, res) => {
  const { passwordHash, ...userProfile } = req.user;
  res.json({
    success: true,
    user: userProfile
  });
});

module.exports = router;
