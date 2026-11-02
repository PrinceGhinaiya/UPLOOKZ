import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'uplookz.sqlite');

let isConnected = false;
let dbType = 'sqlite'; // 'mongo' | 'sqlite'
let sqliteDb = null;

/**
 * Initialize SQLite database with table schemas and indexes
 */
function initSqlite() {
  if (sqliteDb) return sqliteDb;

  sqliteDb = new Database(DB_FILE);
  sqliteDb.pragma('journal_mode = WAL'); // High concurrency and durability
  sqliteDb.pragma('synchronous = NORMAL');

  // Create core tables storing normalized documents with fast indexed fields
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT,
      name TEXT,
      passwordHash TEXT,
      roles TEXT,
      activeRole TEXT,
      salonId TEXT,
      salonName TEXT,
      city TEXT,
      isVerified INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

    CREATE TABLE IF NOT EXISTS salons (
      id TEXT PRIMARY KEY,
      ownerId TEXT,
      name TEXT,
      city TEXT,
      active INTEGER DEFAULT 1,
      rating REAL DEFAULT 5.0,
      reviewCount INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_salons_owner ON salons(ownerId);
    CREATE INDEX IF NOT EXISTS idx_salons_city ON salons(city);

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      salonId TEXT,
      name TEXT,
      category TEXT,
      price REAL,
      durationMinutes INTEGER,
      active INTEGER DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_services_salon ON services(salonId);

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      salonId TEXT,
      name TEXT,
      role TEXT,
      active INTEGER DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_staff_salon ON staff(salonId);

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      salonId TEXT,
      customerId TEXT,
      staffId TEXT,
      date TEXT,
      time TEXT,
      status TEXT,
      paymentStatus TEXT,
      totalAmount REAL,
      createdAt TEXT,
      updatedAt TEXT,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_apts_salon ON appointments(salonId);
    CREATE INDEX IF NOT EXISTS idx_apts_customer ON appointments(customerId);
    CREATE INDEX IF NOT EXISTS idx_apts_date_time ON appointments(salonId, date, time);
    CREATE INDEX IF NOT EXISTS idx_apts_staff_date ON appointments(staffId, date);

    CREATE TABLE IF NOT EXISTS queue (
      id TEXT PRIMARY KEY,
      salonId TEXT,
      customerId TEXT,
      status TEXT,
      position INTEGER,
      createdAt TEXT,
      updatedAt TEXT,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_queue_salon ON queue(salonId);

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      salonId TEXT,
      appointmentId TEXT UNIQUE,
      customerId TEXT,
      rating INTEGER,
      createdAt TEXT,
      updatedAt TEXT,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews(salonId);
    CREATE INDEX IF NOT EXISTS idx_reviews_apt ON reviews(appointmentId);

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      salonId TEXT,
      appointmentId TEXT,
      amount REAL,
      paymentMethod TEXT,
      status TEXT,
      date TEXT,
      timestamp TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_txns_salon ON transactions(salonId);

    CREATE TABLE IF NOT EXISTS blocked_slots (
      id TEXT PRIMARY KEY,
      salonId TEXT,
      staffId TEXT,
      date TEXT,
      startTime TEXT,
      endTime TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_blocked_salon_date ON blocked_slots(salonId, date);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      salonId TEXT,
      read INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_notifs_salon ON notifications(salonId);

    CREATE TABLE IF NOT EXISTS customer_notes (
      id TEXT PRIMARY KEY,
      salonId TEXT,
      customerId TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_notes_salon_cust ON customer_notes(salonId, customerId);
  `);

  console.log('[UPLOOKZ DB] SQLite persistent engine initialized with WAL mode and indexes.');
  return sqliteDb;
}

/**
 * Connect to database
 */
export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (mongoUri && mongoUri.startsWith('mongodb')) {
    try {
      console.log('[UPLOOKZ DB] Attempting connection to MongoDB...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        autoIndex: true
      });
      isConnected = true;
      dbType = 'mongo';
      console.log('[UPLOOKZ DB] Successfully connected to MongoDB.');
      return { type: 'mongo', connection: mongoose.connection };
    } catch (err) {
      console.warn(`[UPLOOKZ DB] Could not connect to MongoDB (${err.message}). Falling back to persistent SQLite engine.`);
    }
  }

  // SQLite Persistent Storage
  sqliteDb = initSqlite();
  isConnected = true;
  dbType = 'sqlite';
  return { type: 'sqlite', connection: sqliteDb };
}

export function getDatabaseType() {
  return dbType;
}

export function getSqliteDb() {
  if (!sqliteDb) initSqlite();
  return sqliteDb;
}

export function isDbConnected() {
  return isConnected;
}
