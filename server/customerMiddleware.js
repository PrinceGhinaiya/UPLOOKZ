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

  const [rawPath, queryString] = req.url.split('?');
  const queryParams = new URLSearchParams(queryString || '');
  const cleanPath = rawPath.replace(/^\/api\/customer/, '');

  try {
    const token = getBearerToken(req);
    let user = null;
    if (token) {
      const s = await getSessionUser(token);
      if (s && s.success) user = s.user;
    }

    // -------------------------------------------------------------
    // 1. Salons Discovery: GET /api/customer/salons
    // -------------------------------------------------------------
    if (req.method === 'GET' && (cleanPath === '/salons' || cleanPath === 'salons')) {
      const filters = {
        city: queryParams.get('city'),
        search: queryParams.get('search'),
        category: queryParams.get('category'),
        minRating: queryParams.get('minRating'),
        maxPrice: queryParams.get('maxPrice'),
        openOnly: queryParams.get('openOnly'),
        sortBy: queryParams.get('sortBy')
      };
      const salons = await salonService.getAllSalons(filters);
      return sendJson(res, 200, { success: true, salons });
    }

    // -------------------------------------------------------------
    // 1B. Search Suggestions: GET /api/customer/search/suggestions
    // -------------------------------------------------------------
    if (req.method === 'GET' && (cleanPath === '/search/suggestions' || cleanPath === 'search/suggestions')) {
      const query = queryParams.get('q') || queryParams.get('query') || '';
      const suggestions = await salonService.getSearchSuggestions(query);
      return sendJson(res, 200, { success: true, ...suggestions });
    }

    // -------------------------------------------------------------
    // 1C. Customer Favorites: GET & POST /api/customer/favorites
    // -------------------------------------------------------------
    if (req.method === 'GET' && (cleanPath === '/favorites' || cleanPath === 'favorites')) {
      if (!user) {
        return sendJson(res, 200, { success: true, favorites: [] });
      }
      const favorites = await salonService.getCustomerFavorites(user.id);
      return sendJson(res, 200, { success: true, favorites });
    }

    if (req.method === 'POST' && (cleanPath === '/favorites/toggle' || cleanPath === 'favorites/toggle')) {
      if (!user) {
        return sendJson(res, 401, { success: false, message: 'Please login to save favorite salons.' });
      }
      const body = await readJsonBody(req);
      if (!body.salonId) {
        return sendJson(res, 400, { success: false, message: 'salonId is required.' });
      }
      const result = await salonService.toggleCustomerFavorite(user.id, body.salonId);
      return sendJson(res, 200, result);
    }

    // -------------------------------------------------------------
    // 1D. Customer Recently Viewed: GET & POST /api/customer/recently-viewed
    // -------------------------------------------------------------
    if (req.method === 'GET' && (cleanPath === '/recently-viewed' || cleanPath === 'recently-viewed')) {
      if (!user) {
        return sendJson(res, 200, { success: true, recentlyViewed: [] });
      }
      const recentlyViewed = await salonService.getCustomerRecentlyViewed(user.id);
      return sendJson(res, 200, { success: true, recentlyViewed });
    }

    if (req.method === 'POST' && (cleanPath === '/recently-viewed' || cleanPath === 'recently-viewed')) {
      if (!user) {
        return sendJson(res, 200, { success: true, recentlyViewed: [] });
      }
      const body = await readJsonBody(req);
      if (!body.salonId) {
        return sendJson(res, 400, { success: false, message: 'salonId is required.' });
      }
      const result = await salonService.recordCustomerRecentlyViewed(user.id, body.salonId);
      return sendJson(res, 200, result);
    }

    // -------------------------------------------------------------
    // 2. Salon Available Slots: GET /api/customer/salons/:id/slots
    // -------------------------------------------------------------
    const salonSlotsMatch = cleanPath.match(/^\/salons\/([a-zA-Z0-9_-]+)\/slots$/);
    if (req.method === 'GET' && salonSlotsMatch) {
      const salonId = salonSlotsMatch[1];
      const date = queryParams.get('date') || salonService.getNowInTimezone('Asia/Kolkata').dateStr;
      const duration = parseInt(queryParams.get('duration'), 10) || 45;
      const staffId = queryParams.get('staffId') || null;

      const slotData = await salonService.getAvailableSlots(salonId, date, duration, staffId);
      return sendJson(res, 200, { success: true, salonId, date, ...slotData });
    }

    // -------------------------------------------------------------
    // 3. Salon Storefront Details: GET /api/customer/salons/:id
    // -------------------------------------------------------------
    const salonDetailsMatch = cleanPath.match(/^\/salons\/([a-zA-Z0-9_-]+)$/);
    if (req.method === 'GET' && salonDetailsMatch) {
      const salonId = salonDetailsMatch[1];
      const salon = await salonService.getSalonById(salonId);
      if (!salon) {
        return sendJson(res, 404, { success: false, message: 'Salon not found.' });
      }

      const allServices = await salonService.getServices(salonId);
      const activeServices = allServices.filter((s) => s.active !== false);
      const allStaff = await salonService.getStaff(salonId);
      const activeStaff = allStaff.filter((s) => s.active !== false);
      const reviewsData = await salonService.getReviews(salonId);
      const queue = await salonService.getQueue(salonId);
      const waiting = queue.filter((q) => q.status === 'waiting');
      const inService = queue.filter((q) => q.status === 'in_service');
      const estimatedWait = waiting.length > 0 ? (waiting[waiting.length - 1].estimatedWaitMinutes || waiting.length * 15) : 0;

      return sendJson(res, 200, {
        success: true,
        salon,
        services: activeServices,
        staff: activeStaff,
        reviews: reviewsData,
        queueStatus: {
          waitingCount: waiting.length,
          inServiceCount: inService.length,
          estimatedWaitMinutes: estimatedWait
        }
      });
    }

    // -------------------------------------------------------------
    // 4. Appointments: GET /api/customer/appointments
    // -------------------------------------------------------------
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
      return sendJson(res, 200, { success: true, appointments: userApts });
    }

    // -------------------------------------------------------------
    // 5. Book Appointment: POST /api/customer/appointments
    // -------------------------------------------------------------
    if (req.method === 'POST' && (cleanPath === '/appointments' || cleanPath === 'appointments')) {
      const body = await readJsonBody(req);
      if (!body.salonId || typeof body.salonId !== 'string' || !body.salonId.trim()) {
        return sendJson(res, 400, {
          success: false,
          message: 'Explicit salonId is required. Defaulting or cross-salon booking is strictly prohibited.'
        });
      }

      const targetSalonId = body.salonId.trim();
      const appointmentData = {
        ...body,
        customerId: user ? user.id : (body.customerId || `cust_guest_${Date.now()}`),
        customerName: body.customerName || (user ? user.name : 'Guest Customer'),
        customerEmail: body.customerEmail || (user ? user.email : ''),
        customerPhone: body.customerPhone || (user ? user.phone : '')
      };

      const created = await salonService.createAppointment(targetSalonId, appointmentData);
      return sendJson(res, 201, { success: true, appointment: created });
    }

    // -------------------------------------------------------------
    // 6. Cancel Appointment: POST /api/customer/appointments/:id/cancel
    // -------------------------------------------------------------
    const aptCancelMatch = cleanPath.match(/^\/appointments\/([a-zA-Z0-9_-]+)\/cancel$/);
    if (req.method === 'POST' && aptCancelMatch) {
      const aptId = aptCancelMatch[1];
      const body = await readJsonBody(req);
      const allApts = readData('appointments.json', []);
      const apt = allApts.find((a) => a.id === aptId);
      if (!apt) {
        return sendJson(res, 404, { success: false, message: 'Appointment not found.' });
      }

      const updated = await salonService.cancelCustomerAppointment(
        apt.salonId,
        aptId,
        user ? user.id : apt.customerId,
        body.reason
      );
      return sendJson(res, 200, { success: true, appointment: updated });
    }

    // -------------------------------------------------------------
    // 7. Reschedule Appointment: POST /api/customer/appointments/:id/reschedule
    // -------------------------------------------------------------
    const aptRescheduleMatch = cleanPath.match(/^\/appointments\/([a-zA-Z0-9_-]+)\/reschedule$/);
    if (req.method === 'POST' && aptRescheduleMatch) {
      const aptId = aptRescheduleMatch[1];
      const body = await readJsonBody(req);
      const allApts = readData('appointments.json', []);
      const apt = allApts.find((a) => a.id === aptId);
      if (!apt) {
        return sendJson(res, 404, { success: false, message: 'Appointment not found.' });
      }

      const updated = await salonService.rescheduleCustomerAppointment(
        apt.salonId,
        aptId,
        user ? user.id : apt.customerId,
        body.date,
        body.time,
        body.staffId || null
      );
      return sendJson(res, 200, { success: true, appointment: updated });
    }

    // -------------------------------------------------------------
    // 8. Submit Customer Review: POST /api/customer/reviews
    // -------------------------------------------------------------
    if (req.method === 'POST' && (cleanPath === '/reviews' || cleanPath === 'reviews')) {
      const body = await readJsonBody(req);
      const { salonId, appointmentId, rating, comment } = body;
      const review = await salonService.addCustomerReview(
        salonId,
        appointmentId,
        user ? user.id : null,
        user ? user.name : (body.customerName || 'Verified Customer'),
        rating,
        comment
      );
      return sendJson(res, 201, { success: true, review });
    }

    // -------------------------------------------------------------
    // 9. Live Queue Status: GET /api/customer/queue/status
    // -------------------------------------------------------------
    if (req.method === 'GET' && (cleanPath === '/queue/status' || cleanPath === 'queue/status')) {
      const allSalons = await salonService.getAllSalons();
      const salonId = queryParams.get('salonId') || allSalons[0]?.id;
      if (!salonId) {
        return sendJson(res, 200, {
          success: true,
          salonName: '',
          waitingCount: 0,
          inServiceCount: 0,
          estimatedWaitMinutes: 0,
          mySpot: null,
          queue: []
        });
      }
      const salon = await salonService.getSalonById(salonId);
      const queue = await salonService.getQueue(salonId);
      const waiting = queue.filter((q) => q.status === 'waiting');
      const inService = queue.filter((q) => q.status === 'in_service');
      const avgWait = waiting.length > 0 ? (waiting[waiting.length - 1].estimatedWaitMinutes || waiting.length * 15) : 0;

      // If user is logged in, find their own active spot
      let mySpot = null;
      if (user) {
        mySpot = queue.find(
          (q) =>
            (q.status === 'waiting' || q.status === 'in_service') &&
            ((q.customerPhone && user.phone && q.customerPhone.includes(user.phone.slice(-10))) ||
              (q.customerName && user.name && q.customerName.toLowerCase() === user.name.toLowerCase()))
        );
      }

      return sendJson(res, 200, {
        success: true,
        salonName: salon?.name || 'Studio Queue',
        waitingCount: waiting.length,
        inServiceCount: inService.length,
        estimatedWaitMinutes: avgWait,
        mySpot: mySpot || null,
        queue: queue.slice(0, 10)
      });
    }

    // -------------------------------------------------------------
    // 10. Join Live Queue: POST /api/customer/queue/join
    // -------------------------------------------------------------
    if (req.method === 'POST' && (cleanPath === '/queue/join' || cleanPath === 'queue/join')) {
      const body = await readJsonBody(req);
      const allSalons = await salonService.getAllSalons();
      const targetSalonId = body.salonId || allSalons[0]?.id;
      if (!targetSalonId) {
        return sendJson(res, 400, { success: false, message: 'No salon available to join queue.' });
      }
      const queueData = {
        customerName: body.customerName || (user ? user.name : 'Customer'),
        customerPhone: body.customerPhone || (user ? user.phone : ''),
        serviceId: body.serviceId || null,
        staffId: body.staffId || null,
        notes: body.notes || 'Customer online queue check-in'
      };
      const entry = await salonService.addWalkInToQueue(targetSalonId, queueData);
      return sendJson(res, 201, { success: true, entry });
    }

    // -------------------------------------------------------------
    // 11. Legacy Salon Info: GET /api/customer/salon-info
    // -------------------------------------------------------------
    if (req.method === 'GET' && (cleanPath === '/salon-info' || cleanPath === 'salon-info')) {
      const allSalons = await salonService.getAllSalons();
      const salonId = queryParams.get('salonId') || allSalons[0]?.id;
      if (!salonId) {
        return sendJson(res, 404, { success: false, message: 'No salon found.' });
      }
      const salon = await salonService.getSalonById(salonId);
      const services = await salonService.getServices(salonId);
      const staff = await salonService.getStaff(salonId);
      return sendJson(res, 200, { success: true, salon, services, staff });
    }

    if (next) return next();
    return sendJson(res, 404, { success: false, message: 'Customer route not found.' });
  } catch (err) {
    console.error('[CUSTOMER MIDDLEWARE ERROR]', err);
    return sendJson(res, 400, { success: false, message: err.message || 'Internal server error' });
  }
}
