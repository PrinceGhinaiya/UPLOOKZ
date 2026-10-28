import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getSessionUser } from './authService.js';
import * as salonService from './salonService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        // 10MB limit for image uploads
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

/**
 * Resolve salon context from auth token or fallback to Rahul Sharma's salon
 */
async function resolveSalon(req) {
  const token = getBearerToken(req);
  let user = null;
  if (token) {
    const sessionRes = await getSessionUser(token);
    if (sessionRes && sessionRes.success && sessionRes.user) {
      user = sessionRes.user;
    }
  }

  // If user has a registered salon, find by owner id
  let salon = null;
  if (user) {
    salon = await salonService.getSalonByOwner(user.id);
  }

  // Fallback to default primary salon for dev mode / seamless experience
  if (!salon) {
    salon = await salonService.getSalonById('salon_apex_01');
  }

  return { salon, user };
}

export async function salonMiddleware(req, res, next) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }

  const [rawPath, queryString] = req.url.split('?');
  const queryParams = new URLSearchParams(queryString || '');
  const cleanPath = rawPath.replace(/^\/api\/salon/, '');

  try {
    // -------------------------------------------------------------
    // Image Upload Endpoint: POST /api/salon/upload
    // -------------------------------------------------------------
    if (req.method === 'POST' && (cleanPath === '/upload' || cleanPath === 'upload')) {
      const body = await readJsonBody(req);
      const { dataBase64, filename } = body;
      if (!dataBase64) {
        return sendJson(res, 400, { success: false, message: 'No image data provided.' });
      }

      const matches = dataBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer;
      let ext = 'jpg';
      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(dataBase64, 'base64');
      }

      const safeName = `uplookz_${Date.now()}_${crypto.randomBytes(3).toString('hex')}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${safeName}`;
      return sendJson(res, 200, { success: true, url: publicUrl });
    }

    // -------------------------------------------------------------
    // 1. Profile: GET /api/salon/profile, PUT /api/salon/profile
    // -------------------------------------------------------------
    if (cleanPath === '/profile' || cleanPath === 'profile') {
      const { salon, user } = await resolveSalon(req);
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, salon, user });
      }
      if (req.method === 'PUT') {
        const body = await readJsonBody(req);
        if (!salon) {
          return sendJson(res, 404, { success: false, message: 'Salon not found.' });
        }
        const updated = await salonService.updateSalonProfile(salon.id, body);
        return sendJson(res, 200, { success: true, salon: updated });
      }
    }

    // Create Salon: POST /api/salon/create
    if (req.method === 'POST' && (cleanPath === '/create' || cleanPath === 'create')) {
      const { user } = await resolveSalon(req);
      const body = await readJsonBody(req);
      const ownerId = user ? user.id : `usr_${Date.now()}`;
      const newSalon = await salonService.createSalon(ownerId, body);
      return sendJson(res, 201, { success: true, salon: newSalon });
    }

    // -------------------------------------------------------------
    // 2. Services: GET /api/salon/services, POST, PUT, DELETE
    // -------------------------------------------------------------
    if (cleanPath === '/services' || cleanPath === 'services') {
      const { salon } = await resolveSalon(req);
      if (!salon) return sendJson(res, 404, { success: false, message: 'Salon not found.' });

      if (req.method === 'GET') {
        const services = await salonService.getServices(salon.id);
        return sendJson(res, 200, { success: true, services });
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const newService = await salonService.addService(salon.id, body);
        return sendJson(res, 201, { success: true, service: newService });
      }
    }

    const serviceMatch = cleanPath.match(/^\/services\/([a-zA-Z0-9_-]+)$/);
    if (serviceMatch) {
      const serviceId = serviceMatch[1];
      const { salon } = await resolveSalon(req);
      if (!salon) return sendJson(res, 404, { success: false, message: 'Salon not found.' });

      if (req.method === 'PUT') {
        const body = await readJsonBody(req);
        const updated = await salonService.updateService(salon.id, serviceId, body);
        return sendJson(res, 200, { success: true, service: updated });
      }
      if (req.method === 'DELETE') {
        await salonService.deleteService(salon.id, serviceId);
        return sendJson(res, 200, { success: true, message: 'Service deleted.' });
      }
    }

    // -------------------------------------------------------------
    // 3. Staff: GET /api/salon/staff, POST, PUT, DELETE
    // -------------------------------------------------------------
    if (cleanPath === '/staff' || cleanPath === 'staff') {
      const { salon } = await resolveSalon(req);
      if (!salon) return sendJson(res, 404, { success: false, message: 'Salon not found.' });

      if (req.method === 'GET') {
        const staff = await salonService.getStaff(salon.id);
        return sendJson(res, 200, { success: true, staff });
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const newStaff = await salonService.addStaff(salon.id, body);
        return sendJson(res, 201, { success: true, staff: newStaff });
      }
    }

    const staffMatch = cleanPath.match(/^\/staff\/([a-zA-Z0-9_-]+)$/);
    if (staffMatch) {
      const staffId = staffMatch[1];
      const { salon } = await resolveSalon(req);
      if (!salon) return sendJson(res, 404, { success: false, message: 'Salon not found.' });

      if (req.method === 'PUT') {
        const body = await readJsonBody(req);
        const updated = await salonService.updateStaff(salon.id, staffId, body);
        return sendJson(res, 200, { success: true, staff: updated });
      }
      if (req.method === 'DELETE') {
        await salonService.deleteStaff(salon.id, staffId);
        return sendJson(res, 200, { success: true, message: 'Staff member deleted.' });
      }
    }

    // -------------------------------------------------------------
    // 4. Appointments: GET /api/salon/appointments, POST, STATUS, RESCHEDULE
    // -------------------------------------------------------------
    if (cleanPath === '/appointments' || cleanPath === 'appointments') {
      const { salon } = await resolveSalon(req);
      if (!salon) return sendJson(res, 404, { success: false, message: 'Salon not found.' });

      if (req.method === 'GET') {
        const filters = {
          date: queryParams.get('date'),
          status: queryParams.get('status'),
          staffId: queryParams.get('staffId'),
          search: queryParams.get('search')
        };
        const appointments = await salonService.getAppointments(salon.id, filters);
        return sendJson(res, 200, { success: true, appointments });
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const newApt = await salonService.createAppointment(salon.id, body);
        return sendJson(res, 201, { success: true, appointment: newApt });
      }
    }

    if (req.method === 'POST' && (cleanPath === '/appointments/check-availability' || cleanPath === 'appointments/check-availability')) {
      const { salon } = await resolveSalon(req);
      const body = await readJsonBody(req);
      const avail = await salonService.checkAvailability(
        salon.id,
        body.date,
        body.time,
        body.durationMinutes || 45,
        body.staffId,
        body.excludeAptId
      );
      return sendJson(res, 200, { success: true, ...avail });
    }

    const aptStatusMatch = cleanPath.match(/^\/appointments\/([a-zA-Z0-9_-]+)\/status$/);
    if (req.method === 'POST' && aptStatusMatch) {
      const aptId = aptStatusMatch[1];
      const { salon } = await resolveSalon(req);
      const body = await readJsonBody(req);
      const updated = await salonService.updateAppointmentStatus(salon.id, aptId, body.status, body.notes);
      return sendJson(res, 200, { success: true, appointment: updated });
    }

    const aptRescheduleMatch = cleanPath.match(/^\/appointments\/([a-zA-Z0-9_-]+)\/reschedule$/);
    if (req.method === 'POST' && aptRescheduleMatch) {
      const aptId = aptRescheduleMatch[1];
      const { salon } = await resolveSalon(req);
      const body = await readJsonBody(req);
      const updated = await salonService.rescheduleAppointment(
        salon.id,
        aptId,
        body.date,
        body.time,
        body.staffId
      );
      return sendJson(res, 200, { success: true, appointment: updated });
    }

    // -------------------------------------------------------------
    // 5. Live Queue: GET /api/salon/queue, POST, STATUS, REORDER
    // -------------------------------------------------------------
    if (cleanPath === '/queue' || cleanPath === 'queue') {
      const { salon } = await resolveSalon(req);
      if (!salon) return sendJson(res, 404, { success: false, message: 'Salon not found.' });

      if (req.method === 'GET') {
        const queue = await salonService.getQueue(salon.id);
        return sendJson(res, 200, { success: true, queue });
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const newEntry = await salonService.addWalkInToQueue(salon.id, body);
        return sendJson(res, 201, { success: true, entry: newEntry });
      }
    }

    const queueStatusMatch = cleanPath.match(/^\/queue\/([a-zA-Z0-9_-]+)\/status$/);
    if (req.method === 'POST' && queueStatusMatch) {
      const queueId = queueStatusMatch[1];
      const { salon } = await resolveSalon(req);
      const body = await readJsonBody(req);
      const updated = await salonService.updateQueueStatus(salon.id, queueId, body.status, body.reason);
      return sendJson(res, 200, { success: true, entry: updated });
    }

    const queueReorderMatch = cleanPath.match(/^\/queue\/([a-zA-Z0-9_-]+)\/reorder$/);
    if (req.method === 'POST' && queueReorderMatch) {
      const queueId = queueReorderMatch[1];
      const { salon } = await resolveSalon(req);
      const body = await readJsonBody(req);
      const queue = await salonService.reorderQueue(salon.id, queueId, body.direction);
      return sendJson(res, 200, { success: true, queue });
    }

    // -------------------------------------------------------------
    // 6. Customers: GET /api/salon/customers, POST notes
    // -------------------------------------------------------------
    if (cleanPath === '/customers' || cleanPath === 'customers') {
      const { salon } = await resolveSalon(req);
      if (req.method === 'GET') {
        const customers = await salonService.getCustomersForSalon(salon.id);
        return sendJson(res, 200, { success: true, customers });
      }
    }

    const customerNotesMatch = cleanPath.match(/^\/customers\/([a-zA-Z0-9_+-]+)\/notes$/);
    if (req.method === 'POST' && customerNotesMatch) {
      const custId = decodeURIComponent(customerNotesMatch[1]);
      const { salon } = await resolveSalon(req);
      const body = await readJsonBody(req);
      const notes = await salonService.updateCustomerNotes(salon.id, custId, body);
      return sendJson(res, 200, { success: true, notes });
    }

    // -------------------------------------------------------------
    // 7. Analytics: GET /api/salon/analytics
    // -------------------------------------------------------------
    if (cleanPath === '/analytics' || cleanPath === 'analytics') {
      const { salon } = await resolveSalon(req);
      const timeframe = queryParams.get('timeframe') || 'month';
      const analytics = await salonService.getAnalytics(salon.id, timeframe);
      return sendJson(res, 200, { success: true, analytics });
    }

    // -------------------------------------------------------------
    // 8. Reviews: GET /api/salon/reviews, POST reply
    // -------------------------------------------------------------
    if (cleanPath === '/reviews' || cleanPath === 'reviews') {
      const { salon } = await resolveSalon(req);
      if (req.method === 'GET') {
        const reviews = await salonService.getReviews(salon.id);
        return sendJson(res, 200, { success: true, ...reviews });
      }
    }

    const reviewReplyMatch = cleanPath.match(/^\/reviews\/([a-zA-Z0-9_-]+)\/reply$/);
    if (req.method === 'POST' && reviewReplyMatch) {
      const reviewId = reviewReplyMatch[1];
      const { salon } = await resolveSalon(req);
      const body = await readJsonBody(req);
      const review = await salonService.replyToReview(salon.id, reviewId, body.reply);
      return sendJson(res, 200, { success: true, review });
    }

    // -------------------------------------------------------------
    // 9. Notifications: GET, MARK READ, MARK ALL READ
    // -------------------------------------------------------------
    if (cleanPath === '/notifications' || cleanPath === 'notifications') {
      const { salon } = await resolveSalon(req);
      if (req.method === 'GET') {
        const notifications = await salonService.getNotifications(salon.id);
        return sendJson(res, 200, { success: true, notifications });
      }
    }

    if (req.method === 'POST' && (cleanPath === '/notifications/read-all' || cleanPath === 'notifications/read-all')) {
      const { salon } = await resolveSalon(req);
      await salonService.markAllNotificationsRead(salon.id);
      return sendJson(res, 200, { success: true });
    }

    const notifReadMatch = cleanPath.match(/^\/notifications\/([a-zA-Z0-9_-]+)\/read$/);
    if (req.method === 'POST' && notifReadMatch) {
      const notifId = notifReadMatch[1];
      const { salon } = await resolveSalon(req);
      const notif = await salonService.markNotificationRead(salon.id, notifId);
      return sendJson(res, 200, { success: true, notification: notif });
    }

    // -------------------------------------------------------------
    // 10. Blocked Slots: GET, POST, DELETE
    // -------------------------------------------------------------
    if (cleanPath === '/blocked-slots' || cleanPath === 'blocked-slots') {
      const { salon } = await resolveSalon(req);
      if (req.method === 'GET') {
        const date = queryParams.get('date');
        const slots = await salonService.getBlockedSlots(salon.id, date);
        return sendJson(res, 200, { success: true, blockedSlots: slots });
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const slot = await salonService.addBlockedSlot(salon.id, body);
        return sendJson(res, 201, { success: true, blockedSlot: slot });
      }
    }

    const blockSlotMatch = cleanPath.match(/^\/blocked-slots\/([a-zA-Z0-9_-]+)$/);
    if (req.method === 'DELETE' && blockSlotMatch) {
      const slotId = blockSlotMatch[1];
      const { salon } = await resolveSalon(req);
      await salonService.deleteBlockedSlot(salon.id, slotId);
      return sendJson(res, 200, { success: true });
    }

    if (next) return next();
    return sendJson(res, 404, { success: false, message: 'Salon route not found.' });
  } catch (err) {
    console.error('[UPLOOKZ SALON MIDDLEWARE ERROR]', err);
    return sendJson(res, 500, { success: false, message: err.message || 'Internal server error' });
  }
}
