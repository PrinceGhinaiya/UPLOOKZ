import { getSessionUser } from './authService.js';
import * as salonService from './salonService.js';
import { readData } from './db.js';

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
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

export async function customerMiddleware(req, res, next) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }

  const [rawPath] = req.url.split('?');
  const cleanPath = rawPath.replace(/^\/api\/customer/, '');

  try {
    const token = getBearerToken(req);
    let user = null;
    if (token) {
      const s = await getSessionUser(token);
      if (s && s.success) user = s.user;
    }

    // Default primary salon ID
    const salonId = 'salon_apex_01';

    // 1. GET /api/customer/appointments
    if (req.method === 'GET' && (cleanPath === '/appointments' || cleanPath === 'appointments')) {
      const allApts = readData('appointments.json', []);
      let userApts = [];
      if (user) {
        userApts = allApts.filter(
          (a) =>
            a.customerId === user.id ||
            (user.email && a.customerEmail && a.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
            (user.phone && a.customerPhone && a.customerPhone.includes(user.phone.slice(-10)))
        );
      }
      // If user has none or not logged in, provide John Doe's active appointments
      if (userApts.length === 0) {
        userApts = allApts.filter((a) => a.customerId === 'usr_customer_01' || a.customerName === 'John Doe');
      }
      return sendJson(res, 200, { success: true, appointments: userApts });
    }

    // 2. POST /api/customer/appointments (Customer books appointment)
    if (req.method === 'POST' && (cleanPath === '/appointments' || cleanPath === 'appointments')) {
      const body = await readJsonBody(req);
      const appointmentData = {
        ...body,
        customerId: user ? user.id : 'usr_customer_01',
        customerName: body.customerName || (user ? user.name : 'Valued Customer'),
        customerEmail: body.customerEmail || (user ? user.email : ''),
        customerPhone: body.customerPhone || (user ? user.phone : '+91 98765 43210')
      };
      const created = await salonService.createAppointment(salonId, appointmentData);
      return sendJson(res, 201, { success: true, appointment: created });
    }

    // 3. GET /api/customer/queue/status
    if (req.method === 'GET' && (cleanPath === '/queue/status' || cleanPath === 'queue/status')) {
      const queue = await salonService.getQueue(salonId);
      const waiting = queue.filter((q) => q.status === 'waiting');
      const inService = queue.filter((q) => q.status === 'in_service');
      const avgWait = waiting.length > 0 ? waiting[waiting.length - 1].estimatedWaitMinutes : 0;

      return sendJson(res, 200, {
        success: true,
        salonName: 'Apex Studio & Grooming',
        waitingCount: waiting.length,
        inServiceCount: inService.length,
        estimatedWaitMinutes: avgWait,
        queue: queue.slice(0, 10)
      });
    }

    // 4. POST /api/customer/queue/join
    if (req.method === 'POST' && (cleanPath === '/queue/join' || cleanPath === 'queue/join')) {
      const body = await readJsonBody(req);
      const queueData = {
        customerName: body.customerName || (user ? user.name : 'Customer'),
        customerPhone: body.customerPhone || (user ? user.phone : ''),
        serviceId: body.serviceId || 'srv_01',
        notes: body.notes || 'Customer online queue request'
      };
      const entry = await salonService.addWalkInToQueue(salonId, queueData);
      return sendJson(res, 201, { success: true, entry });
    }

    // 5. GET /api/customer/salon-info
    if (req.method === 'GET' && (cleanPath === '/salon-info' || cleanPath === 'salon-info')) {
      const salon = await salonService.getSalonById(salonId);
      const services = await salonService.getServices(salonId);
      const staff = await salonService.getStaff(salonId);
      return sendJson(res, 200, { success: true, salon, services, staff });
    }

    if (next) return next();
    return sendJson(res, 404, { success: false, message: 'Customer route not found.' });
  } catch (err) {
    console.error('[CUSTOMER MIDDLEWARE ERROR]', err);
    return sendJson(res, 500, { success: false, message: err.message || 'Internal server error' });
  }
}
