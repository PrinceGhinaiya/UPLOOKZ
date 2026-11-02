import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase } from '../database/dbConnection.js';
import {
  User,
  Salon,
  Service,
  Staff,
  Appointment,
  QueueEntry,
  Review,
  Transaction,
  BlockedSlot,
  Notification,
  CustomerNote
} from '../database/models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('[MIGRATION] Starting migration of JSON data to database...');
  await connectDatabase();

  const backupsDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupsDir)) {
    console.error('[MIGRATION] No backups directory found at:', backupsDir);
    return;
  }

  // Find latest backup folder
  const backups = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('backup_'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    console.error('[MIGRATION] No backup folder found in:', backupsDir);
    return;
  }

  const latestBackupDir = path.join(backupsDir, backups[0]);
  console.log('[MIGRATION] Reading data from backup:', latestBackupDir);

  const modelMap = [
    { file: 'users.json', model: User, name: 'Users' },
    { file: 'salons.json', model: Salon, name: 'Salons' },
    { file: 'services.json', model: Service, name: 'Services' },
    { file: 'staff.json', model: Staff, name: 'Staff' },
    { file: 'appointments.json', model: Appointment, name: 'Appointments' },
    { file: 'queue.json', model: QueueEntry, name: 'Queue Entries' },
    { file: 'reviews.json', model: Review, name: 'Reviews' },
    { file: 'transactions.json', model: Transaction, name: 'Transactions' },
    { file: 'blocked_slots.json', model: BlockedSlot, name: 'Blocked Slots' },
    { file: 'notifications.json', model: Notification, name: 'Notifications' },
    { file: 'customer_notes.json', model: CustomerNote, name: 'Customer Notes' },
  ];

  for (const item of modelMap) {
    const filePath = path.join(latestBackupDir, item.file);
    if (!fs.existsSync(filePath)) {
      console.log(`[MIGRATION] Skipping ${item.name} (${item.file} not found).`);
      continue;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      let records = [];

      if (Array.isArray(parsed)) {
        records = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        records = Object.entries(parsed).map(([key, val]) => {
          if (typeof val === 'object' && val !== null) {
            return {
              id: val.id || key,
              customerId: val.customerId || key,
              salonId: val.salonId || 'salon_apex_01',
              ...val
            };
          }
          return null;
        }).filter(Boolean);
      }

      let insertedCount = 0;
      for (const rec of records) {
        if (!rec) continue;
        const recordId = rec.id || rec._id;
        if (!recordId) continue;

        // Check if already in database
        const existing = await item.model.findById(recordId);
        if (!existing) {
          await item.model.create({ ...rec, id: recordId });
          insertedCount++;
        }
      }

      console.log(`[MIGRATION] ${item.name}: ${insertedCount} new records migrated (${records.length} total found in backup).`);
    } catch (err) {
      console.error(`[MIGRATION] Error migrating ${item.file}:`, err.message);
    }
  }

  console.log('[MIGRATION] Migration completed successfully.');
}

runMigration().catch(err => {
  console.error('[MIGRATION] Fatal migration error:', err);
  process.exit(1);
});
