import { getSessionUser } from './authService.js';
import {
  getPublicPaymentConfig,
  initiatePayUPayment,
  handlePayUCallback,
  verifyPayUPaymentViaWebService,
  getCustomerPaymentHistory
} from './paymentService.js';

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.socket.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function readUrlEncodedOrJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.socket.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          return resolve(JSON.parse(body));
        } catch (err) {
          return reject(err);
        }
      }
      // Parse application/x-www-form-urlencoded
      try {
        const params = new URLSearchParams(body);
        const obj = {};
        for (const [key, value] of params.entries()) {
          obj[key] = value;
        }
        resolve(obj);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

function getBearerToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

export async function paymentMiddleware(req, res, next) {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }

  const [rawPath, queryString] = req.url.split('?');
  const queryParams = new URLSearchParams(queryString || '');
  const cleanPath = rawPath.replace(/^\/api\/payment/, '');

  try {
    // Resolve logged in session user if token present
    const token = getBearerToken(req);
    let user = null;
    if (token) {
      const s = await getSessionUser(token);
      if (s && s.success) user = s.user;
    }

    // -------------------------------------------------------------
    // 1. Public Payment Config: GET /api/payment/config
    // -------------------------------------------------------------
    if (req.method === 'GET' && (cleanPath === '/config' || cleanPath === 'config')) {
      const config = getPublicPaymentConfig();
      return sendJson(res, 200, { success: true, ...config });
    }

    // -------------------------------------------------------------
    // 2. PayU Payment Initiation: POST /api/payment/initiate
    // -------------------------------------------------------------
    if (req.method === 'POST' && (cleanPath === '/initiate' || cleanPath === 'initiate' || cleanPath === '/create-order')) {
      const body = await readJsonBody(req);
      if (!body.appointmentId) {
        return sendJson(res, 400, {
          success: false,
          message: 'appointmentId is required to initiate PayU payment.'
        });
      }

      const reqHost = req.headers['host'] || 'localhost:5173';
      const reqProtocol = req.headers['x-forwarded-proto'] || 'http';
      const returnUrl = body.returnUrl || '';

      const checkoutData = await initiatePayUPayment(body.appointmentId, user, reqHost, reqProtocol, returnUrl);
      return sendJson(res, 200, checkoutData);
    }

    // -------------------------------------------------------------
    // 3. Official PayU Hosted Callback: POST /api/payment/payu-callback
    // -------------------------------------------------------------
    if (req.method === 'POST' && (cleanPath === '/payu-callback' || cleanPath === 'payu-callback' || cleanPath === '/callback')) {
      const postData = await readUrlEncodedOrJsonBody(req);
      const result = await handlePayUCallback(postData);

      // If client explicitly requested JSON (e.g. automated test or API client)
      const acceptsJson = req.headers['accept'] && req.headers['accept'].includes('application/json');
      const isJsonContentType = req.headers['content-type'] && req.headers['content-type'].includes('application/json');
      if (acceptsJson || isJsonContentType) {
        return sendJson(res, 200, result);
      }

      // Browser Return: Redirect user's browser back to the exact page/tab where they started or clicked pay
      const rawOrigin = result.returnUrl || postData.udf4 || '';
      let returnPath = '/customer/home?tab=appointments';
      if (rawOrigin) {
        if (rawOrigin.startsWith('/customer/') || rawOrigin.startsWith('/salons')) {
          returnPath = rawOrigin;
        } else if (rawOrigin.startsWith('/?')) {
          returnPath = `/customer/home${rawOrigin.substring(1)}`;
        } else if (rawOrigin.startsWith('?')) {
          returnPath = `/customer/home${rawOrigin}`;
        } else if (rawOrigin.startsWith('/') && rawOrigin !== '/') {
          returnPath = `/customer/home${rawOrigin}`;
        }
      }
      const sep = returnPath.includes('?') ? '&' : '?';

      if (result.success && result.status === 'success') {
        const redirectUrl = `${returnPath}${sep}payment=success&txnid=${encodeURIComponent(result.txnid || '')}&appointmentId=${encodeURIComponent(result.appointment?.id || '')}&amount=${encodeURIComponent(result.amount || '')}&mihpayid=${encodeURIComponent(postData.mihpayid || '')}`;
        res.statusCode = 302;
        res.setHeader('Location', redirectUrl);
        return res.end();
      } else {
        const err = encodeURIComponent(result.errorMessage || 'Payment was declined or cancelled on PayU.');
        const redirectUrl = `${returnPath}${sep}payment=failed&txnid=${encodeURIComponent(result.txnid || '')}&appointmentId=${encodeURIComponent(result.appointment?.id || '')}&error=${err}`;
        res.statusCode = 302;
        res.setHeader('Location', redirectUrl);
        return res.end();
      }
    }

    // -------------------------------------------------------------
    // 4. PayU Server Web Service Check: POST /api/payment/verify-txnid
    // -------------------------------------------------------------
    if (req.method === 'POST' && (cleanPath === '/verify-txnid' || cleanPath === 'verify-txnid')) {
      const body = await readJsonBody(req);
      const { txnid } = body;
      if (!txnid) {
        return sendJson(res, 400, { success: false, message: 'txnid is required.' });
      }

      const verifyResult = await verifyPayUPaymentViaWebService(txnid);
      return sendJson(res, 200, verifyResult);
    }

    // -------------------------------------------------------------
    // 5. Customer Payment History: GET /api/payment/history
    // -------------------------------------------------------------
    if (req.method === 'GET' && (cleanPath === '/history' || cleanPath === 'history')) {
      const customerId = user ? user.id : queryParams.get('customerId');
      const email = user?.email || queryParams.get('email');
      const phone = user?.phone || queryParams.get('phone');

      const history = await getCustomerPaymentHistory(customerId, email, phone);
      return sendJson(res, 200, { success: true, history });
    }

    if (next) return next();
    return sendJson(res, 404, { success: false, message: 'Payment route not found.' });
  } catch (err) {
    console.error('[UPLOOKZ PAYU PAYMENT MIDDLEWARE ERROR]', err);
    return sendJson(res, 400, {
      success: false,
      message: err.message || 'Payment processing error'
    });
  }
}
