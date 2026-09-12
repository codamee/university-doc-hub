const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/supervisor/workload - Reviewer workload and queue depth
router.get('/workload', authenticateToken, requireRole(['Supervisor', 'Compliance Admin']), (req, res) => {
  const cases = db.cases.getAll();
  const reviewers = db.users.find(u => u.role === 'Reviewer');

  const workloadByReviewer = reviewers.map(r => {
    const assignedCases = cases.filter(c => c.assignedTo === r.email);
    const activeCases = assignedCases.filter(c => c.status === 'UNDER_REVIEW' || c.status === 'EXCEPTION');
    const completedCases = assignedCases.filter(c => c.status === 'APPROVED' || c.status === 'REJECTED');
    const urgentCases = assignedCases.filter(c => c.priority === 'HIGH' && c.status !== 'APPROVED');

    return {
      reviewerId: r.id,
      name: r.name,
      email: r.email,
      department: r.department,
      activeCount: activeCases.length,
      completedCount: completedCases.length,
      urgentCount: urgentCases.length,
      avgConfidence: 93.4
    };
  });

  res.json({
    success: true,
    workload: workloadByReviewer
  });
});

// GET /api/supervisor/ageing - Ageing and SLA turnaround time
router.get('/ageing', authenticateToken, requireRole(['Supervisor', 'Compliance Admin']), (req, res) => {
  const cases = db.cases.getAll().filter(c => c.status === 'UNDER_REVIEW' || c.status === 'EXCEPTION' || c.status === 'ESCALATED');
  const now = Date.now();

  let under24h = 0;
  let between24and48h = 0;
  let over48h = 0;

  cases.forEach(c => {
    const created = new Date(c.createdAt).getTime();
    const ageHours = (now - created) / (1000 * 3600);
    if (ageHours <= 24) under24h++;
    else if (ageHours <= 48) between24and48h++;
    else over48h++;
  });

  res.json({
    success: true,
    ageing: {
      under24h,
      between24and48h,
      over48h,
      totalBacklog: cases.length,
      slaTargetHours: 48
    }
  });
});

module.exports = router;

