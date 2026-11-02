import assert from 'node:assert';
import * as salonService from '../salonService.js';
import { readData, writeData } from '../db.js';

let totalPassed = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] #${totalTests}: ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`  [FAIL] #${totalTests}: ${name}`);
    console.error(`         ${err.message}`);
    process.exitCode = 1;
    throw err;
  }
}

async function runAll() {
  console.log('\n=============================================================');
  console.log('   UPLOOKZ REVENUE ANALYTICS & PAYMENT ENGINE TEST SUITE');
  console.log('=============================================================\n');

  const genuineSalons = await salonService.getAllSalons();
  assert(genuineSalons.length > 0, 'Must have at least one salon');
  const salon = genuineSalons[0];
  const salonId = salon.id;

  // Test 1: Timezone helper returns valid Asia/Kolkata date
  let istInfo = null;
  await runTest('IST Helper returns accurate date and month in Asia/Kolkata', async () => {
    istInfo = salonService.getNowInIST();
    assert(istInfo.dateStr && /^\d{4}-\d{2}-\d{2}$/.test(istInfo.dateStr), 'dateStr must match YYYY-MM-DD');
    assert(istInfo.monthStr && /^\d{4}-\d{2}$/.test(istInfo.monthStr), 'monthStr must match YYYY-MM');
    console.log(`         Current IST Date: ${istInfo.dateStr}, Month: ${istInfo.monthStr}`);
  });

  // Test 2: Baseline Analytics Calculation
  let baseAnalytics = null;
  await runTest('getAnalytics computes genuine totals from completed paid transactions', async () => {
    baseAnalytics = await salonService.getAnalytics(salonId);
    assert(typeof baseAnalytics.todayRevenue === 'number', 'todayRevenue must be a number');
    assert(typeof baseAnalytics.weekRevenue === 'number', 'weekRevenue must be a number');
    assert(typeof baseAnalytics.monthRevenue === 'number', 'monthRevenue must be a number');
    assert(typeof baseAnalytics.totalRevenue === 'number', 'totalRevenue must be a number');
    assert(Array.isArray(baseAnalytics.revenueTrends), 'revenueTrends must be an array');
    assert(baseAnalytics.revenueTrends.length === 7, 'revenueTrends must contain 7 days');
    assert(baseAnalytics.currentDate === istInfo.dateStr, 'currentDate must match IST date');
    console.log(`         Baseline Revenue: Today: ₹${baseAnalytics.todayRevenue}, Month: ₹${baseAnalytics.monthRevenue}, Total: ₹${baseAnalytics.totalRevenue}`);
  });

  // Test 3: Unpaid booking does not increase revenue
  let testApt = null;
  const services = await salonService.getServices(salonId);
  const testService = services[0];
  await runTest('Unpaid or pending booking contributes ₹0 to revenue', async () => {
    testApt = await salonService.createAppointment(salonId, {
      customerName: 'Revenue Tester',
      customerPhone: '+919999911111',
      customerEmail: 'revtest@example.com',
      serviceIds: [testService.id],
      date: '2026-11-05',
      time: '10:00 AM',
      paymentStatus: 'pending'
    });

    assert(testApt && testApt.id, 'Appointment must be created');
    assert(testApt.paymentStatus === 'pending', 'Appointment paymentStatus must be pending');

    const analyticsAfterCreate = await salonService.getAnalytics(salonId);
    assert(
      analyticsAfterCreate.todayRevenue === baseAnalytics.todayRevenue,
      `Unpaid appointment must not increase today's revenue (was ₹${baseAnalytics.todayRevenue}, now ₹${analyticsAfterCreate.todayRevenue})`
    );
  });

  // Test 4: Completing appointment without payment still contributes ₹0 to revenue
  await runTest('Completing appointment decouples from automatic payment', async () => {
    const completedApt = await salonService.updateAppointmentStatus(salonId, testApt.id, 'completed');
    assert(completedApt.status === 'completed', 'Status must be completed');
    assert(completedApt.paymentStatus === 'pending', 'Payment status must remain pending');

    const analyticsAfterComplete = await salonService.getAnalytics(salonId);
    assert(
      analyticsAfterComplete.todayRevenue === baseAnalytics.todayRevenue,
      `Completed unpaid appointment must not increase revenue (expected ₹${baseAnalytics.todayRevenue}, got ₹${analyticsAfterComplete.todayRevenue})`
    );
  });

  // Test 5: Explicit cash payment recording updates revenue accurately
  const paymentAmount = 400;
  await runTest('Recording cash payment updates payment status and increments revenue', async () => {
    const paidApt = await salonService.updateAppointmentPaymentStatus(
      salonId,
      testApt.id,
      'paid',
      'Cash',
      paymentAmount
    );

    assert(paidApt.paymentStatus === 'paid', 'Payment status must be paid');
    assert(paidApt.paymentMethod === 'Cash', 'Payment method must be Cash');

    const analyticsAfterPay = await salonService.getAnalytics(salonId);
    assert(
      analyticsAfterPay.todayRevenue === baseAnalytics.todayRevenue + paymentAmount,
      `todayRevenue must increment by exactly ₹${paymentAmount} (expected ₹${baseAnalytics.todayRevenue + paymentAmount}, got ₹${analyticsAfterPay.todayRevenue})`
    );
    assert(
      analyticsAfterPay.totalRevenue === baseAnalytics.totalRevenue + paymentAmount,
      `totalRevenue must increment by exactly ₹${paymentAmount}`
    );
    console.log(`         Updated Today Revenue: ₹${analyticsAfterPay.todayRevenue}`);
  });

  // Test 6: Deduplication check prevents double counting
  await runTest('Repeated payment recording deduplicates and prevents revenue inflation', async () => {
    // Attempt to record payment again on the same appointment
    await salonService.updateAppointmentPaymentStatus(
      salonId,
      testApt.id,
      'paid',
      'Cash',
      paymentAmount
    );

    const allTx = readData('transactions.json', []).filter((t) => t.appointmentId === testApt.id);
    assert(allTx.length === 1, `Must have exactly 1 transaction for this appointment, found ${allTx.length}`);

    const analyticsDedupe = await salonService.getAnalytics(salonId);
    assert(
      analyticsDedupe.todayRevenue === baseAnalytics.todayRevenue + paymentAmount,
      `Duplicate payment call must not double count revenue (expected ₹${baseAnalytics.todayRevenue + paymentAmount}, got ₹${analyticsDedupe.todayRevenue})`
    );
  });

  // Test 7: Clean up test appointment and its transaction
  await runTest('Clean up test fixtures to preserve pristine database', async () => {
    const apts = readData('appointments.json', []);
    writeData('appointments.json', apts.filter((a) => a.id !== testApt.id));

    const txs = readData('transactions.json', []);
    writeData('transactions.json', txs.filter((t) => t.appointmentId !== testApt.id));

    const finalAnalytics = await salonService.getAnalytics(salonId);
    assert(
      finalAnalytics.todayRevenue === baseAnalytics.todayRevenue,
      'Revenue should return to baseline after cleaning test records'
    );
  });

  console.log('\n=============================================================');
  console.log(`  ALL ${totalPassed}/${totalTests} REVENUE & PAYMENT TESTS PASSED!`);
  console.log('=============================================================\n');
}

runAll().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
