import assert from 'node:assert';
import crypto from 'node:crypto';
import { readData, writeData } from '../db.js';
import * as salonService from '../salonService.js';
import * as paymentService from '../paymentService.js';

console.log('--- STARTING UPLOOKZ RAZORPAY TEST SUITE ---');

async function runTests() {
  const allSalons = await salonService.getAllSalons();
  const testSalon = allSalons[0];
  assert(testSalon, 'At least one salon must exist for testing');
  console.log(`Using test salon: "${testSalon.name}" (${testSalon.id})`);

  // TEST 1: Public Config API (Zero Secret Leakage)
  console.log('\n[TEST 1] Verifying Public Payment Config API...');
  const config = paymentService.getPublicPaymentConfig();
  assert(config.keyId, 'keyId must be present');
  assert.strictEqual(config.currency, 'INR', 'Currency must be INR');
  assert.strictEqual(config.isTestMode, true, 'Must strictly indicate test mode');
  assert.strictEqual(config.keySecret, undefined, 'CRITICAL: keySecret must NEVER be exposed');
  console.log('✓ TEST 1 PASSED: Public configuration is secure and strictly test mode');

  // TEST 2: Order Creation & Paise Conversion
  console.log('\n[TEST 2] Creating appointment and verifying Razorpay Order Creation...');
  const testApt = await salonService.createAppointment(testSalon.id, {
    serviceIds: [],
    date: '2026-11-05',
    time: '02:00 PM',
    customerName: 'Razorpay Test User',
    customerPhone: '+91 99999 11111',
    customerEmail: 'testuser@example.com',
    totalAmount: 750
  });
  assert(testApt && testApt.id, 'Test appointment must be created');
  assert(testApt.paymentStatus === 'pending' || testApt.paymentStatus === 'unpaid', 'Initial payment status must be pending or unpaid');

  const orderRes = await paymentService.createPaymentOrder(testApt.id);
  assert(orderRes.success, 'Order creation must succeed');
  assert(orderRes.orderId, 'Razorpay orderId must be generated');
  assert.strictEqual(orderRes.amount, 75000, 'Amount must be accurately converted to paise (750 * 100 = 75000)');
  assert.strictEqual(orderRes.currency, 'INR');

  // Verify appointment was updated with razorpayOrderId and status pending
  const aptAfterOrder = (readData('appointments.json', [])).find(a => a.id === testApt.id);
  assert.strictEqual(aptAfterOrder.razorpayOrderId, orderRes.orderId);
  assert.strictEqual(aptAfterOrder.paymentStatus, 'pending');
  console.log(`✓ TEST 2 PASSED: Order ${orderRes.orderId} created for ₹750 (${orderRes.amount} paise)`);

  // TEST 3: Cryptographic Signature Verification & Status Synchronization
  console.log('\n[TEST 3] Cryptographic HMAC-SHA256 signature verification & fulfillment...');
  const mockPaymentId = `pay_test_${Date.now()}_abc123`;
  const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_uplookz_test_mode';
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderRes.orderId}|${mockPaymentId}`)
    .digest('hex');

  const verifyRes = await paymentService.verifyPaymentSignature({
    appointmentId: testApt.id,
    razorpayOrderId: orderRes.orderId,
    razorpayPaymentId: mockPaymentId,
    razorpaySignature: validSignature
  });
  assert(verifyRes.success, 'Verification must succeed');
  assert.strictEqual(verifyRes.appointment.paymentStatus, 'paid');
  assert.strictEqual(verifyRes.appointment.paymentMethod, 'Razorpay');
  assert.strictEqual(verifyRes.appointment.razorpayPaymentId, mockPaymentId);

  // Check transaction record
  const allTxns = readData('transactions.json', []);
  const matchingTxn = allTxns.find(t => t.appointmentId === testApt.id);
  assert(matchingTxn, 'Transaction must be created in transactions table');
  assert.strictEqual(matchingTxn.paymentMethod, 'Razorpay');
  assert.strictEqual(matchingTxn.amount, 750);
  assert.strictEqual(matchingTxn.razorpayPaymentId, mockPaymentId);
  assert.strictEqual(matchingTxn.status, 'completed');
  console.log(`✓ TEST 3 PASSED: Signature verified. Appointment marked PAID, transaction ${matchingTxn.id} recorded`);

  // TEST 4: Tampered Signature Rejection
  console.log('\n[TEST 4] Verifying tampered signature rejection...');
  const testApt2 = await salonService.createAppointment(testSalon.id, {
    serviceIds: [],
    date: '2026-11-06',
    time: '03:00 PM',
    customerName: 'Tamper Tester',
    customerPhone: '+91 99999 22222',
    totalAmount: 500
  });
  const orderRes2 = await paymentService.createPaymentOrder(testApt2.id);

  let tamperedCaught = false;
  try {
    await paymentService.verifyPaymentSignature({
      appointmentId: testApt2.id,
      razorpayOrderId: orderRes2.orderId,
      razorpayPaymentId: `pay_tampered_999`,
      razorpaySignature: 'invalid_tampered_signature_hex_value'
    });
  } catch (err) {
    tamperedCaught = true;
    console.log(`  Rejected tampered signature as expected: "${err.message}"`);
  }
  assert(tamperedCaught, 'Tampered signature must be strictly rejected');
  console.log('✓ TEST 4 PASSED: Tampered signatures are securely blocked');

  // TEST 5: Duplicate Payment Prevention
  console.log('\n[TEST 5] Testing duplicate payment prevention on already-paid appointment...');
  let duplicateCaught = false;
  try {
    // Attempt to create a second order for already paid testApt
    await paymentService.createPaymentOrder(testApt.id);
  } catch (err) {
    duplicateCaught = true;
    console.log(`  Blocked duplicate order creation: "${err.message}"`);
  }
  assert(duplicateCaught, 'Duplicate order creation on paid appointment must fail');

  let duplicatePaymentCaught = false;
  try {
    // Attempt to verify another payment for testApt
    await paymentService.verifyPaymentSignature({
      appointmentId: testApt.id,
      razorpayOrderId: orderRes.orderId,
      razorpayPaymentId: 'pay_duplicate_different_id',
      razorpaySignature: validSignature
    });
  } catch (err) {
    duplicatePaymentCaught = true;
    console.log(`  Blocked duplicate payment verification: "${err.message}"`);
  }
  assert(duplicatePaymentCaught, 'Duplicate payment verification must fail');
  console.log('✓ TEST 5 PASSED: Duplicate payments strictly prevented');

  // TEST 6: Webhook Signature Verification & Processing
  console.log('\n[TEST 6] Testing Webhook Signature & Processing...');
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret_uplookz';
  const webhookPayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_webhook_${Date.now()}`,
          order_id: orderRes2.orderId,
          amount: 50000,
          currency: 'INR',
          status: 'captured',
          notes: {
            appointmentId: testApt2.id
          }
        }
      }
    }
  });

  const webhookSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(webhookPayload)
    .digest('hex');

  const webhookRes = await paymentService.processWebhookEvent(webhookPayload, webhookSignature);
  assert(webhookRes.success, 'Webhook processing must succeed');

  const apt2AfterWebhook = (readData('appointments.json', [])).find(a => a.id === testApt2.id);
  assert.strictEqual(apt2AfterWebhook.paymentStatus, 'paid');
  assert.strictEqual(apt2AfterWebhook.paymentMethod, 'Razorpay');
  console.log('✓ TEST 6 PASSED: Webhook processed and appointment updated to paid');

  // TEST 7: Customer Payment History API
  console.log('\n[TEST 7] Verifying Customer Payment History API...');
  const history = await paymentService.getCustomerPaymentHistory(
    testApt.customerId,
    testApt.customerEmail,
    testApt.customerPhone
  );
  assert(Array.isArray(history), 'History must return an array');
  assert(history.length >= 1, 'History must contain the completed transaction');
  const histItem = history.find(h => h.appointmentId === testApt.id);
  assert(histItem, 'History item must match test appointment');
  assert.strictEqual(histItem.paymentMethod, 'Razorpay');
  assert.strictEqual(histItem.amount, 750);
  console.log(`✓ TEST 7 PASSED: Payment history returned ${history.length} verified transaction(s)`);

  // Cleanup test appointments to keep data clean
  const appointments = readData('appointments.json', []);
  const cleanApts = appointments.filter(a => a.id !== testApt.id && a.id !== testApt2.id);
  writeData('appointments.json', cleanApts);

  const txns = readData('transactions.json', []);
  const cleanTxns = txns.filter(t => t.appointmentId !== testApt.id && t.appointmentId !== testApt2.id);
  writeData('transactions.json', cleanTxns);

  console.log('\n========================================');
  console.log('ALL 7 RAZORPAY INTEGRATION TESTS PASSED!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
