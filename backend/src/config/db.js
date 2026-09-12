const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Path for file-backed storage if Mongo Atlas has placeholder or connection issue
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory / file-synced store
let memoryStore = {
  users: [],
  cases: [],
  documents: [],
  extractedFields: [],
  validationRules: [],
  exceptions: [],
  decisionLogs: [],
  auditLogs: [],
  notifications: [],
  settings: {
    aiConfidenceThreshold: 80,
    slaTargetHours: 48,
    geminiModel: 'gemini-3.6-flash',
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    malwareScanningEnabled: true,
    requireReviewBelowConfidence: 85,
    autoRouteExceptions: true
  }
};

// Load saved data if available
const loadStore = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryStore = { ...memoryStore, ...parsed };
      console.log(`[DB] Successfully loaded local data store (${memoryStore.cases.length} cases, ${memoryStore.users.length} users).`);
    }
  } catch (err) {
    console.warn('[DB] Could not load local data store, using defaults:', err.message);
  }
};

const saveStore = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to save local store:', err.message);
  }
};

// Initialize connection
let isMongoConnected = false;

const initDB = async () => {
  loadStore();
  const uri = process.env.MONGODB_URI;

  if (uri && !uri.includes('<db_username>')) {
    try {
      console.log('[DB] Connecting to MongoDB Atlas...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
      });
      isMongoConnected = true;
      console.log('[DB] Connected to MongoDB Atlas successfully!');

      // Load existing records from Atlas collections if available
      try {
        const collections = ['users', 'cases', 'documents', 'extractedFields', 'exceptions', 'decisionLogs', 'auditLogs', 'notifications'];
        for (const colName of collections) {
          const col = mongoose.connection.db.collection(colName);
          const items = await col.find({}).toArray();
          if (items && items.length > 0) {
            memoryStore[colName] = items.map(item => {
              const { _id, ...clean } = item;
              return { id: clean.id || _id?.toString(), ...clean };
            });
            console.log(`[DB] Synced ${items.length} records from Atlas collection: ${colName}`);
          }
        }
        saveStore();
      } catch (syncErr) {
        console.warn('[DB] Atlas collection initial sync note:', syncErr.message);
      }
    } catch (err) {
      console.warn('[DB] MongoDB Atlas connection failed. Falling back to high-performance local storage:', err.message);
      isMongoConnected = false;
    }
  } else {
    console.log('[DB] MongoDB URI contains placeholder <db_username>. Using High-Performance local persistent store.');
    console.log('[DB] To connect to MongoDB Atlas, replace <db_username> with your MongoDB Atlas database username in backend/.env');
  }
};

// Generic Collection Accessor with Atlas Write-Through
class Collection {
  constructor(name) {
    this.name = name;
  }

  getAll() {
    return memoryStore[this.name] || [];
  }

  find(predicate) {
    const list = this.getAll();
    if (!predicate) return [...list];
    return list.filter(predicate);
  }

  findOne(predicate) {
    const list = this.getAll();
    return list.find(predicate) || null;
  }

  findById(id) {
    return this.findOne(item => item.id === id || item._id === id);
  }

  insert(item) {
    if (!item.id && !item._id) {
      item.id = `${this.name.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    } else if (!item.id && item._id) {
      item.id = item._id.toString();
    }
    if (!item.createdAt) item.createdAt = new Date().toISOString();
    if (!item.updatedAt) item.updatedAt = new Date().toISOString();

    if (!memoryStore[this.name]) {
      memoryStore[this.name] = [];
    }
    memoryStore[this.name].push(item);
    saveStore();

    // Write-Through to MongoDB Atlas if connected
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      mongoose.connection.db.collection(this.name).insertOne({ ...item })
        .catch(err => console.warn(`[DB] Atlas write warning for ${this.name}:`, err.message));
    }

    return item;
  }

  updateById(id, updates) {
    const list = this.getAll();
    const idx = list.findIndex(item => item.id === id || item._id === id);
    if (idx === -1) return null;

    const updated = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    list[idx] = updated;
    saveStore();

    // Update in MongoDB Atlas if connected
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      mongoose.connection.db.collection(this.name).updateOne(
        { id },
        { $set: { ...updates, updatedAt: updated.updatedAt } }
      ).catch(err => console.warn(`[DB] Atlas update warning for ${this.name}:`, err.message));
    }

    return updated;
  }

  deleteById(id) {
    const list = this.getAll();
    const idx = list.findIndex(item => item.id === id || item._id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    saveStore();

    // Delete in MongoDB Atlas if connected
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      mongoose.connection.db.collection(this.name).deleteOne({ id })
        .catch(err => console.warn(`[DB] Atlas delete warning for ${this.name}:`, err.message));
    }

    return true;
  }

  count(predicate) {
    return this.find(predicate).length;
  }
}

const db = {
  users: new Collection('users'),
  cases: new Collection('cases'),
  documents: new Collection('documents'),
  extractedFields: new Collection('extractedFields'),
  validationRules: new Collection('validationRules'),
  exceptions: new Collection('exceptions'),
  decisionLogs: new Collection('decisionLogs'),
  auditLogs: new Collection('auditLogs'),
  notifications: new Collection('notifications'),
  getSettings: () => memoryStore.settings,
  updateSettings: (newSettings) => {
    memoryStore.settings = { ...memoryStore.settings, ...newSettings };
    saveStore();
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      mongoose.connection.db.collection('settings').updateOne(
        { key: 'global_settings' },
        { $set: { key: 'global_settings', ...memoryStore.settings } },
        { upsert: true }
      ).catch(err => console.warn('[DB] Atlas settings save warning:', err.message));
    }
    return memoryStore.settings;
  },
  initDB,
  saveStore,
  isMongoConnected: () => isMongoConnected
};

module.exports = db;
