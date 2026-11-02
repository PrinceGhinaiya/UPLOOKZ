import { authClient } from './authClient';

function getHeaders() {
  const token = authClient.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const salonClient = {
  // 1. Profile
  async fetchProfile() {
    const res = await fetch('/api/salon/profile', { headers: getHeaders() });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await fetch('/api/salon/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  async createSalon(salonData) {
    const res = await fetch('/api/salon/create', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(salonData)
    });
    return handleResponse(res);
  },

  // 2. Services
  async fetchServices() {
    const res = await fetch('/api/salon/services', { headers: getHeaders() });
    return handleResponse(res);
  },

  async addService(serviceData) {
    const res = await fetch('/api/salon/services', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(serviceData)
    });
    return handleResponse(res);
  },

  async updateService(id, serviceData) {
    const res = await fetch(`/api/salon/services/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(serviceData)
    });
    return handleResponse(res);
  },

  async deleteService(id) {
    const res = await fetch(`/api/salon/services/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // 3. Staff
  async fetchStaff() {
    const res = await fetch('/api/salon/staff', { headers: getHeaders() });
    return handleResponse(res);
  },

  async addStaff(staffData) {
    const res = await fetch('/api/salon/staff', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(staffData)
    });
    return handleResponse(res);
  },

  async updateStaff(id, staffData) {
    const res = await fetch(`/api/salon/staff/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(staffData)
    });
    return handleResponse(res);
  },

  async deleteStaff(id) {
    const res = await fetch(`/api/salon/staff/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // 4. Appointments
  async fetchAppointments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.status) params.append('status', filters.status);
    if (filters.staffId) params.append('staffId', filters.staffId);
    if (filters.search) params.append('search', filters.search);

    const res = await fetch(`/api/salon/appointments?${params.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createAppointment(appointmentData) {
    const res = await fetch('/api/salon/appointments', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(appointmentData)
    });
    return handleResponse(res);
  },

  async checkAvailability(params) {
    const res = await fetch('/api/salon/appointments/check-availability', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  async updateAppointmentStatus(id, status, notes = '') {
    const res = await fetch(`/api/salon/appointments/${id}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status, notes })
    });
    return handleResponse(res);
  },

  async recordAppointmentPayment(id, paymentData = {}) {
    const res = await fetch(`/api/salon/appointments/${id}/payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        paymentStatus: paymentData.paymentStatus || 'paid',
        paymentMethod: paymentData.paymentMethod || 'Cash',
        amount: paymentData.amount
      })
    });
    return handleResponse(res);
  },

  async rescheduleAppointment(id, rescheduleData) {
    const res = await fetch(`/api/salon/appointments/${id}/reschedule`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(rescheduleData)
    });
    return handleResponse(res);
  },

  // 5. Live Queue
  async fetchQueue() {
    const res = await fetch('/api/salon/queue', { headers: getHeaders() });
    return handleResponse(res);
  },

  async addWalkIn(walkInData) {
    const res = await fetch('/api/salon/queue', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(walkInData)
    });
    return handleResponse(res);
  },

  async updateQueueStatus(id, status, reason = '') {
    const res = await fetch(`/api/salon/queue/${id}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status, reason })
    });
    return handleResponse(res);
  },

  async reorderQueue(id, direction) {
    const res = await fetch(`/api/salon/queue/${id}/reorder`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ direction })
    });
    return handleResponse(res);
  },

  // 6. Customers
  async fetchCustomers() {
    const res = await fetch('/api/salon/customers', { headers: getHeaders() });
    return handleResponse(res);
  },

  async updateCustomerNotes(customerId, notesData) {
    const res = await fetch(`/api/salon/customers/${encodeURIComponent(customerId)}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(notesData)
    });
    return handleResponse(res);
  },

  // 7. Analytics
  async fetchAnalytics(timeframe = 'month', options = {}) {
    const params = new URLSearchParams({ timeframe });
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    const res = await fetch(`/api/salon/analytics?${params.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // 8. Reviews
  async fetchReviews() {
    const res = await fetch('/api/salon/reviews', { headers: getHeaders() });
    return handleResponse(res);
  },

  async replyToReview(id, reply) {
    const res = await fetch(`/api/salon/reviews/${id}/reply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reply })
    });
    return handleResponse(res);
  },

  // 9. Notifications
  async fetchNotifications() {
    const res = await fetch('/api/salon/notifications', { headers: getHeaders() });
    return handleResponse(res);
  },

  async markNotificationRead(id) {
    const res = await fetch(`/api/salon/notifications/${id}/read`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead() {
    const res = await fetch('/api/salon/notifications/read-all', {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // 10. Blocked Slots
  async fetchBlockedSlots(date = null) {
    const url = date ? `/api/salon/blocked-slots?date=${date}` : '/api/salon/blocked-slots';
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async addBlockedSlot(slotData) {
    const res = await fetch('/api/salon/blocked-slots', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(slotData)
    });
    return handleResponse(res);
  },

  async deleteBlockedSlot(id) {
    const res = await fetch(`/api/salon/blocked-slots/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // 11. Image Upload
  async uploadImage(dataBase64, filename = 'image.jpg') {
    const res = await fetch('/api/salon/upload', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ dataBase64, filename })
    });
    return handleResponse(res);
  },

  // 12. Customer-facing endpoints
  async fetchCustomerSalons(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `/api/customer/salons?${qs}` : '/api/customer/salons';
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async fetchCustomerSalonDetails(salonId) {
    const res = await fetch(`/api/customer/salons/${salonId}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async fetchAvailableSlots(salonId, date, duration = 30, staffId = '') {
    const params = new URLSearchParams({ date, duration: String(duration) });
    if (staffId) params.append('staffId', staffId);
    const res = await fetch(`/api/customer/salons/${salonId}/slots?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async fetchCustomerAppointments() {
    const res = await fetch('/api/customer/appointments', { headers: getHeaders() });
    return handleResponse(res);
  },

  async bookCustomerAppointment(data) {
    const res = await fetch('/api/customer/appointments', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async cancelCustomerAppointment(appointmentId, reason = '') {
    const res = await fetch(`/api/customer/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(res);
  },

  async rescheduleCustomerAppointment(appointmentId, date, time, staffId = null) {
    const res = await fetch(`/api/customer/appointments/${appointmentId}/reschedule`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ date, time, staffId })
    });
    return handleResponse(res);
  },

  async submitCustomerReview(reviewData) {
    const res = await fetch('/api/customer/reviews', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reviewData)
    });
    return handleResponse(res);
  },

  async fetchCustomerQueueStatus(salonId = '') {
    const url = salonId ? `/api/customer/queue/status?salonId=${salonId}` : '/api/customer/queue/status';
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async joinCustomerQueue(data) {
    const res = await fetch('/api/customer/queue/join', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async fetchCustomerSalonInfo(salonId = '') {
    const url = salonId ? `/api/customer/salons/${salonId}` : '/api/customer/salon-info';
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async fetchSearchSuggestions(query = '') {
    const url = `/api/customer/search/suggestions?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async fetchFavorites() {
    const res = await fetch('/api/customer/favorites', { headers: getHeaders() });
    return handleResponse(res);
  },

  async toggleFavorite(salonId) {
    const res = await fetch('/api/customer/favorites/toggle', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ salonId })
    });
    return handleResponse(res);
  },

  async fetchRecentlyViewed() {
    const res = await fetch('/api/customer/recently-viewed', { headers: getHeaders() });
    return handleResponse(res);
  },

  async recordRecentlyViewed(salonId) {
    const res = await fetch('/api/customer/recently-viewed', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ salonId })
    });
    return handleResponse(res);
  }
};
