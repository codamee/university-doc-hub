const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * Initialize clean database state without dummy submissions or fake cases.
 * Seeds only a master compliance admin if no users exist.
 */
const seedInitialData = async () => {
  const existingUsers = db.users.getAll();

  if (existingUsers.length === 0) {
    console.log('[Seed] No users found. Initializing master university administrator...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const defaultAdmin = {
      id: 'usr_admin_master',
      name: 'University Compliance Admin',
      email: 'admin@university.edu',
      passwordHash,
      role: 'Compliance Admin',
      department: 'Governance & Institutional Compliance',
      status: 'ACTIVE',
      lastLogin: null
    };

    db.users.insert(defaultAdmin);
    console.log('[Seed] Master admin account created: admin@university.edu');
  } else {
    console.log(`[Seed] System ready with ${existingUsers.length} registered user(s). No dummy cases or test documents.`);
  }
};

module.exports = {
  seedInitialData
};
