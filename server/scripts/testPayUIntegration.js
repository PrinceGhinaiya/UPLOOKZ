import assert from 'node:assert';
import crypto from 'node:crypto';
import { readData, writeData } from '../db.js';
import {
  getPublicPaymentConfig,
  generatePayUHash,
  verifyPayUResponseHash,
  initiatePayUPayment,
  handlePayUCallback,
  getCustomerPaymentHistory
} from '../paymentService.js';

console.log('--- STARTING UPLOOKZ PAYU TEST SUITE ---');

const TEST_SALON_ID = 'salon_1793357831570_1fa058'; // uplookz official
const appointments = readData('appointments.json', []);
let targetSalon = readData('salons.json', []).find((s) => s.id === TEST_SALON_ID);

if (!targetSalon) {
  targetSalon = readData('salons.json', [])[0];
}

console.log(`Using test salon: "${targetSalon?.name}" (${targetSalon?.id})`);

// -----------------------------------------------------------------
// [TEST 1] Public Payment Configuration API
// -----------------------------------------------------------------
console.log('\n[TEST 1] Verifying Public PayU Payment Config API...');
const config = getPublicPaymentConfig();
assert.strictEqual(config.gateway, 'PayU', 'Gateway must be PayU');
assert.strictEqual(config.currency, 'INR', 'Currency must be INR');
assert.strictEqual(config.isTestMode, true, 'Payment must be configured in Test Mode');
assert.ok(config.merchantKey, 'Public merchant key must be returned');
assert.ok(config.baseUrl, 'Base URL must be returned');
assert.strictEqual(config.salt, undefined, 'Merchant Salt must NEVER be exposed publicly');
console.log('✓ TEST 1 PASSED: Public configuration is secure and strictly PayU test mode');

// -----------------------------------------------------------------
// [TEST 2] PayU Transaction Initiation & SHA-512 Hash Generation
// -----------------------------------------------------------------
console.log('\n[TEST 2] Creating test appointment and initiating PayU payment...');
const testAptId = `apt_payu_test_${Date.now()}`;
const newApt = {
  id: testAptId,
  salonId: targetSalon.id,
  salonName: targetSalon.name,
  customerId: 'cust_payu_tester',
  customerName: 'PayU Test User',
  customerPhone: '9876543210',
  customerEmail: 'tester@uplookz.com',
  serviceIds: ['srv_1793357831570_c646ef'],
  serviceNames: ['Signature Haircut'],
  date: '2026-11-05',
  time: '14:00',
  durationMinutes: 45,
  totalAmount: 850,
  status: 'confirmed',
  paymentStatus: 'unpaid',
  paymentMethod: 'PayU',
  createdAt: new Date().toISOString()
};

appointments.push(newApt);
writeData('appointments.json', appointments);

const checkoutRes = await initiatePayUPayment(testAptId, { id: 'cust_payu_tester', name: 'PayU Test User' }, 'localhost:5173', 'http', '/?tab=appointments');
assert.strictEqual(checkoutRes.success, true, 'Checkout initiation must succeed');
assert.ok(checkoutRes.action.includes('payu.in'), 'Action URL must point to PayU endpoint');
assert.strictEqual(checkoutRes.params.key, config.merchantKey, 'Merchant key must match');
assert.strictEqual(checkoutRes.params.amount, '850.00', 'Amount must be formatted decimal 850.00');
assert.ok(checkoutRes.params.hash, 'SHA-512 Hash must be generated');
assert.strictEqual(checkoutRes.params.udf1, testAptId, 'udf1 must contain appointment ID');
assert.strictEqual(checkoutRes.params.udf4, '/?tab=appointments', 'udf4 must preserve originating return URL');
assert.ok(checkoutRes.params.txnid.startsWith('TXN_'), 'Transaction ID must start with TXN_');
console.log(`✓ TEST 2 PASSED: PayU Hosted Checkout initiated for ₹850 with valid SHA-512 hash and returnUrl`);

// -----------------------------------------------------------------
// [TEST 3] PayU Reverse Hash Verification & Payment Success Fulfillment
// -----------------------------------------------------------------
console.log('\n[TEST 3] Cryptographic reverse hash verification & fulfillment...');
const salt = process.env.PAYU_MERCHANT_SALT || 'eCwWELxi';
const txnid = checkoutRes.params.txnid;
const mihpayid = `payu_mih_${Date.now()}`;
const status = 'success';
const amount = checkoutRes.params.amount;
const productinfo = checkoutRes.params.productinfo;
const firstname = checkoutRes.params.firstname;
const email = checkoutRes.params.email;
const udf1 = checkoutRes.params.udf1;
const udf2 = checkoutRes.params.udf2;
const udf3 = checkoutRes.params.udf3;
const udf4 = checkoutRes.params.udf4;
const udf5 = checkoutRes.params.udf5;

// Generate official PayU reverse response hash
const reverseSequence = [
  salt,
  status,
  '', // udf10
  '', // udf9
  '', // udf8
  '', // udf7
  '', // udf6
  udf5,
  udf4,
  udf3,
  udf2,
  udf1,
  email,
  firstname,
  productinfo,
  amount,
  txnid,
  config.merchantKey
].join('|');

const validResponseHash = crypto.createHash('sha512').update(reverseSequence).digest('hex').toLowerCase();

const callbackRes = await handlePayUCallback({
  key: config.merchantKey,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  status,
  mihpayid,
  mode: 'UPI',
  hash: validResponseHash,
  udf1,
  udf2,
  udf3,
  udf4,
  udf5
});

assert.strictEqual(callbackRes.success, true, 'Callback handling must succeed');
assert.strictEqual(callbackRes.appointment.paymentStatus, 'paid', 'Appointment must be marked PAID');
assert.strictEqual(callbackRes.appointment.payuPaymentId, mihpayid, 'mihpayid must be stored');
assert.strictEqual(callbackRes.appointment.paymentMethod, 'PayU', 'Payment method must be PayU');
assert.ok(callbackRes.transaction, 'Transaction record must be created');
assert.strictEqual(callbackRes.transaction.amount, 850, 'Transaction amount must match');
console.log(`✓ TEST 3 PASSED: Reverse hash verified. Appointment marked PAID, transaction ${callbackRes.transaction.id} recorded`);

// -----------------------------------------------------------------
// [TEST 4] Tampered Reverse Hash Rejection
// -----------------------------------------------------------------
console.log('\n[TEST 4] Verifying tampered hash rejection...');
let tamperedError = null;
try {
  await handlePayUCallback({
    key: config.merchantKey,
    txnid: `TXN_TAMPER_${Date.now()}`,
    amount: '100.00',
    productinfo: 'Fake Product',
    firstname: 'Hacker',
    email: 'hacker@evil.com',
    status: 'success',
    mihpayid: 'payu_fake',
    hash: 'tampered_invalid_sha512_hash_value',
    udf1: testAptId
  });
} catch (err) {
  tamperedError = err;
}
assert.ok(tamperedError, 'Tampered hash must be rejected');
console.log(`  Rejected tampered hash as expected: "${tamperedError.message}"`);
console.log('✓ TEST 4 PASSED: Tampered PayU payloads are securely blocked');

// -----------------------------------------------------------------
// [TEST 5] Duplicate Payment Prevention
// -----------------------------------------------------------------
console.log('\n[TEST 5] Testing duplicate transaction prevention on already-paid appointment...');
let dupInitError = null;
try {
  await initiatePayUPayment(testAptId, { id: 'cust_payu_tester' });
} catch (err) {
  dupInitError = err;
}
assert.ok(dupInitError, 'Must block initiation for already-paid appointment');
console.log(`  Blocked duplicate checkout initiation: "${dupInitError.message}"`);

// Attempting duplicate callback with different mihpayid must be rejected
let dupCallbackError = null;
try {
  await handlePayUCallback({
    key: config.merchantKey,
    txnid: `TXN_ANOTHER_${Date.now()}`,
    amount,
    productinfo,
    firstname,
    email,
    status: 'success',
    mihpayid: `payu_second_${Date.now()}`,
    mode: 'CC',
    hash: validResponseHash,
    udf1
  });
} catch (err) {
  dupCallbackError = err;
}
assert.ok(dupCallbackError, 'Must reject duplicate payment verification on already-paid appointment');
console.log(`  Blocked duplicate payment fulfillment: "${dupCallbackError.message}"`);
console.log('✓ TEST 5 PASSED: Duplicate transactions strictly prevented');

// -----------------------------------------------------------------
// [TEST 6] PayU Payment Cancellation / Failure Callback
// -----------------------------------------------------------------
console.log('\n[TEST 6] Testing PayU Payment Cancellation / Failure callback...');
const failAptId = `apt_payu_fail_${Date.now()}`;
const failApt = {
  id: failAptId,
  salonId: targetSalon.id,
  salonName: targetSalon.name,
  customerId: 'cust_payu_tester',
  customerName: 'PayU Test User',
  serviceIds: ['srv_1793357831570_c646ef'],
  date: '2026-11-06',
  time: '11:00',
  totalAmount: 500,
  status: 'confirmed',
  paymentStatus: 'unpaid',
  createdAt: new Date().toISOString()
};
appointments.push(failApt);
writeData('appointments.json', appointments);

const failCheckout = await initiatePayUPayment(failAptId, { id: 'cust_payu_tester' });
const failTxnid = failCheckout.params.txnid;
const failAmount = failCheckout.params.amount;

const failSequence = [
  salt,
  'failure',
  '', '', '', '', '',
  '', '', '', '',
  failAptId,
  failCheckout.params.email,
  failCheckout.params.firstname,
  failCheckout.params.productinfo,
  failAmount,
  failTxnid,
  config.merchantKey
].join('|');

const failHash = crypto.createHash('sha512').update(failSequence).digest('hex').toLowerCase();

const failCallbackRes = await handlePayUCallback({
  key: config.merchantKey,
  txnid: failTxnid,
  amount: failAmount,
  productinfo: failCheckout.params.productinfo,
  firstname: failCheckout.params.firstname,
  email: failCheckout.params.email,
  status: 'failure',
  mihpayid: 'payu_cancelled',
  error_Message: 'User cancelled transaction on PayU hosted page.',
  hash: failHash,
  udf1: failAptId
});

assert.strictEqual(failCallbackRes.success, false, 'Failure status must return success: false');
assert.strictEqual(failCallbackRes.status, 'failed', 'Status must be failed');
assert.strictEqual(failCallbackRes.appointment.paymentStatus, 'unpaid', 'Appointment must remain unpaid');
console.log('✓ TEST 6 PASSED: PayU payment cancellation handled gracefully; slot remains reserved as unpaid');

// -----------------------------------------------------------------
// [TEST 7] Customer Payment History API
// -----------------------------------------------------------------
console.log('\n[TEST 7] Verifying Customer Payment History API...');
const history = await getCustomerPaymentHistory('cust_payu_tester', 'tester@uplookz.com', '9876543210');
assert.ok(Array.isArray(history), 'History must be an array');
assert.ok(history.length >= 1, 'History must contain at least 1 verified transaction');
const testerTxn = history.find((h) => h.appointmentId === testAptId);
assert.ok(testerTxn, 'History must contain the verified PayU transaction');
assert.strictEqual(testerTxn.paymentMethod, 'PayU', 'Payment method in history must be PayU');
assert.strictEqual(testerTxn.payuPaymentId, mihpayid, 'mihpayid in history must match');
console.log(`✓ TEST 7 PASSED: Payment history returned ${history.length} verified PayU transaction(s)`);

console.log('\n====================================');
console.log('ALL 7 PAYU INTEGRATION TESTS PASSED!');
console.log('====================================\n');
