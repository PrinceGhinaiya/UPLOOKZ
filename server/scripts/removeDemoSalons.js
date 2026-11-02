import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readData, writeData } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');
const serverDir = path.join(__dirname, '..');
const backupsDir = path.join(serverDir, 'backups');

const GENUINE_SALON_ID = 'salon_1793357831570_1fa058';

async function main() {
  console.log('\n=============================================================');
  console.log('   UPLOOKZ — SAFE REMOVAL OF PRELOADED & DEMO SALONS');
  console.log('=============================================================\n');

  // 1. Inspect existing salons
  const allSalons = readData('salons.json', []);
  console.log(`Found ${allSalons.length} total salon records in database.`);

  const genuineSalons = allSalons.filter(s => s.id === GENUINE_SALON_ID);
  const demoSalons = allSalons.filter(s => s.id !== GENUINE_SALON_ID);

  if (genuineSalons.length === 0) {
    throw new Error(`CRITICAL: Genuine salon ${GENUINE_SALON_ID} not found! Aborting cleanup to protect data.`);
  }

  console.log(`\nGenuine salon to PRESERVE: "${genuineSalons[0].name}" (${genuineSalons[0].id})`);
  console.log(`Demo/test salons to ARCHIVE & REMOVE (${demoSalons.length}):`);
  demoSalons.forEach(s => console.log(`  - [${s.id}] ${s.name} (owner: ${s.ownerId}, city: ${s.city})`));

  const demoSalonIds = new Set(demoSalons.map(s => s.id));

  // 2. Perform Full Pre-Cleanup Backup
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const backupFolder = path.join(backupsDir, `backup_pre_cleanup_${timestamp}`);

  if (!fs.existsSync(backupFolder)) {
    fs.mkdirSync(backupFolder, { recursive: true });
  }

  console.log(`\nCreating comprehensive backup in: ${backupFolder}`);

  // Backup SQLite database files
  const dbDir = path.join(serverDir, 'database');
  if (fs.existsSync(dbDir)) {
    for (const f of fs.readdirSync(dbDir)) {
      if (f.startsWith('uplookz.sqlite')) {
        fs.copyFileSync(path.join(dbDir, f), path.join(backupFolder, f));
        console.log(`  Backed up DB file: ${f}`);
      }
    }
  }

  // Backup JSON tables
  const dataDir = path.join(serverDir, 'data');
  if (fs.existsSync(dataDir)) {
    for (const f of fs.readdirSync(dataDir)) {
      if (f.endsWith('.json')) {
        fs.copyFileSync(path.join(dataDir, f), path.join(backupFolder, f));
      }
    }
    console.log(`  Backed up all JSON tables from ${dataDir}`);
  }

  // 3. Collect all related demo records for archival
  const allServices = readData('services.json', []);
  const allStaff = readData('staff.json', []);
  const allAppointments = readData('appointments.json', []);
  const allQueue = readData('queue.json', []);
  const allReviews = readData('reviews.json', []);
  const allTransactions = readData('transactions.json', []);
  const allBlockedSlots = readData('blocked_slots.json', []);
  const allNotifications = readData('notifications.json', []);
  const allUsers = readData('users.json', {});

  const archivedPayload = {
    archivedAt: now.toISOString(),
    reason: 'Cleanup of preloaded seed data and automated test salons',
    salons: demoSalons,
    services: allServices.filter(s => demoSalonIds.has(s.salonId)),
    staff: allStaff.filter(st => demoSalonIds.has(st.salonId)),
    appointments: allAppointments.filter(a => demoSalonIds.has(a.salonId)),
    queue: allQueue.filter(q => demoSalonIds.has(q.salonId)),
    reviews: allReviews.filter(r => demoSalonIds.has(r.salonId)),
    transactions: allTransactions.filter(t => demoSalonIds.has(t.salonId)),
    blockedSlots: allBlockedSlots.filter(b => demoSalonIds.has(b.salonId)),
    notifications: allNotifications.filter(n => demoSalonIds.has(n.salonId))
  };

  const archiveFilePath = path.join(backupFolder, 'archived_demo_data.json');
  fs.writeFileSync(archiveFilePath, JSON.stringify(archivedPayload, null, 2));
  console.log(`  Archived ${archivedPayload.salons.length} salons, ${archivedPayload.services.length} services, ${archivedPayload.staff.length} staff, ${archivedPayload.appointments.length} appointments, and ${archivedPayload.transactions.length} transactions to archived_demo_data.json.`);

  // 4. Prune demo records and write clean data back
  const remainingSalons = allSalons.filter(s => !demoSalonIds.has(s.id));
  const remainingServices = allServices.filter(s => !demoSalonIds.has(s.salonId));
  const remainingStaff = allStaff.filter(st => !demoSalonIds.has(st.salonId));
  const remainingAppointments = allAppointments.filter(a => !demoSalonIds.has(a.salonId));
  const remainingQueue = allQueue.filter(q => !demoSalonIds.has(q.salonId));
  const remainingReviews = allReviews.filter(r => !demoSalonIds.has(r.salonId));
  const remainingTransactions = allTransactions.filter(t => !demoSalonIds.has(t.salonId));
  const remainingBlockedSlots = allBlockedSlots.filter(b => !demoSalonIds.has(b.salonId));
  const remainingNotifications = allNotifications.filter(n => !demoSalonIds.has(n.salonId));

  // Prune demo user 'usr_salon_02' from users.json if present
  const remainingUsers = {};
  for (const [key, user] of Object.entries(allUsers)) {
    if (user.id !== 'usr_salon_02') {
      remainingUsers[key] = user;
    }
  }

  console.log('\nApplying changes to SQLite and JSON storage...');
  writeData('salons.json', remainingSalons);
  writeData('services.json', remainingServices);
  writeData('staff.json', remainingStaff);
  writeData('appointments.json', remainingAppointments);
  writeData('queue.json', remainingQueue);
  writeData('reviews.json', remainingReviews);
  writeData('transactions.json', remainingTransactions);
  writeData('blocked_slots.json', remainingBlockedSlots);
  writeData('notifications.json', remainingNotifications);
  writeData('users.json', remainingUsers);

  // 5. Verification
  const verifySalons = readData('salons.json', []);
  const verifyServices = readData('services.json', []);
  const verifyStaff = readData('staff.json', []);
  const verifyAppointments = readData('appointments.json', []);
  const verifyTransactions = readData('transactions.json', []);

  console.log('\n=== POST-CLEANUP VERIFICATION ===');
  console.log(`Remaining Salons: ${verifySalons.length}`);
  verifySalons.forEach(s => console.log(`  ✓ ${s.name} (${s.id}) in ${s.city}`));
  console.log(`Remaining Services: ${verifyServices.length}`);
  console.log(`Remaining Staff: ${verifyStaff.length}`);
  console.log(`Remaining Appointments: ${verifyAppointments.length}`);
  console.log(`Remaining Transactions: ${verifyTransactions.length}`);

  if (verifySalons.length === 1 && verifySalons[0].id === GENUINE_SALON_ID) {
    console.log('\n[SUCCESS] Cleanup completed cleanly and verified! Only genuine registered salon is present.');
  } else {
    console.warn('\n[WARNING] Verify salon counts: unexpected number of salons remaining.');
  }
}

main().catch(err => {
  console.error('\n[ERROR]', err);
  process.exit(1);
});
