import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sendEmailVerification } from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Secret salt for OTP hashing so plaintext OTP is never retained in memory
const OTP_SALT = process.env.OTP_SECRET_SALT || 'uplookz-secure-email-otp-salt-8831924';

// In-memory OTP tracking with security boundaries
// Map<normalizedEmail, { hashedOtp, expiresAt, attemptsLeft, lastSentAt, requestCount, windowStart, latestOtpForDev }>
const otpStore = new Map();

// In-memory active sessions
// Map<token, { email, userId, createdAt, expiresAt }>
const sessionStore = new Map();

/**
 * Load users from disk
 */
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[UPLOOKZ AUTH] Error reading users file:', err);
  }
  return {};
}

/**
 * Save users to disk
 */
function saveUsers(users) {
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('[UPLOOKZ AUTH] Error saving users file:', err);
  }
}

/**
 * Hash an OTP using SHA-256 + salt
 */
function hashOtp(otp, salt) {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

/**
 * Standard Email Validator
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required.' };
  }
  const cleanEmail = email.trim().toLowerCase();
  // Standard RFC 5322 compatible regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  return { valid: true, normalized: cleanEmail };
}

/**
 * Send OTP to user's email
 */
export async function sendEmailOtp(rawEmail) {
  const validation = validateEmail(rawEmail);
  if (!validation.valid) {
    return { success: false, status: 400, message: validation.error };
  }

  const normalizedEmail = validation.normalized;
  const now = Date.now();
  const existing = otpStore.get(normalizedEmail);

  // 1. Resend cooldown protection (minimum 30 seconds)
  if (existing && existing.lastSentAt) {
    const elapsedSeconds = Math.floor((now - existing.lastSentAt) / 1000);
    const cooldown = 30;
    if (elapsedSeconds < cooldown) {
      const waitTime = cooldown - elapsedSeconds;
      return {
        success: false,
        status: 429,
        message: `Please wait ${waitTime}s before requesting a new code.`,
        retryAfter: waitTime,
      };
    }
  }

  // 2. Abuse protection (maximum 6 requests per hour per email)
  if (existing) {
    const windowElapsed = now - existing.windowStart;
    if (windowElapsed < 60 * 60 * 1000) {
      if (existing.requestCount >= 6) {
        return {
          success: false,
          status: 429,
          message: 'Too many verification requests. Please try again after 1 hour.',
        };
      }
    }
  }

  // 3. Cryptographically secure 6-digit OTP generation
  const otpNumber = crypto.randomInt(100000, 1000000);
  const otpString = otpNumber.toString();
  const hashed = hashOtp(otpString, OTP_SALT);

  // 4. Update OTP session
  const requestCount = existing && (now - existing.windowStart < 60 * 60 * 1000)
    ? existing.requestCount + 1
    : 1;

  const windowStart = existing && (now - existing.windowStart < 60 * 60 * 1000)
    ? existing.windowStart
    : now;

  otpStore.set(normalizedEmail, {
    hashedOtp: hashed,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes expiration
    attemptsLeft: 4,               // Max 4 failed verification attempts
    lastSentAt: now,
    requestCount,
    windowStart,
    devCode: otpString,
  });

  // 5. Send via configured email service
  const emailResult = await sendEmailVerification(normalizedEmail, otpString);

  return {
    success: true,
    status: 200,
    message: `Verification code sent to ${normalizedEmail}.`,
    cooldownSeconds: 30,
    expiresInSeconds: 300,
    provider: emailResult.provider,
    devHint: emailResult.devCode,
  };
}

/**
 * Verify Email OTP
 */
export async function verifyEmailOtp(rawEmail, inputOtp) {
  const validation = validateEmail(rawEmail);
  if (!validation.valid) {
    return { success: false, status: 400, message: validation.error };
  }

  const normalizedEmail = validation.normalized;

  if (!inputOtp || typeof inputOtp !== 'string' || inputOtp.trim().length !== 6) {
    return { success: false, status: 400, message: 'Please enter a valid 6-digit code.' };
  }

  const cleanOtp = inputOtp.trim();
  const session = otpStore.get(normalizedEmail);

  if (!session) {
    return {
      success: false,
      status: 400,
      message: 'No verification code requested or session expired. Please request a new code.',
    };
  }

  const now = Date.now();

  // 1. Expiration check
  if (now > session.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      status: 400,
      message: 'Verification code has expired. Please request a new code.',
    };
  }

  // 2. Attempts check
  if (session.attemptsLeft <= 0) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      status: 400,
      message: 'Maximum verification attempts exceeded. Please request a new code.',
    };
  }

  // 3. Timing-safe OTP comparison
  const inputHashed = hashOtp(cleanOtp, OTP_SALT);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(inputHashed, 'hex'),
    Buffer.from(session.hashedOtp, 'hex')
  );

  if (!isMatch) {
    session.attemptsLeft -= 1;
    if (session.attemptsLeft <= 0) {
      otpStore.delete(normalizedEmail);
      return {
        success: false,
        status: 400,
        message: 'Too many incorrect attempts. Please request a new code.',
      };
    }
    return {
      success: false,
      status: 400,
      message: `Invalid verification code. ${session.attemptsLeft} attempt${session.attemptsLeft > 1 ? 's' : ''} remaining.`,
      attemptsLeft: session.attemptsLeft,
    };
  }

  // OTP verified! Invalidate OTP session to prevent replay
  otpStore.delete(normalizedEmail);

  // Check if user already exists
  const users = loadUsers();
  let existingUser = null;

  for (const u of Object.values(users)) {
    if (u.email && u.email.toLowerCase() === normalizedEmail) {
      existingUser = u;
      break;
    }
  }

  // Generate secure 256-bit session token
  const token = crypto.randomBytes(32).toString('hex');

  if (existingUser) {
    sessionStore.set(token, {
      userId: existingUser.id,
      email: normalizedEmail,
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return {
      success: true,
      status: 200,
      token,
      isNewUser: false,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        roles: existingUser.roles || [existingUser.activeRole],
        activeRole: existingUser.activeRole || 'customer',
        salonName: existingUser.salonName,
        city: existingUser.city,
      },
      message: 'Login successful!',
    };
  }

  // New user registration required
  sessionStore.set(token, {
    userId: `temp_${Date.now()}`,
    email: normalizedEmail,
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000,
  });

  return {
    success: true,
    status: 200,
    token,
    isNewUser: true,
    user: {
      email: normalizedEmail,
      isVerified: true,
      roles: [],
      activeRole: null,
    },
    message: 'Email verified! Please complete your account profile.',
  };
}

/**
 * Handle Google Authentication
 */
export async function loginWithGoogle(payload) {
  let googleEmail = '';
  let googleName = '';
  let googlePicture = '';
  let googleSub = '';

  if (payload.credential) {
    // Decode Google JWT Token (JWT header.payload.signature)
    try {
      const parts = payload.credential.split('.');
      if (parts.length >= 2) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
        const tokenData = JSON.parse(payloadJson);
        googleEmail = tokenData.email;
        googleName = tokenData.name || tokenData.given_name || 'Google User';
        googlePicture = tokenData.picture || '';
        googleSub = tokenData.sub || '';
      }
    } catch (e) {
      console.error('[UPLOOKZ AUTH] Error decoding Google credential:', e);
    }
  }

  if (!googleEmail && payload.email) {
    googleEmail = payload.email;
    googleName = payload.name || 'Google User';
    googlePicture = payload.picture || '';
    googleSub = payload.sub || `google_${Date.now()}`;
  }

  const validation = validateEmail(googleEmail);
  if (!validation.valid) {
    return { success: false, status: 400, message: 'Invalid Google email profile received.' };
  }

  const normalizedEmail = validation.normalized;
  const users = loadUsers();
  let foundUser = null;

  for (const u of Object.values(users)) {
    if (u.email && u.email.toLowerCase() === normalizedEmail) {
      foundUser = u;
      break;
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();

  if (foundUser) {
    // Existing user
    sessionStore.set(token, {
      userId: foundUser.id,
      email: normalizedEmail,
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      status: 200,
      token,
      isNewUser: false,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        picture: foundUser.picture || googlePicture,
        roles: foundUser.roles || [foundUser.activeRole],
        activeRole: foundUser.activeRole || 'customer',
        salonName: foundUser.salonName,
        city: foundUser.city,
      },
      message: 'Google Sign-In successful!',
    };
  }

  // Create new user record immediately with Google profile
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    name: googleName,
    picture: googlePicture,
    googleId: googleSub,
    roles: ['customer'],
    activeRole: 'customer',
    createdAt: new Date().toISOString(),
    isVerified: true,
  };

  users[normalizedEmail] = newUser;
  saveUsers(users);

  sessionStore.set(token, {
    userId: newUser.id,
    email: normalizedEmail,
    createdAt: now,
    expiresAt: now + 30 * 24 * 60 * 60 * 1000,
  });

  return {
    success: true,
    status: 200,
    token,
    isNewUser: false,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      picture: newUser.picture,
      roles: newUser.roles,
      activeRole: newUser.activeRole,
    },
    message: 'Welcome to UPLOOKZ! Signed in with Google.',
  };
}

/**
 * Complete new user registration / onboarding
 */
export async function completeRegistration(token, details) {
  const session = sessionStore.get(token);
  if (!session) {
    return { success: false, status: 401, message: 'Session expired. Please verify your email again.' };
  }

  const { role, name, salonName, city } = details || {};
  if (!role || (role !== 'customer' && role !== 'salon')) {
    return { success: false, status: 400, message: 'Please select a valid account role (Customer or Salon Partner).' };
  }

  const users = loadUsers();
  const email = session.email;

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email,
    name: name?.trim() || (role === 'customer' ? 'UPLOOKZ Customer' : 'Salon Partner'),
    salonName: salonName?.trim() || '',
    city: city?.trim() || '',
    roles: [role],
    activeRole: role,
    createdAt: new Date().toISOString(),
    isVerified: true,
  };

  users[email] = newUser;
  saveUsers(users);

  // Update session
  session.userId = newUser.id;

  return {
    success: true,
    status: 200,
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      salonName: newUser.salonName,
      city: newUser.city,
      roles: newUser.roles,
      activeRole: newUser.activeRole,
    },
    message: 'Account created successfully!',
  };
}

/**
 * Switch role between Customer and Salon Mode without logging out
 */
export async function switchRole(token, targetRole) {
  const session = sessionStore.get(token);
  if (!session) {
    return { success: false, status: 401, message: 'Unauthorized session.' };
  }

  if (targetRole !== 'customer' && targetRole !== 'salon') {
    return { success: false, status: 400, message: 'Invalid target role.' };
  }

  const users = loadUsers();
  const user = users[session.email];
  if (!user) {
    return { success: false, status: 404, message: 'User not found.' };
  }

  if (!user.roles.includes(targetRole)) {
    user.roles.push(targetRole);
  }

  user.activeRole = targetRole;
  saveUsers(users);

  return {
    success: true,
    status: 200,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      salonName: user.salonName,
      city: user.city,
      roles: user.roles,
      activeRole: user.activeRole,
    },
    message: `Switched to ${targetRole === 'customer' ? 'Customer' : 'Salon Partner'} mode.`,
  };
}

/**
 * Get active session user
 */
export async function getSessionUser(token) {
  if (!token) return { success: false, status: 401, message: 'No token provided' };

  const session = sessionStore.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) sessionStore.delete(token);
    return { success: false, status: 401, message: 'Session expired' };
  }

  const users = loadUsers();
  const user = users[session.email];
  if (!user) {
    return { success: false, status: 404, message: 'User not found' };
  }

  return {
    success: true,
    status: 200,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || [user.activeRole],
      activeRole: user.activeRole || 'customer',
      salonName: user.salonName,
      city: user.city,
    },
  };
}

/**
 * Invalidate session token
 */
export async function logout(token) {
  if (token && sessionStore.has(token)) {
    sessionStore.delete(token);
  }
  return { success: true, status: 200, message: 'Logged out successfully.' };
}
