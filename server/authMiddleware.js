import {
  sendOtp,
  verifyOtp,
  completeRegistration,
  switchRole,
  loginWithPassword,
  getSessionUser,
  logout,
} from './authService.js';

/**
 * Helper to read JSON request body from IncomingMessage
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Protect against overly large payloads (limit to 1MB)
      if (body.length > 1e6) {
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

/**
 * Helper to send JSON responses
 */
function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

/**
 * Extract bearer token
 */
function getBearerToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

/**
 * Auth Connect/Vite Middleware handler
 */
export async function authMiddleware(req, res, next) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }

  // Parse path relative to /api/auth
  // URL might be '/send-otp' or '/api/auth/send-otp' depending on mount
  const url = req.url.split('?')[0];
  const cleanPath = url.replace(/^\/api\/auth/, '');

  try {
    // 1. POST /api/auth/send-otp
    if (req.method === 'POST' && (cleanPath === '/send-otp' || cleanPath === 'send-otp')) {
      const body = await readJsonBody(req);
      const result = await sendOtp(body.phone, body.countryCode);
      return sendJson(res, result.status, result);
    }

    // 2. POST /api/auth/verify-otp
    if (req.method === 'POST' && (cleanPath === '/verify-otp' || cleanPath === 'verify-otp')) {
      const body = await readJsonBody(req);
      const result = await verifyOtp(body.phone, body.countryCode, body.otp);
      return sendJson(res, result.status, result);
    }

    // 3. POST /api/auth/complete-registration
    if (req.method === 'POST' && (cleanPath === '/complete-registration' || cleanPath === 'complete-registration')) {
      const body = await readJsonBody(req);
      const token = getBearerToken(req) || body.token;
      const result = await completeRegistration(token, body);
      return sendJson(res, result.status, result);
    }

    // 4. POST /api/auth/switch-role
    if (req.method === 'POST' && (cleanPath === '/switch-role' || cleanPath === 'switch-role')) {
      const body = await readJsonBody(req);
      const token = getBearerToken(req) || body.token;
      const result = await switchRole(token, body.targetRole);
      return sendJson(res, result.status, result);
    }

    // 5. POST /api/auth/login-password (legacy email/password support)
    if (req.method === 'POST' && (cleanPath === '/login-password' || cleanPath === 'login-password')) {
      const body = await readJsonBody(req);
      const result = await loginWithPassword(body.emailOrPhone, body.password);
      return sendJson(res, result.status, result);
    }

    // 6. GET /api/auth/session
    if (req.method === 'GET' && (cleanPath === '/session' || cleanPath === 'session')) {
      const token = getBearerToken(req);
      const result = await getSessionUser(token);
      return sendJson(res, result.status, result);
    }

    // 7. POST /api/auth/logout
    if (req.method === 'POST' && (cleanPath === '/logout' || cleanPath === 'logout')) {
      const token = getBearerToken(req);
      const result = await logout(token);
      return sendJson(res, result.status, result);
    }

    // Unknown auth route
    if (next) {
      return next();
    }
    return sendJson(res, 404, { success: false, message: 'Route not found in Auth API' });
  } catch (err) {
    console.error('[UPLOOKZ AUTH MIDDLEWARE ERROR]', err);
    return sendJson(res, 500, { success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Vite plugin to attach Auth API
 */
export function uplookzAuthPlugin() {
  return {
    name: 'uplookz-auth-api',
    configureServer(server) {
      server.middlewares.use('/api/auth', authMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/auth', authMiddleware);
    },
  };
}
