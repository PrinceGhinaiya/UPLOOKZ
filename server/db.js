import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase, getSqliteDb } from './database/dbConnection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB engine on module import
connectDatabase().catch(err => {
  console.error('[UPLOOKZ DB] Initialization error:', err);
});

const FILE_TO_TABLE = {
  'salons.json': 'salons',
  'services.json': 'services',
  'staff.json': 'staff',
  'appointments.json': 'appointments',
  'queue.json': 'queue',
  'reviews.json': 'reviews',
  'transactions.json': 'transactions',
  'blocked_slots.json': 'blocked_slots',
  'notifications.json': 'notifications',
  'customer_notes.json': 'customer_notes',
  'users.json': 'users'
};

/**
 * Read data from persistent SQLite database
 */
export function readData(filename, defaultData = []) {
  const tableName = FILE_TO_TABLE[filename];
  if (!tableName) return defaultData;

  try {
    const db = getSqliteDb();
    const rows = db.prepare(`SELECT id, data FROM ${tableName}`).all();

    if (filename === 'users.json') {
      const resultObj = {};
      for (const row of rows) {
        try {
          const doc = JSON.parse(row.data);
          const key = doc.phone || doc.email || row.id;
          resultObj[key] = { ...doc, id: row.id };
        } catch {}
      }
      return resultObj;
    }

    if (filename === 'customer_notes.json') {
      const resultObj = {};
      for (const row of rows) {
        try {
          const doc = JSON.parse(row.data);
          const key = doc.customerId || row.id;
          resultObj[key] = { ...doc, id: row.id };
        } catch {}
      }
      return resultObj;
    }

    return rows.map(r => {
      try {
        const doc = JSON.parse(r.data);
        return { ...doc, id: r.id };
      } catch {
        return { id: r.id };
      }
    });
  } catch (err) {
    console.error(`[UPLOOKZ DB ERROR] Reading ${filename} from SQLite table ${tableName}:`, err.message);
    return defaultData;
  }
}

/**
 * Write data to persistent SQLite database with ACID transaction
 */
export function writeData(filename, data) {
  const tableName = FILE_TO_TABLE[filename];
  if (!tableName) return false;

  try {
    const db = getSqliteDb();
    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO ${tableName} (id, data, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `);

    let records = [];
    if (Array.isArray(data)) {
      records = data;
    } else if (typeof data === 'object' && data !== null) {
      records = Object.entries(data).map(([key, val]) => {
        if (typeof val === 'object' && val !== null) {
          return {
            ...val,
            id: val.id || key
          };
        }
        return null;
      }).filter(Boolean);
    }

    const tx = db.transaction((recs) => {
      const activeIds = new Set();
      for (const rec of recs) {
        if (!rec) continue;
        const id = rec.id || rec._id || `id_${Date.now()}`;
        activeIds.add(id);
        const cleanDoc = { ...rec, id };
        const createdAt = cleanDoc.createdAt || now;
        const updatedAt = cleanDoc.updatedAt || now;
        insertStmt.run(id, JSON.stringify(cleanDoc), createdAt, updatedAt);
      }

      // If writing an array (e.g. services, appointments, queue, staff), remove records pruned from the array
      if (Array.isArray(data)) {
        const existingRows = db.prepare(`SELECT id FROM ${tableName}`).all();
        const deleteStmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
        for (const row of existingRows) {
          if (!activeIds.has(row.id)) {
            deleteStmt.run(row.id);
          }
        }
      }
    });

    tx(records);
    return true;
  } catch (err) {
    console.error(`[UPLOOKZ DB ERROR] Writing ${filename} to SQLite table ${tableName}:`, err.message);
    return false;
  }
}

/**
 * Initialize database - ensures connection and schemas are ready.
 * Does NOT generate fake data.
 */
export function initializeDatabase() {
  getSqliteDb();
  console.log('[UPLOOKZ DB] Database layer ready (source of truth: persistent SQLite).');
}
