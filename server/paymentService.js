import crypto from 'node:crypto';
import { readData, writeData } from './db.js';
import { getNowInIST, createNotification, recordTransaction } from './salonService.js';

// Environment variables configuration (strictly separates Test & Live credentials)
const MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || 'gtKFFx';
const MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT || 'eCwWELxi';
const BASE_URL = (process.env.PAYU_BASE_URL || 'https://test.payu.in').replace(/\/+$/, '');
const ENVIRONMENT = process.env.PAYU_ENVIRONMENT || 'test';

/**
 * 1. Public Payment Gateway Configuration
 * Only public credentials (key, baseUrl, environment) are exposed. Merchant Salt is NEVER returned.
 */
export function getPublicPaymentConfig() {
  return {
    merchantKey: MERCHANT_KEY,
    baseUrl: BASE_URL,
    environment: ENVIRONMENT,
    currency: 'INR',
    gateway: 'PayU',
    isTestMode: ENVIRONMENT !== 'production'
  };
}

/**
 * 2. Official PayU SHA-512 Hash Generation Algorithm
 * Sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
 */
export function generatePayUHash({
  key = MERCHANT_KEY,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  udf1 = '',
  udf2 = '',
  udf3 = '',
  udf4 = '',
  udf5 = '',
  udf6 = '',
  udf7 = '',
  udf8 = '',
  udf9 = '',
  udf10 = '',
  salt = MERCHANT_SALT
}) {
  const hashString = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    udf6,
    udf7,
    udf8,
    udf9,
    udf10,
    salt
  ].join('|');

  return crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
}

/**
 * 3. Official PayU Reverse SHA-512 Hash Verification Algorithm
 * Sequence: [additionalCharges|]salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 */
export function verifyPayUResponseHash({
  key = MERCHANT_KEY,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  status,
  udf1 = '',
  udf2 = '',
  udf3 = '',
  udf4 = '',
  udf5 = '',
  udf6 = '',
  udf7 = '',
  udf8 = '',
  udf9 = '',
  udf10 = '',
  additionalCharges = '',
  salt = MERCHANT_SALT,
  responseHash
}) {
  if (!responseHash) return false;

  const sequence = [
    salt,
    status,
    udf10,
    udf9,
    udf8,
    udf7,
    udf6,
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
    key
  ].join('|');

  const finalString = additionalCharges ? `${additionalCharges}|${sequence}` : sequence;
  const calculatedHash = crypto.createHash('sha512').update(finalString).digest('hex').toLowerCase();

  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'utf-8'),
      Buffer.from(responseHash.toLowerCase().trim(), 'utf-8')
    );
  } catch {
    return false;
  }
}

/**
 * 4. Initiate PayU Payment for Hosted Checkout
 * Validates appointment, prevents duplicate payment, generates unique txnid,
 * and computes SHA-512 hash to redirect to official PayU checkout.
 */
export async function initiatePayUPayment(appointmentId, customerUser = null, reqHost = 'localhost:5173', reqProtocol = 'http', returnUrl = '') {
  if (!appointmentId) {
    throw new Error('Appointment ID is required to initiate PayU payment.');
  }

  const appointments = readData('appointments.json', []);
  const aptIndex = appointments.findIndex((a) => a.id === appointmentId);
  if (aptIndex === -1) {
    throw new Error(`Appointment with ID "${appointmentId}" not found.`);
  }

  const appointment = appointments[aptIndex];

  // Concurrency Guard: Check if appointment is already marked paid
  if (appointment.paymentStatus === 'paid') {
    throw new Error(`Appointment #${appointment.id.slice(-6).toUpperCase()} is already paid. Duplicate payment rejected.`);
  }

  // Prevent double-charging if an existing completed transaction already exists
  const transactions = readData('transactions.json', []);
  const existingCompletedTxn = transactions.find(
    (t) => t.appointmentId === appointmentId && t.status === 'completed'
  );
  if (existingCompletedTxn) {
    appointment.paymentStatus = 'paid';
    appointment.paymentMethod = existingCompletedTxn.paymentMethod || 'PayU';
    writeData('appointments.json', appointments);
    throw new Error('A completed payment record already exists for this appointment.');
  }

  const totalAmount = parseFloat(appointment.totalAmount) || 0;
  if (totalAmount <= 0) {
    throw new Error('Invalid appointment amount. Amount must be greater than zero.');
  }

  // PayU expects formatted decimal string e.g. "750.00"
  const amountFormatted = totalAmount.toFixed(2);
  const txnid = `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const serviceName = appointment.serviceNames?.[0] || 'Salon Service';
  const productinfo = `Booking for ${serviceName}`.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 80);
  const rawFirstname = appointment.customerName || customerUser?.name || 'Customer';
  const firstname = rawFirstname.trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') || 'Customer';
  const email = (appointment.customerEmail || customerUser?.email || 'customer@uplookz.com').trim();
  const rawPhone = (appointment.customerPhone || customerUser?.phone || '9999999999').replace(/[^0-9]/g, '');
  const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9999999999';

  // Construct official PayU Callback URLs
  const surl = `${reqProtocol}://${reqHost}/api/payment/payu-callback`;
  const furl = `${reqProtocol}://${reqHost}/api/payment/payu-callback`;

  // User-defined fields for reconciliation & originating page return
  const udf1 = appointment.id;
  const udf2 = appointment.salonId;
  const udf3 = appointment.customerId || customerUser?.id || '';
  // Sanitize returnUrl so it preserves where customer started/clicked pay without pipe characters
  let safeReturnUrl = '/customer/home?tab=appointments';
  if (returnUrl) {
    if (returnUrl.startsWith('/customer/') || returnUrl.startsWith('/salons')) {
      safeReturnUrl = returnUrl;
    } else if (returnUrl.startsWith('/?')) {
      safeReturnUrl = `/customer/home${returnUrl.substring(1)}`;
    } else if (returnUrl.startsWith('?')) {
      safeReturnUrl = `/customer/home${returnUrl}`;
    }
  }
  const udf4 = safeReturnUrl.replace(/\|/g, '').slice(0, 100);
  const udf5 = '';

  const hash = generatePayUHash({
    key: MERCHANT_KEY,
    txnid,
    amount: amountFormatted,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    salt: MERCHANT_SALT
  });

  // Track transaction ID and returnUrl in appointment record
  appointments[aptIndex].payuTxnId = txnid;
  appointments[aptIndex].paymentStatus = 'pending';
  appointments[aptIndex].returnUrl = safeReturnUrl;
  appointments[aptIndex].updatedAt = new Date().toISOString();
  writeData('appointments.json', appointments);

  return {
    success: true,
    action: `${BASE_URL}/_payment`,
    params: {
      key: MERCHANT_KEY,
      txnid,
      amount: amountFormatted,
      productinfo,
      firstname,
      email,
      phone,
      surl,
      furl,
      hash,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5
    },
    appointmentId: appointment.id,
    amount: totalAmount,
    txnid
  };
}

/**
 * 5. Handle PayU Callback (surl / furl)
 * Verifies reverse hash cryptographically, prevents duplicate fulfillment,
 * updates appointment to 'paid', records completed transaction, and creates salon notification.
 */
export async function handlePayUCallback(postData) {
  if (!postData || typeof postData !== 'object') {
    throw new Error('Invalid PayU callback payload.');
  }

  const {
    key = MERCHANT_KEY,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    status,
    mihpayid,
    mode,
    hash,
    udf1, // appointmentId
    udf2, // salonId
    udf3,
    udf4,
    udf5,
    additionalCharges = '',
    error_Message = '',
    bank_ref_num = ''
  } = postData;

  if (!txnid || !hash || !status) {
    throw new Error('Missing essential PayU callback parameters (txnid, hash, status).');
  }

  // Cryptographic reverse hash verification
  const isHashValid = verifyPayUResponseHash({
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    status,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    additionalCharges,
    salt: MERCHANT_SALT,
    responseHash: hash
  });

  if (!isHashValid) {
    throw new Error('PayU reverse hash verification failed. Tampered or illegitimate payment payload.');
  }

  // Find appointment by udf1 (appointmentId) or payuTxnId
  const appointments = readData('appointments.json', []);
  const aptIndex = appointments.findIndex((a) => a.id === udf1 || a.payuTxnId === txnid);

  if (aptIndex === -1) {
    throw new Error(`Appointment not found for PayU transaction ${txnid}.`);
  }

  const appointment = appointments[aptIndex];
  const ist = getNowInIST();
  const nowIso = new Date().toISOString();

  // If status is successful
  if (status.toLowerCase() === 'success') {
    // Idempotent duplicate check
    if (appointment.paymentStatus === 'paid' && appointment.payuPaymentId === mihpayid) {
      return {
        success: true,
        status: 'success',
        message: 'Payment was already processed.',
        appointment,
        txnid,
        alreadyProcessed: true
      };
    }

    if (appointment.paymentStatus === 'paid') {
      throw new Error(`Appointment #${appointment.id.slice(-6).toUpperCase()} is already paid under ID ${appointment.payuPaymentId || 'N/A'}. Duplicate payment rejected.`);
    }

    // Update appointment record
    appointments[aptIndex].paymentStatus = 'paid';
    appointments[aptIndex].paymentMethod = 'PayU';
    appointments[aptIndex].payuPaymentId = mihpayid || `payu_${Date.now()}`;
    appointments[aptIndex].payuTxnId = txnid;
    appointments[aptIndex].payuMode = mode || 'ONLINE';
    appointments[aptIndex].paidAt = ist.timestamp;
    appointments[aptIndex].updatedAt = nowIso;
    writeData('appointments.json', appointments);

    // Record verified transaction in ledger
    const transaction = recordTransaction({
      salonId: appointment.salonId,
      appointmentId: appointment.id,
      bookingReference: appointment.id,
      customerName: appointment.customerName,
      amount: parseFloat(amount) || appointment.totalAmount,
      currency: 'INR',
      paymentMethod: 'PayU',
      payuTxnId: txnid,
      payuPaymentId: mihpayid || `payu_${Date.now()}`,
      payuMode: mode || 'ONLINE',
      status: 'completed',
      date: ist.dateStr
    });

    // Notify salon owner
    createNotification(appointment.salonId, {
      title: 'Payment Received via PayU',
      message: `Received verified online payment of ₹${amount || appointment.totalAmount} for ${appointment.customerName} via PayU (Ref: #${(mihpayid || txnid).slice(-8)}).`,
      type: 'payment',
      appointmentId: appointment.id
    });

    const resolvedReturnUrl = udf4 || appointment?.returnUrl || '/customer/home?tab=appointments';

    return {
      success: true,
      status: 'success',
      message: 'Payment verified and recorded successfully via PayU.',
      appointment: appointments[aptIndex],
      transaction,
      txnid,
      amount,
      returnUrl: resolvedReturnUrl
    };
  } else {
    // Status is failed or cancelled
    appointments[aptIndex].paymentStatus = 'unpaid';
    appointments[aptIndex].updatedAt = nowIso;
    writeData('appointments.json', appointments);

    const resolvedReturnUrl = udf4 || appointment?.returnUrl || '/customer/home?tab=appointments';

    return {
      success: false,
      status: 'failed',
      errorMessage: error_Message || postData.error || 'Payment was declined or cancelled on PayU.',
      appointment: appointments[aptIndex],
      txnid,
      amount,
      returnUrl: resolvedReturnUrl
    };
  }
}

/**
 * 6. Official PayU Server Web Service Verification API (verify_payment)
 * Allows server-to-server reconciliation by querying PayU directly.
 */
export async function verifyPayUPaymentViaWebService(txnid) {
  if (!txnid) throw new Error('Transaction ID is required for PayU status check.');

  const command = 'verify_payment';
  const hashString = `${MERCHANT_KEY}|${command}|${txnid}|${MERCHANT_SALT}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();

  const postParams = new URLSearchParams();
  postParams.append('key', MERCHANT_KEY);
  postParams.append('command', command);
  postParams.append('var1', txnid);
  postParams.append('hash', hash);

  try {
    const res = await fetch(`${BASE_URL}/merchant/postservice?form=2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: postParams.toString()
    });

    const data = await res.json();
    return {
      success: true,
      data
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * 7. Customer Payment History API
 * Returns all verified transactions for a customer with PayU references.
 */
export async function getCustomerPaymentHistory(customerId = null, email = null, phone = null) {
  const transactions = readData('transactions.json', []);
  const appointments = readData('appointments.json', []);
  const salons = readData('salons.json', []);

  // Filter transactions matching this customer
  const customerAptIds = new Set(
    appointments
      .filter((a) => {
        if (customerId && a.customerId === customerId) return true;
        if (email && a.customerEmail && a.customerEmail.toLowerCase() === email.toLowerCase()) return true;
        if (phone && a.customerPhone && a.customerPhone.includes(phone.slice(-10))) return true;
        return false;
      })
      .map((a) => a.id)
  );

  const filtered = transactions.filter((t) => {
    if (t.appointmentId && customerAptIds.has(t.appointmentId)) return true;
    if (customerId && t.customerId === customerId) return true;
    return false;
  });

  return filtered.map((txn) => {
    const apt = appointments.find((a) => a.id === txn.appointmentId);
    const salon = salons.find((s) => s.id === txn.salonId);
    return {
      ...txn,
      salonName: salon ? salon.name : 'Salon Partner',
      serviceNames: apt?.serviceNames || ['Salon Service Visit'],
      appointmentDate: apt?.date || txn.date,
      appointmentTime: apt?.time || ''
    };
  });
}
