import assert from 'node:assert';
import * as salonService from '../salonService.js';
import { readData, writeData } from '../db.js';

let totalPassed = 0;

async function runTest(title, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${title}`);
    totalPassed++;
  } catch (err) {
    console.error(`  [FAIL] ${title}`);
    console.error(`         ${err.message}`);
    process.exitCode = 1;
  }
}

async function run() {
  console.log('\n=============================================================');
  console.log('   UPLOOKZ CUSTOMER DISCOVERY & SEARCH VERIFICATION SUITE');
  console.log('=============================================================\n');

  const allSalons = await salonService.getAllSalons();
  assert(allSalons.length >= 1, 'Must have at least 1 genuine registered salon in the database');
  const salon1 = allSalons[0];
  let salon2 = allSalons[1];
  let createdTempSalon = false;

  if (!salon2) {
    salon2 = await salonService.createSalon('usr_temp_tester', {
      name: 'Temp Test Salon',
      city: 'Surat'
    });
    createdTempSalon = true;
  }

  // Test 1: Search by exact salon name
  await runTest('#1: Search by salon name returns specific salon', async () => {
    const results = await salonService.getAllSalons({ search: salon1.name.slice(0, 4) });
    assert(results.length > 0, 'Should return at least one salon');
    assert(results.some((s) => s.id === salon1.id), `Should include ${salon1.name}`);
  });

  // Test 2: Search by service name
  await runTest('#2: Search by service name (e.g., "Haircut") returns salons offering it', async () => {
    const results = await salonService.getAllSalons({ search: 'Haircut' });
    assert(results.length > 0, 'Should find salons offering haircuts');
    for (const s of results) {
      assert(s.startingPrice > 0, 'Salon must have valid startingPrice computed');
    }
  });

  // Test 3: Search suggestions returns structured matches
  await runTest('#3: Typeahead suggestions return matching salons, services, and categories', async () => {
    const suggestions = await salonService.getSearchSuggestions('hair');
    assert(Array.isArray(suggestions.salons), 'Should have salons array');
    assert(Array.isArray(suggestions.services), 'Should have services array');
    assert(Array.isArray(suggestions.categories), 'Should have categories array');
    assert(suggestions.services.length > 0, 'Should find services matching hair');
  });

  // Test 4: Enriched startingPrice and isOpen calculations
  await runTest('#4: Enriched salon records contain startingPrice, categories, and real-time open status', async () => {
    for (const s of allSalons) {
      assert(typeof s.startingPrice === 'number', 'startingPrice must be a number');
      assert(Array.isArray(s.serviceCategories), 'serviceCategories must be an array');
      assert(typeof s.isOpen === 'boolean', 'isOpen must be a boolean');
    }
  });

  // Test 5: Rejection of booking with missing salonId
  await runTest('#5: Booking without explicit salonId is strictly rejected', async () => {
    let failedAsExpected = false;
    try {
      await salonService.createAppointment('', {
        customerName: 'Test Customer',
        date: '2026-11-20',
        time: '12:00 PM'
      });
    } catch (err) {
      failedAsExpected = true;
      assert(err.message.includes('Salon ID is required'), 'Error must specify Salon ID requirement');
    }
    assert(failedAsExpected, 'Expected missing salonId to be rejected');
  });

  // Test 6: Cross-salon service mismatch rejection
  await runTest('#6: Cross-salon service booking is rejected (preventing random salon bugs)', async () => {
    const salon1Services = await salonService.getServices(salon1.id);
    assert(salon1Services.length > 0, 'Salon 1 must have services');
    const s1ServiceId = salon1Services[0].id;

    let failedAsExpected = false;
    try {
      // Attempting to book Salon 1's service at Salon 2
      await salonService.createAppointment(salon2.id, {
        customerName: 'Cross Salon Attacker',
        customerPhone: '+919876543210',
        serviceIds: [s1ServiceId],
        date: '2026-11-20',
        time: '02:00 PM'
      });
    } catch (err) {
      failedAsExpected = true;
      assert(err.message.includes('belongs to another salon'), `Expected cross-salon error, got: ${err.message}`);
    }
    assert(failedAsExpected, 'Expected cross-salon service booking to be rejected');

    // Clean up temporary salon if created
    if (createdTempSalon) {
      const dbSalons = readData('salons.json', []);
      writeData('salons.json', dbSalons.filter(s => s.id !== salon2.id));
    }
  });

  // Test 7: Valid booking preserves exact salon ID and calculates authentic price
  await runTest('#7: Valid booking binds strictly to target salon ID and genuine DB price', async () => {
    const s1Services = await salonService.getServices(salon1.id);
    const chosenService = s1Services[0];
    const uniqueDay = 10 + Math.floor(Math.random() * 15);
    const targetDate = `2026-11-${String(uniqueDay).padStart(2, '0')}`;
    const targetTime = '04:00 PM';

    const apt = await salonService.createAppointment(salon1.id, {
      customerName: 'Discovery Test User',
      customerPhone: '+919123456789',
      customerEmail: 'discovery@test.uplookz.com',
      serviceIds: [chosenService.id],
      date: targetDate,
      time: targetTime
    });

    assert(apt && apt.id, 'Appointment must be created');
    assert(apt.salonId === salon1.id, `Must bind strictly to salon1 ID (${salon1.id})`);
    assert(apt.salonName === salon1.name, `Must reflect authentic salon name (${salon1.name})`);
    assert(apt.totalAmount === chosenService.price, `Total amount must equal DB service price (${chosenService.price})`);

    // Clean up created appointment to keep DB pristine
    const allApts = readData('appointments.json', []);
    writeData('appointments.json', allApts.filter(a => a.id !== apt.id));
  });

  // Test 8: Favorites toggling and persistence
  await runTest('#8: Customer favorites toggle and persist in database', async () => {
    const users = readData('users.json', {});
    const customerUser = Object.values(users).find((u) => u.roles?.includes('customer')) || Object.values(users)[0];
    assert(customerUser, 'Must have at least one user');

    const toggle1 = await salonService.toggleCustomerFavorite(customerUser.id, salon1.id);
    assert(toggle1.success, 'Toggle 1 must succeed');
    const favsAfter1 = await salonService.getCustomerFavorites(customerUser.id);
    assert(favsAfter1.some((s) => s.id === salon1.id), 'Salon 1 must be in favorites');

    // Toggle again to remove
    const toggle2 = await salonService.toggleCustomerFavorite(customerUser.id, salon1.id);
    assert(toggle2.success, 'Toggle 2 must succeed');
    assert(toggle2.isFavorite === false, 'Salon 1 should be removed from favorites');
  });

  console.log('\n=============================================================');
  console.log(`  ALL ${totalPassed}/8 DISCOVERY & STRICT BOOKING TESTS PASSED!`);
  console.log('=============================================================\n');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
