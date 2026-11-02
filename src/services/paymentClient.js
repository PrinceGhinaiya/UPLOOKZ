import { authClient } from './authClient';

export const paymentClient = {
  /**
   * Fetch public config (merchantKey, baseUrl, environment)
   */
  async fetchConfig() {
    const token = authClient.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/payment/config', { headers });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch payment configuration.');
    }
    return data;
  },

  /**
   * Securely initiate PayU payment request from backend
   */
  async initiatePayment(appointmentId, returnUrl = '') {
    if (!appointmentId) {
      throw new Error('Appointment ID is required to initiate PayU payment.');
    }

    const token = authClient.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/payment/initiate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ appointmentId, returnUrl })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to initiate PayU payment.');
    }
    return data;
  },

  /**
   * Redirects customer to PayU's Official Hosted Checkout Interface.
   * Dynamically constructs an HTTP POST form and submits it to PayU's endpoint.
   * No credentials or payment cards are ever handled inside UPLOOKZ.
   */
  redirectToPayUHostedCheckout(action, params) {
    if (!action || !params) {
      throw new Error('Missing action URL or parameters for PayU hosted checkout.');
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    form.style.display = 'none';

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      }
    }

    document.body.appendChild(form);
    form.submit();
  },

  /**
   * High-level checkout orchestrator:
   * Initiates payment order and redirects to PayU Hosted Checkout.
   */
  async openCheckout({ appointment, returnUrl = '' }) {
    if (!appointment || !appointment.id) {
      throw new Error('Valid appointment is required to initiate checkout.');
    }

    const effectiveReturnUrl = returnUrl || (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/?tab=appointments');

    const checkoutData = await this.initiatePayment(appointment.id, effectiveReturnUrl);
    if (!checkoutData.action || !checkoutData.params) {
      throw new Error('Invalid checkout parameters received from payment server.');
    }

    // Redirect to official PayU hosted checkout
    this.redirectToPayUHostedCheckout(checkoutData.action, checkoutData.params);
    return checkoutData;
  },

  /**
   * Fetch customer's past payment history
   */
  async fetchCustomerPaymentHistory(customerId = null) {
    const token = authClient.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = customerId ? `/api/payment/history?customerId=${customerId}` : '/api/payment/history';
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch payment history.');
    }
    return data.history || [];
  }
};
