/**
 * UPLOOKZ Authentication Client
 * Interacts with /api/auth endpoints and manages local session
 */

const TOKEN_KEY = 'uplookz_auth_token';
const USER_KEY = 'uplookz_user_profile';

const listeners = new Set();

function notifyListeners(user) {
  listeners.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.error('[UPLOOKZ AUTH CLIENT] Listener error:', e);
    }
  });
}

export const authClient = {
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getStoredUser() {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setSession(token, user) {
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    notifyListeners(user);
  },

  clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notifyListeners(null);
  },

  async sendEmailOtp(email) {
    const res = await fetch('/api/auth/send-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send verification code.');
    }
    return data;
  },

  async verifyEmailOtp(email, otp) {
    const res = await fetch('/api/auth/verify-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to verify verification code.');
    }
    if (data.success && data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    return data;
  },

  async loginWithGoogle(payload) {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Google sign-in failed.');
    }
    if (data.success && data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    return data;
  },

  async completeRegistration(details) {
    const token = this.getToken();
    const res = await fetch('/api/auth/complete-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ ...details, token }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to complete registration.');
    }
    if (data.success && data.user) {
      this.setSession(data.token || token, data.user);
    }
    return data;
  },

  async switchRole(targetRole) {
    const token = this.getToken();
    const res = await fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ targetRole, token }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to switch role.');
    }
    if (data.success && data.user) {
      this.setSession(token, data.user);
    }
    return data;
  },

  async fetchSession() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/session', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        this.setSession(token, data.user);
        return data.user;
      }
      this.clearSession();
      return null;
    } catch {
      return this.getStoredUser();
    }
  },

  async logout() {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.error('[UPLOOKZ AUTH CLIENT] Logout error:', e);
      }
    }
    this.clearSession();
  },
};
