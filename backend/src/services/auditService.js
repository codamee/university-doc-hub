const db = require('../config/db');

/**
 * Log an immutable audit event
 */
const logAuditEvent = ({
  actorId = 'system',
  actorEmail = 'system@university.edu',
  actorRole = 'System',
  action,
  entity,
  entityId = null,
  details = {},
  previousState = null,
  newState = null,
  ipAddress = '127.0.0.1',
  userAgent = 'Internal',
  status = 'SUCCESS'
}) => {
  const event = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
    timestamp: new Date().toISOString(),
    actorId,
    actorEmail,
    actorRole,
    action, // e.g. AUTH_LOGIN, DOC_UPLOAD, AI_EXTRACT, CASE_APPROVE, REVIEWER_OVERRIDE
    entity, // e.g. Case, Document, ExtractedField, Exception, User, Settings
    entityId,
    details: typeof details === 'string' ? details : JSON.stringify(details),
    previousState: previousState ? (typeof previousState === 'string' ? previousState : JSON.stringify(previousState)) : null,
    newState: newState ? (typeof newState === 'string' ? newState : JSON.stringify(newState)) : null,
    ipAddress,
    userAgent,
    status
  };

  db.auditLogs.insert(event);
  return event;
};

module.exports = {
  logAuditEvent
};

