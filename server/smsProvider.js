/**
 * UPLOOKZ OTP / SMS Provider Integration Interface
 * 
 * Supported Providers:
 * 1. Fast2SMS (Recommended for India DLT & Quick OTP)
 * 2. Twilio (Global SMS Gateway)
 * 3. MSG91 (India Transactional & OTP Gateway)
 * 4. DevLogger (Development & Testing fallback when API credentials are not set)
 */

import https from 'node:https';

export class SMSProviderInterface {
  /**
   * @param {string} toPhoneNumber e.g. "+919876543210"
   * @param {string} otp 6-digit numeric verification code
   * @param {string} message Formatted message body
   * @returns {Promise<{ success: boolean, provider: string, error?: string }>}
   */
  async sendOTP(toPhoneNumber, otp, message) {
    throw new Error('sendOTP must be implemented by provider');
  }
}

/**
 * Fast2SMS Provider (India)
 * Set in environment: FAST2SMS_API_KEY
 */
export class Fast2SMSProvider extends SMSProviderInterface {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }

  async sendOTP(toPhoneNumber, otp) {
    const rawDigits = toPhoneNumber.replace(/\D/g, '');
    const mobile10 = rawDigits.slice(-10);

    return new Promise((resolve) => {
      const postData = JSON.stringify({
        route: 'otp',
        variables_values: otp,
        numbers: mobile10,
      });

      const options = {
        hostname: 'www.fast2sms.com',
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          authorization: this.apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.return === true || res.statusCode === 200) {
              resolve({ success: true, provider: 'fast2sms' });
            } else {
              resolve({ success: false, provider: 'fast2sms', error: parsed.message || 'Fast2SMS error' });
            }
          } catch (e) {
            resolve({ success: false, provider: 'fast2sms', error: 'Invalid response from Fast2SMS' });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, provider: 'fast2sms', error: err.message });
      });

      req.write(postData);
      req.end();
    });
  }
}

/**
 * Twilio Provider
 * Set in environment: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */
export class TwilioProvider extends SMSProviderInterface {
  constructor(accountSid, authToken, fromNumber) {
    super();
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async sendOTP(toPhoneNumber, otp, message) {
    return new Promise((resolve) => {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const params = new URLSearchParams({
        To: toPhoneNumber,
        From: this.fromNumber,
        Body: message || `Your UPLOOKZ verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
      }).toString();

      const options = {
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(params),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, provider: 'twilio' });
            } else {
              resolve({ success: false, provider: 'twilio', error: parsed.message || 'Twilio send failed' });
            }
          } catch (e) {
            resolve({ success: false, provider: 'twilio', error: 'Invalid response from Twilio' });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, provider: 'twilio', error: err.message });
      });

      req.write(params);
      req.end();
    });
  }
}

/**
 * MSG91 Provider
 * Set in environment: MSG91_AUTH_KEY, MSG91_TEMPLATE_ID
 */
export class MSG91Provider extends SMSProviderInterface {
  constructor(authKey, templateId) {
    super();
    this.authKey = authKey;
    this.templateId = templateId;
  }

  async sendOTP(toPhoneNumber, otp) {
    const rawDigits = toPhoneNumber.replace(/\D/g, '');
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        template_id: this.templateId,
        mobile: rawDigits,
        otp: otp,
      });

      const options = {
        hostname: 'control.msg91.com',
        path: '/api/v5/otp',
        method: 'POST',
        headers: {
          authkey: this.authKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'success' || res.statusCode === 200) {
              resolve({ success: true, provider: 'msg91' });
            } else {
              resolve({ success: false, provider: 'msg91', error: parsed.message || 'MSG91 send failed' });
            }
          } catch (e) {
            resolve({ success: false, provider: 'msg91', error: 'Invalid response from MSG91' });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, provider: 'msg91', error: err.message });
      });

      req.write(postData);
      req.end();
    });
  }
}

/**
 * Development & Local Testing Provider
 * Securely logs verification codes strictly on the server console.
 * Never sent in client HTTP responses.
 */
export class DevLoggerProvider extends SMSProviderInterface {
  async sendOTP(toPhoneNumber, otp) {
    const timestamp = new Date().toLocaleTimeString();
    console.log('\n============================================================');
    console.log(`[UPLOOKZ AUTH SERVER] 📱 Verification OTP Generated at ${timestamp}`);
    console.log(`[UPLOOKZ AUTH SERVER] Recipient: ${toPhoneNumber}`);
    console.log(`[UPLOOKZ AUTH SERVER] Verification Code: [ ${otp} ] (Expires in 5 minutes)`);
    console.log(`[UPLOOKZ AUTH SERVER] Notice: Provider is set to DevLogger.`);
    console.log(`[UPLOOKZ AUTH SERVER] To send real SMS, configure TWILIO or FAST2SMS in .env`);
    console.log('============================================================\n');
    return { success: true, provider: 'dev_logger' };
  }
}

/**
 * Get active SMS provider based on environment variables
 */
export function getActiveSMSProvider() {
  const {
    FAST2SMS_API_KEY,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
    MSG91_AUTH_KEY,
    MSG91_TEMPLATE_ID,
  } = process.env;

  if (FAST2SMS_API_KEY) {
    return new Fast2SMSProvider(FAST2SMS_API_KEY);
  }

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    return new TwilioProvider(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER);
  }

  if (MSG91_AUTH_KEY && MSG91_TEMPLATE_ID) {
    return new MSG91Provider(MSG91_AUTH_KEY, MSG91_TEMPLATE_ID);
  }

  // Fallback to Development Secure Logger
  return new DevLoggerProvider();
}
