const db = require('../config/db');

/**
 * Run comprehensive validation rules on a case and its documents
 */
const runCaseValidation = (caseItem, documents = [], fields = []) => {
  const rules = [];
  const exceptionsGenerated = [];
  const settings = db.getSettings();
  const threshold = settings.aiConfidenceThreshold || 80;

  // Rule 1: Mandatory Fields Completeness
  const requiredKeys = ['student_name', 'program_title'];
  if (caseItem.category === 'Admission') {
    requiredKeys.push('cumulative_gpa');
  }

  requiredKeys.forEach(reqKey => {
    const found = fields.find(f => f.fieldKey === reqKey && f.extractedValue);
    const passed = Boolean(found && found.extractedValue.trim().length > 0);
    rules.push({
      id: `rule_comp_${reqKey}`,
      ruleName: `Mandatory Field: ${reqKey}`,
      category: 'COMPLETENESS',
      severity: 'CRITICAL',
      passed,
      message: passed ? `Field '${reqKey}' successfully captured.` : `Mandatory field '${reqKey}' is missing or blank.`,
      fieldKey: reqKey
    });

    if (!passed) {
      exceptionsGenerated.push({
        caseId: caseItem.id,
        exceptionType: 'MISSING_DATA',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: `Missing required field: ${reqKey} for case ${caseItem.caseNumber}`,
        assignedTo: caseItem.assignedTo || 'reviewer@university.edu'
      });
    }
  });

  // Rule 2: Low-Confidence Detection
  fields.forEach(field => {
    const conf = field.confidence || 0;
    if (conf < threshold) {
      rules.push({
        id: `rule_conf_${field.fieldKey}`,
        ruleName: `Confidence Check: ${field.label}`,
        category: 'ACCURACY',
        severity: 'WARNING',
        passed: false,
        message: `Field '${field.label}' extracted with ${conf}% confidence (below threshold of ${threshold}%).`,
        fieldKey: field.fieldKey
      });

      exceptionsGenerated.push({
        caseId: caseItem.id,
        documentId: field.documentId,
        exceptionType: 'LOW_CONFIDENCE',
        severity: 'WARNING',
        status: 'OPEN',
        description: `Field '${field.label}' has low confidence score (${conf}% < ${threshold}%). Human verification required.`,
        assignedTo: caseItem.assignedTo || 'reviewer@university.edu'
      });
    }
  });

  // Rule 3: Document Expiry Check
  const expiryField = fields.find(f => f.fieldKey.includes('expiry') || f.fieldKey.includes('valid_until'));
  if (expiryField && expiryField.extractedValue) {
    const expDate = new Date(expiryField.extractedValue);
    const now = new Date();
    const isExpired = !isNaN(expDate.getTime()) && expDate < now;
    rules.push({
      id: 'rule_expiry',
      ruleName: 'Document Expiration Validity',
      category: 'EXPIRY',
      severity: 'CRITICAL',
      passed: !isExpired,
      message: isExpired ? `Document expired on ${expiryField.extractedValue}.` : `Document is valid until ${expiryField.extractedValue}.`,
      fieldKey: expiryField.fieldKey
    });

    if (isExpired) {
      exceptionsGenerated.push({
        caseId: caseItem.id,
        exceptionType: 'EXPIRED_DOCUMENT',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: `Uploaded document is past expiration date (${expiryField.extractedValue}). Updated certificate required.`,
        assignedTo: caseItem.assignedTo || 'reviewer@university.edu'
      });
    }
  }

  // Rule 4: Duplicate Submission Check
  documents.forEach(doc => {
    if (doc.checksumSha256) {
      const existingDoc = db.documents.findOne(d => d.checksumSha256 === doc.checksumSha256 && d.caseId !== caseItem.id);
      if (existingDoc) {
        rules.push({
          id: `rule_dup_${doc.id}`,
          ruleName: `Duplicate Document Check: ${doc.originalName}`,
          category: 'INTEGRITY',
          severity: 'CRITICAL',
          passed: false,
          message: `Identical SHA-256 hash discovered in Case ${existingDoc.caseId}. Possible duplicate upload.`
        });

        exceptionsGenerated.push({
          caseId: caseItem.id,
          documentId: doc.id,
          exceptionType: 'DUPLICATE_SUBMISSION',
          severity: 'CRITICAL',
          status: 'OPEN',
          description: `Duplicate document payload found matching Case ${existingDoc.caseId}. Integrity check flagged.`,
          assignedTo: caseItem.assignedTo || 'reviewer@university.edu'
        });
      }
    }
  });

  // Rule 5: Malware Cleanliness
  documents.forEach(doc => {
    const isClean = doc.malwareStatus === 'CLEAN';
    rules.push({
      id: `rule_malware_${doc.id}`,
      ruleName: `SecOps Scan: ${doc.originalName}`,
      category: 'SECURITY',
      severity: 'CRITICAL',
      passed: isClean,
      message: isClean ? 'SecOps signature verification passed. File clean.' : `Threat flagged: ${doc.malwareStatus}`
    });
  });

  return {
    rules,
    exceptionsGenerated,
    allPassed: rules.every(r => r.passed)
  };
};

module.exports = {
  runCaseValidation
};

