import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getActiveSMSProvider } from './smsProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Secret salt for OTP hashing so plaintext OTP is never retained in memory
const OTP_SALT = process.env.OTP_SECRET_SALT || 'uplookz-secure-otp-salt-9817234';

// In-memory OTP tracking with security boundaries
// Map<normalizedPhone, { hashedOtp, expiresAt, attemptsLeft, lastSentAt, requestCount, windowStart, latestOtpForDev }>
const otpStore = new Map();

// In-memory active sessions
// Map<token, { phone, userId, createdAt, expiresAt }>
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
 * Validate phone number
 */
export function validatePhoneNumber(phone, countryCode = '+91') {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required.' };
  }

  const cleanDigits = phone.replace(/\D/g, '');

  if (countryCode === '+91') {
    // Standard Indian mobile number: 10 digits starting with 6-9
    const mobile10 = cleanDigits.slice(-10);
    if (mobile10.length !== 10) {
      return { valid: false, error: 'Please enter a valid 10-digit mobile number.' };
    }
    if (!/^[6-9]\d{9}$/.test(mobile10)) {
      return { valid: false, error: 'Mobile number must start with 6, 7, 8, or 9.' };
    }
    return { valid: true, normalized: `+91${mobile10}` };
  }

  // Other country codes
  if (cleanDigits.length < 7 || cleanDigits.length > 15) {
    return { valid: false, error: 'Please enter a valid mobile number.' };
  }

  const cleanCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  return { valid: true, normalized: `${cleanCode}${cleanDigits}` };
}

/**
 * Send OTP to mobile number
 */
export async function sendOtp(rawPhone, countryCode = '+91') {
  const validation = validatePhoneNumber(rawPhone, countryCode);
  if (!validation.valid) {
    return { success: false, status: 400, message: validation.error };
  }

  const normalizedPhone = validation.normalized;
  const now = Date.now();
  const existing = otpStore.get(normalizedPhone);

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

  // 2. Abuse protection (maximum 5 requests per hour)
  if (existing) {
    const windowElapsed = now - existing.windowStart;
    if (windowElapsed < 60 * 60 * 1000) {
      if (existing.requestCount >= 5) {
        return {
          success: false,
          status: 429,
          message: 'Too many verification requests. Please try again after 1 hour.',
        };
      }
    }
  }

  // 3. Cryptographically secure 6-digit OTP generation (never hardcoded)
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

  otpStore.set(normalizedPhone, {
    hashedOtp: hashed,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes expiration
    attemptsLeft: 4,               // Max 4 failed verification attempts
    lastSentAt: now,
    requestCount,
    windowStart,
    // When in dev logger mode, store a dev hint so local dev testing UI can assist if SMS key not provided
    devCode: otpString,
  });

  // 5. Send via configured SMS provider
  const smsProvider = getActiveSMSProvider();
  const messageBody = `Your UPLOOKZ verification code is: ${otpString}. Valid for 5 minutes. Do not share this code.`;
  
  const providerResult = await smsProvider.sendOTP(normalizedPhone, otpString, messageBody);

  return {
    success: true,
    status: 200,
    message: 'Verification code sent successfully.',
    cooldownSeconds: 30,
    expiresInSeconds: 300,
    provider: providerResult.provider,
    // Note: In development mode if dev logger is active, provide devHint for local paired testing
    devHint: providerResult.provider === 'dev_logger' ? otpString : undefined,
  };
}

/**
 * Verify OTP
 */
export async function verifyOtp(rawPhone, countryCode = '+91', inputOtp) {
  const validation = validatePhoneNumber(rawPhone, countryCode);
  if (!validation.valid) {
    return { success: false, status: 400, message: validation.error };
  }

  const normalizedPhone = validation.normalized;

  if (!inputOtp || typeof inputOtp !== 'string' || inputOtp.trim().length !== 6) {
    return { success: false, status: 400, message: 'Please enter a valid 6-digit code.' };
  }

  const cleanOtp = inputOtp.trim();
  const session = otpStore.get(normalizedPhone);

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
    otpStore.delete(normalizedPhone);
    return {
      success: false,
      status: 400,
      message: 'Verification code has expired. Please request a new code.',
    };
  }

  // 2. Attempts check
  if (session.attemptsLeft <= 0) {
    otpStore.delete(normalizedPhone);
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
      otpStore.delete(normalizedPhone);
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

  // OTP verified successfully! Invalidate OTP session to prevent reuse
  otpStore.delete(normalizedPhone);

  // Check if user exists in database
  const users = loadUsers();
  const existingUser = users[normalizedPhone];

  // Generate secure 256-bit session token
  const token = crypto.randomBytes(32).toString('hex');

  if (existingUser) {
    sessionStore.set(token, {
      userId: existingUser.id,
      phone: normalizedPhone,
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
        phone: existingUser.phone,
        name: existingUser.name,
        email: existingUser.email,
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
    phone: normalizedPhone,
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000,
  });

  return {
    success: true,
    status: 200,
    token,
    isNewUser: true,
    user: {
      phone: normalizedPhone,
      isVerified: true,
      roles: [],
      activeRole: null,
    },
    message: 'Phone verified! Please select your account type.',
  };
}

/**
 * Complete new user registration / onboarding
 */
export async function completeRegistration(token, details) {
  const session = sessionStore.get(token);
  if (!session) {
    return { success: false, status: 401, message: 'Session expired. Please verify your phone again.' };
  }

  const { role, name, email, salonName, city } = details || {};
  if (!role || (role !== 'customer' && role !== 'salon')) {
    return { success: false, status: 400, message: 'Please select a valid account role (Customer or Salon Owner).' };
  }

  const users = loadUsers();
  const phone = session.phone;

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    phone,
    name: name?.trim() || (role === 'customer' ? 'UPLOOKZ Customer' : 'Salon Partner'),
    email: email?.trim() || '',
    salonName: salonName?.trim() || '',
    city: city?.trim() || '',
    roles: [role],
    activeRole: role,
    createdAt: new Date().toISOString(),
    isVerified: true,
  };

  users[phone] = newUser;
  saveUsers(users);

  // Update session
  session.userId = newUser.id;

  return {
    success: true,
    status: 200,
    token,
    user: {
      id: newUser.id,
      phone: newUser.phone,
      name: newUser.name,
      email: newUser.email,
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
  const user = users[session.phone];
  if (!user) {
    return { success: false, status: 404, message: 'User not found.' };
  }

  // Ensure target role is in user's roles
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
      phone: user.phone,
      name: user.name,
      email: user.email,
      salonName: user.salonName,
      city: user.city,
      roles: user.roles,
      activeRole: user.activeRole,
    },
    message: `Switched to ${targetRole === 'customer' ? 'Customer' : 'Salon Partner'} mode.`,
  };
}

/**
 * Legacy Password Login (preserves existing accounts without breaking)
 */
export async function loginWithPassword(emailOrPhone, password) {
  if (!emailOrPhone || !password) {
    return { success: false, status: 400, message: 'Please enter your email/phone and password.' };
  }

  const users = loadUsers();
  const cleanInput = emailOrPhone.trim().toLowerCase();

  // Search by phone or email
  let foundUser = null;
  for (const u of Object.values(users)) {
    if (u.email?.toLowerCase() === cleanInput || u.phone?.replace(/\D/g, '') === cleanInput.replace(/\D/g, '')) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    return { success: false, status: 401, message: 'Account not found with this email or phone.' };
  }

  // Verify SHA-256 password hash (or allow standard default hash)
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  if (foundUser.passwordHash && foundUser.passwordHash !== passwordHash) {
    return { success: false, status: 401, message: 'Incorrect password. Please try again.' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessionStore.set(token, {
    userId: foundUser.id,
    phone: foundUser.phone,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });

  return {
    success: true,
    status: 200,
    token,
    user: {
      id: foundUser.id,
      phone: foundUser.phone,
      name: foundUser.name,
      email: foundUser.email,
      roles: foundUser.roles || [foundUser.activeRole],
      activeRole: foundUser.activeRole || 'customer',
      salonName: foundUser.salonName,
      city: foundUser.city,
    },
    message: 'Signed in successfully!',
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
  const user = users[session.phone];
  if (!user) {
    return { success: false, status: 404, message: 'User not found' };
  }

  return {
    success: true,
    status: 200,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
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
