const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'university_doc_hub_super_secure_jwt_secret_2026_production_ready';

/**
 * Verify JWT token and attach user to request
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required. Please sign in.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Session expired or invalid token. Please sign in again.'
      });
    }

    const user = db.users.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Authenticated user record not found.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'User account is inactive. Please contact Compliance Admin.'
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Enforce allowed roles
 */
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};

