import assert from 'node:assert';
import * as salonService from '../salonService.js';
import { readData, writeData } from '../db.js';

async function runLifecycleTests() {
  console.log('=============================================================');
  console.log('    UPLOOKZ APPOINTMENT LIFECYCLE & "ARRIVED" TEST SUITE     ');
  console.log('=============================================================\n');

  // 1. Get the genuine registered salon
  const salons = await salonService.getAllSalons();
  const salon = salons.find(s => s.name === 'uplookz official') || salons[0];
  assert(salon, 'Target salon must exist');
  console.log(`[SETUP] Using Salon: "${salon.name}" (${salon.id})`);

  const services = await salonService.getServices(salon.id);
  assert(services.length > 0, 'Salon must have at least one service');
  const service = services[0];

  const staff = await salonService.getStaff(salon.id);
  const stylist = staff[0] || null;

  let testApt = null;

  try {
    // -----------------------------------------------------------------
    // TEST 1: Book New Appointment (Confirmed)
    // -----------------------------------------------------------------
    console.log('\n[TEST 1] Booking new appointment...');
    const ist = salonService.getNowInIST();
    // Use future date to avoid past conflicts
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const dateStr = futureDate.toISOString().split('T')[0];

    testApt = await salonService.createAppointment(salon.id, {
      serviceIds: [service.id],
      staffId: stylist ? stylist.id : null,
      date: dateStr,
      time: '14:00',
      customerName: 'Rohit Sharma (Lifecycle Test)',
      customerPhone: '+91 99999 11111',
      customerEmail: 'rohit.test@example.com',
      notes: 'Automated Lifecycle Verification'
    });

    assert.strictEqual(testApt.salonId, salon.id);
    assert.strictEqual(testApt.status, 'confirmed');
    console.log('✓ TEST 1 PASSED: Appointment created with status "confirmed" (#ID:', testApt.id, ')');

    // -----------------------------------------------------------------
    // TEST 2: Mark Customer as Arrived (Confirmed -> Arrived)
    // -----------------------------------------------------------------
    console.log('\n[TEST 2] Marking customer as Arrived (confirmed -> arrived)...');
    const arrivedApt = await salonService.updateAppointmentStatus(salon.id, testApt.id, 'arrived', 'Client checked in at reception');
    assert.strictEqual(arrivedApt.status, 'arrived');
    assert(arrivedApt.arrivedAt, 'arrivedAt timestamp must be set');
    console.log(`✓ TEST 2 PASSED: Status updated to "arrived" (arrivedAt: ${arrivedApt.arrivedAt})`);

    // Verify DB persistence
    const aptsFromDb1 = readData('appointments.json', []);
    const inDb1 = aptsFromDb1.find(a => a.id === testApt.id);
    assert.strictEqual(inDb1.status, 'arrived', 'Database record must persist status "arrived"');
    console.log('✓ TEST 2B PASSED: Database persistence verified for "arrived" status');

    // -----------------------------------------------------------------
    // TEST 3: Progress to In Service (Arrived -> In Service)
    // -----------------------------------------------------------------
    console.log('\n[TEST 3] Progressing to In Service (arrived -> in_service)...');
    const inServiceApt = await salonService.updateAppointmentStatus(salon.id, testApt.id, 'in_service', 'Client seated with stylist');
    assert.strictEqual(inServiceApt.status, 'in_service');
    assert(inServiceApt.serviceStartedAt, 'serviceStartedAt timestamp must be set');
    console.log(`✓ TEST 3 PASSED: Status updated to "in_service" (serviceStartedAt: ${inServiceApt.serviceStartedAt})`);

    // -----------------------------------------------------------------
    // TEST 4: Mark Completed (In Service -> Completed)
    // -----------------------------------------------------------------
    console.log('\n[TEST 4] Marking appointment as Completed (in_service -> completed)...');
    const completedApt = await salonService.updateAppointmentStatus(salon.id, testApt.id, 'completed', 'Grooming service finished successfully');
    assert.strictEqual(completedApt.status, 'completed');
    assert(completedApt.completedAt, 'completedAt timestamp must be set');
    console.log(`✓ TEST 4 PASSED: Status updated to "completed" (completedAt: ${completedApt.completedAt})`);

    // -----------------------------------------------------------------
    // TEST 5: Record Verified Payment
    // -----------------------------------------------------------------
    console.log('\n[TEST 5] Recording Cash Payment for completed appointment...');
    const paidApt = await salonService.updateAppointmentPaymentStatus(
      salon.id,
      testApt.id,
      'paid',
      'UPI',
      completedApt.totalAmount
    );
    assert.strictEqual(paidApt.paymentStatus, 'paid');
    assert.strictEqual(paidApt.paymentMethod, 'UPI');
    console.log('✓ TEST 5 PASSED: Payment recorded as "paid" with method "UPI"');

    // Verify ledger transaction
    const txs = readData('transactions.json', []);
    const tx = txs.find(t => t.appointmentId === testApt.id);
    assert(tx, 'Ledger transaction must be recorded');
    assert.strictEqual(tx.status, 'completed');
    console.log('✓ TEST 5B PASSED: Ledger transaction verified with amount ₹' + tx.amount);

    // -----------------------------------------------------------------
    // TEST 6: Prevent Invalid State Transitions from Completed
    // -----------------------------------------------------------------
    console.log('\n[TEST 6] Verifying terminal state guard (completed cannot transition back to arrived)...');
    let rejected = false;
    try {
      await salonService.updateAppointmentStatus(salon.id, testApt.id, 'arrived');
    } catch (err) {
      rejected = true;
      console.log('✓ Expected error thrown:', err.message);
    }
    assert.strictEqual(rejected, true, 'Terminal transition must be rejected');
    console.log('✓ TEST 6 PASSED: Invalid transition properly rejected');

    console.log('\n=============================================================');
    console.log('   ALL APPOINTMENT LIFECYCLE & "ARRIVED" TESTS PASSED!       ');
    console.log('=============================================================');

  } finally {
    // Cleanup temporary test fixture
    if (testApt) {
      console.log('\n[CLEANUP] Cleaning up test appointment fixture...');
      const apts = readData('appointments.json', []);
      writeData('appointments.json', apts.filter(a => a.id !== testApt.id));
      const txs = readData('transactions.json', []);
      writeData('transactions.json', txs.filter(t => t.appointmentId !== testApt.id));
      console.log('✓ Temporary fixture cleaned up.');
    }
  }
}

runLifecycleTests().catch((err) => {
  console.error('\n❌ LIFECYCLE TEST SUITE FAILED:', err);
  process.exit(1);
});
