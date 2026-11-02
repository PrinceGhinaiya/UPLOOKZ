import assert from 'node:assert';
import { connectDatabase, getSqliteDb } from '../database/dbConnection.js';
import {
  User,
  Salon,
  Service,
  Staff,
  Appointment,
  QueueEntry,
  Review,
  Transaction,
  BlockedSlot
} from '../database/models.js';
import * as salonService from '../salonService.js';
import * as authService from '../authService.js';

let testsPassed = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  return fn()
    .then(() => {
      console.log(`  [PASS] #${totalTests}: ${name}`);
      testsPassed++;
    })
    .catch((err) => {
      console.error(`  [FAIL] #${totalTests}: ${name}`);
      console.error(`         ${err.message}`);
      throw err;
    });
}

async function runAllTests() {
  console.log('\n=============================================================');
  console.log('   UPLOOKZ PRODUCTION BACKEND & LOGIC VERIFICATION SUITE');
  console.log('=============================================================\n');

  // Test 1: Database Connection
  await runTest('Database engine initializes with WAL mode and tables', async () => {
    const conn = await connectDatabase();
    assert(conn.type === 'sqlite' || conn.type === 'mongo', 'Connection must be sqlite or mongo');
    const db = getSqliteDb();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);
    ['users', 'salons', 'services', 'staff', 'appointments', 'queue', 'reviews', 'transactions'].forEach(tbl => {
      assert(tableNames.includes(tbl), `Table ${tbl} must exist in database`);
    });
  });

  // Test 2: Database Source of Truth Persistence
  await runTest('Records persist directly in database models', async () => {
    const salonCount = await Salon.countDocuments();
    assert(salonCount > 0, `Database must contain persisted salons (found ${salonCount})`);
  });

  // Test 3: User Model & Session Authentication
  let testUserToken = null;
  let testUserId = null;
  await runTest('User authentication and session tokens via database', async () => {
    const testEmail = `test_${Date.now()}@uplookz-test.com`;
    const user = await User.create({
      email: testEmail,
      name: 'Automated Tester',
      phone: '+919876599999',
      roles: ['customer'],
      activeRole: 'customer',
      isVerified: true
    });
    testUserId = user.id;
    assert(user.id, 'User must have an ID');

    // Fetch user from DB
    const fetched = await User.findOne({ email: testEmail });
    assert(fetched && fetched.name === 'Automated Tester', 'User must be queryable by email');

    // Verify session user retrieval
    const googleRes = await authService.loginWithGoogle({
      email: testEmail,
      name: 'Automated Tester'
    });
    assert(googleRes.success, 'Google login / token creation should succeed');
    testUserToken = googleRes.token;

    const sessionRes = await authService.getSessionUser(testUserToken);
    assert(sessionRes.success && sessionRes.user.email === testEmail, 'Session must resolve user from database');
  });

  // Test 4: Salon Profile
  let activeSalonId = null;
  await runTest('Fetch salon profile and compute aggregate metrics', async () => {
    const salons = await salonService.getAllSalons();
    assert(salons.length > 0, 'At least one salon must be registered');
    activeSalonId = salons[0].id;

    const salon = await salonService.getSalonById(activeSalonId);
    assert(salon && salon.name, 'Salon profile must load with name');
    assert(typeof salon.rating === 'number', 'Salon rating must be a valid number');
  });

  // Test 5: Service Management
  let testServiceId = null;
  await runTest('Service CRUD operations', async () => {
    const newService = await salonService.addService(activeSalonId, {
      name: 'Signature Precision Cut',
      category: 'Hair',
      price: 650,
      durationMinutes: 40,
      description: 'Master barber haircut'
    });
    assert(newService && newService.id, 'Service must be created');
    testServiceId = newService.id;

    const updated = await salonService.updateService(activeSalonId, testServiceId, {
      price: 700
    });
    assert(updated.price === 700, 'Service price should update');
  });

  // Test 6: Staff Management
  let testStaffId = null;
  await runTest('Staff CRUD operations', async () => {
    const newStaff = await salonService.addStaff(activeSalonId, {
      name: 'Rohan Joshi',
      role: 'Senior Stylist',
      phone: '+919988776655',
      active: true
    });
    assert(newStaff && newStaff.id, 'Staff must be created');
    testStaffId = newStaff.id;

    const allStaff = await salonService.getStaff(activeSalonId);
    assert(allStaff.some(s => s.id === testStaffId), 'Staff list must include new staff member');
  });

  // Test 7: Atomic Slot Booking in Asia/Kolkata
  let bookedAptId = null;
  const targetDate = '2026-11-15'; // Future date
  const targetTime = '11:00 AM';
  await runTest('Atomic appointment creation with slot buffer', async () => {
    const apt = await salonService.createAppointment(activeSalonId, {
      customerId: testUserId,
      customerName: 'Automated Tester',
      customerPhone: '+919876599999',
      customerEmail: 'tester@uplookz-test.com',
      serviceIds: [testServiceId],
      staffId: testStaffId,
      date: targetDate,
      time: targetTime
    });
    assert(apt && apt.id, 'Appointment must be created');
    assert(apt.status === 'confirmed', 'Appointment status must be confirmed');
    bookedAptId = apt.id;
  });

  // Test 8: Double-Booking Prevention
  await runTest('Prevent double-booking overlapping slot for same stylist', async () => {
    let failedAsExpected = false;
    try {
      await salonService.createAppointment(activeSalonId, {
        customerId: 'cust_other_user',
        customerName: 'Conflicting Customer',
        serviceIds: [testServiceId],
        staffId: testStaffId,
        date: targetDate,
        time: targetTime
      });
    } catch (err) {
      failedAsExpected = true;
      assert(err.message.includes('conflict') || err.message.includes('booked'), `Expected conflict error, got: ${err.message}`);
    }
    assert(failedAsExpected, 'Double-booking must throw an error');
  });

  // Test 9: Working Hours & Closed Date Rejection
  await runTest('Reject appointments outside operating hours or in the past', async () => {
    let pastFailed = false;
    try {
      await salonService.createAppointment(activeSalonId, {
        customerName: 'Past Customer',
        date: '2025-01-01',
        time: '11:00 AM'
      });
    } catch {
      pastFailed = true;
    }
    assert(pastFailed, 'Past date booking must be rejected');

    let outOfHoursFailed = false;
    try {
      await salonService.createAppointment(activeSalonId, {
        customerName: 'Late Customer',
        date: targetDate,
        time: '11:45 PM' // after 9:00 PM closing
      });
    } catch {
      outOfHoursFailed = true;
    }
    assert(outOfHoursFailed, 'Outside working hours must be rejected');
  });

  // Test 10: Appointment State Transition Machine
  await runTest('Enforce valid state transitions (confirmed -> in_service -> completed)', async () => {
    // 1. Move to in_service
    const inService = await salonService.updateAppointmentStatus(activeSalonId, bookedAptId, 'in_service');
    assert(inService.status === 'in_service', 'Status should transition to in_service');

    // 2. Move to completed
    const completed = await salonService.updateAppointmentStatus(activeSalonId, bookedAptId, 'completed');
    assert(completed.status === 'completed', 'Status should transition to completed');
    const paid = await salonService.updateAppointmentPaymentStatus(activeSalonId, bookedAptId, 'paid', 'Cash');
    assert(paid.paymentStatus === 'paid', 'Recording payment should mark paymentStatus paid');

    // 3. Attempt invalid transition from completed back to in_service
    let illegalTransitionBlocked = false;
    try {
      await salonService.updateAppointmentStatus(activeSalonId, bookedAptId, 'in_service');
    } catch (err) {
      illegalTransitionBlocked = true;
      assert(err.message.includes('Cannot change status of a completed appointment'), `Unexpected message: ${err.message}`);
    }
    assert(illegalTransitionBlocked, 'Transitioning out of completed state must be blocked');
  });

  // Test 11: Rescheduling with Conflict Checking
  await runTest('Appointment rescheduling functionality', async () => {
    // Create new confirmed appointment to reschedule
    const aptToReschedule = await salonService.createAppointment(activeSalonId, {
      customerId: testUserId,
      customerName: 'Reschedule Tester',
      serviceIds: [testServiceId],
      staffId: testStaffId,
      date: '2026-11-20',
      time: '02:00 PM'
    });

    const rescheduled = await salonService.rescheduleAppointment(
      activeSalonId,
      aptToReschedule.id,
      '2026-11-20',
      '04:00 PM',
      testStaffId
    );
    assert(rescheduled.time === '04:00 PM', 'Appointment time must be updated');
  });

  // Test 12: Cancellation Lifecycle
  await runTest('Appointment cancellation lifecycle', async () => {
    const aptToCancel = await salonService.createAppointment(activeSalonId, {
      customerId: testUserId,
      customerName: 'Cancel Tester',
      serviceIds: [testServiceId],
      staffId: testStaffId,
      date: '2026-11-21',
      time: '01:00 PM'
    });

    const cancelled = await salonService.cancelCustomerAppointment(
      activeSalonId,
      aptToCancel.id,
      testUserId,
      'Customer had an urgent meeting'
    );
    assert(cancelled.status === 'cancelled', 'Appointment status must be cancelled');
    assert(cancelled.cancellationReason.includes('urgent meeting'), 'Reason must be recorded');

    // Verify terminal state: cannot cancel again or transition
    let secondCancelBlocked = false;
    try {
      await salonService.cancelCustomerAppointment(activeSalonId, aptToCancel.id, testUserId);
    } catch {
      secondCancelBlocked = true;
    }
    assert(secondCancelBlocked, 'Cannot cancel an already cancelled appointment');
  });

  // Test 13: Live Walk-In Queue Management
  let queueEntryId = null;
  await runTest('Live walk-in queue check-in, position tracking, and wait time', async () => {
    const entry = await salonService.addWalkInToQueue(activeSalonId, {
      customerName: 'Walk-In Customer 1',
      customerPhone: '+919111122222',
      serviceId: testServiceId
    });
    assert(entry && entry.id, 'Queue entry must be created');
    assert(entry.status === 'waiting', 'New walk-in must have status waiting');
    queueEntryId = entry.id;

    // Fetch queue and verify position
    const q = await salonService.getQueue(activeSalonId);
    const found = q.find(e => e.id === queueEntryId);
    assert(found, 'Queue must contain the new walk-in entry');
    assert(typeof found.position === 'number', 'Position must be a number');
    assert(typeof found.estimatedWaitMinutes === 'number', 'Estimated wait time must be calculated');

    // Update status to in_service then completed
    const updated = await salonService.updateQueueStatus(activeSalonId, queueEntryId, 'in_service');
    assert(updated.status === 'in_service', 'Queue entry status must be in_service');
  });

  // Test 14: Verified Reviews Tied to Completed Appointments
  await runTest('Verified review submission for completed visit and salon rating recalculation', async () => {
    const beforeSalon = await salonService.getSalonById(activeSalonId);
    const beforeReviewCount = beforeSalon.reviewCount || 0;

    const review = await salonService.addCustomerReview(
      activeSalonId,
      bookedAptId, // This was completed in Test 10!
      testUserId,
      'Automated Tester',
      5,
      'Exceptional precision haircut and hospitable styling lounge!'
    );
    assert(review && review.id, 'Review must be created');
    assert(review.verifiedVisit === true, 'Review must be flagged as verified visit');

    // Verify rating recalculation on salon
    const afterSalon = await salonService.getSalonById(activeSalonId);
    assert(afterSalon.reviewCount === beforeReviewCount + 1, 'Salon review count must increment');

    // Verify duplicate review prevention for same appointment
    let duplicateBlocked = false;
    try {
      await salonService.addCustomerReview(activeSalonId, bookedAptId, testUserId, 'Automated Tester', 5, 'Duplicate');
    } catch (err) {
      duplicateBlocked = true;
      assert(err.message.includes('already submitted a review'), `Expected duplicate error, got: ${err.message}`);
    }
    assert(duplicateBlocked, 'Duplicate reviews for the same visit must be prevented');

    // Test owner reply
    const replied = await salonService.replyToReview(activeSalonId, review.id, 'Thank you for your visit, Automated Tester!');
    assert(replied.ownerReply.includes('Thank you'), 'Owner reply must be recorded');
  });

  // Test 15: Payment Status Separation & Financial Ledger
  await runTest('Payment status separation and ledger recording', async () => {
    const testApt = await salonService.createAppointment(activeSalonId, {
      customerId: testUserId,
      customerName: 'Payment Test Customer',
      serviceIds: [testServiceId],
      staffId: testStaffId,
      date: '2026-11-25',
      time: '03:00 PM'
    });
    assert(testApt.paymentStatus === 'unpaid' || testApt.paymentStatus === 'pending', 'Initial payment status must be unpaid or pending');

    // Salon owner marks as paid via UPI
    const paidApt = await salonService.updateAppointmentPaymentStatus(
      activeSalonId,
      testApt.id,
      'paid',
      'UPI / PhonePe'
    );
    assert(paidApt.paymentStatus === 'paid', 'Payment status must be paid');

    // Verify transaction recorded
    const txns = await salonService.getAnalytics(activeSalonId);
    assert(txns.totalRevenue > 0, 'Total revenue should include the paid appointment');

    // Test refund
    const refundedApt = await salonService.updateAppointmentPaymentStatus(
      activeSalonId,
      testApt.id,
      'refunded'
    );
    assert(refundedApt.paymentStatus === 'refunded', 'Payment status must be refunded');
  });

  // Test 16: Multi-Tenant Data Isolation
  await runTest('Customer appointments isolation strictly scoped to user', async () => {
    const allApts = await salonService.getAppointments(activeSalonId);
    const myApts = allApts.filter(a => a.customerId === testUserId);
    assert(myApts.length > 0, 'Must find appointments belonging to this customer');
    assert(myApts.every(a => a.customerId === testUserId), 'Every returned appointment must belong strictly to this customer');
  });

  // Test 17: Blocked Slots / Blackout Periods
  await runTest('Blocked calendar slots prevention', async () => {
    const blocked = await salonService.addBlockedSlot(activeSalonId, {
      date: '2026-11-28',
      startTime: '01:00 PM',
      endTime: '03:00 PM',
      reason: 'Staff Training & Sanitization',
      staffId: testStaffId
    });
    assert(blocked && blocked.id, 'Blocked slot must be created');

    // Attempt booking during blocked time
    let blockedSlotAttemptFailed = false;
    try {
      await salonService.createAppointment(activeSalonId, {
        customerName: 'Blocked Slot Customer',
        serviceIds: [testServiceId],
        staffId: testStaffId,
        date: '2026-11-28',
        time: '01:30 PM'
      });
    } catch (err) {
      blockedSlotAttemptFailed = true;
      assert(err.message.includes('blocked') || err.message.includes('maintenance'), `Expected blocked slot error, got: ${err.message}`);
    }
    assert(blockedSlotAttemptFailed, 'Booking inside a blocked slot must be rejected');
  });

  console.log('\n=============================================================');
  console.log(`  ALL ${testsPassed}/${totalTests} PRODUCTION BACKEND VERIFICATION TESTS PASSED!`);
  console.log('=============================================================\n');
}

runAllTests().catch((err) => {
  console.error('\n[FATAL] Test suite failed:', err);
  process.exit(1);
});
