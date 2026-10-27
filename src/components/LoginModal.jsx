import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User,
  Store,
  Loader2,
  Info,
} from 'lucide-react';
import { authClient } from '../services/authClient';

/**
 * Modern Google 'G' multicolor SVG logo
 */
function GoogleLogo({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default function LoginModal({ isOpen, onClose, onNavigate, initialMode = 'login' }) {
  // Screens: 'initial' | 'otp' | 'choose_role'
  const [screen, setScreen] = useState('initial');
  const [authMode, setAuthMode] = useState(initialMode);

  // Email OTP state
  const [email, setEmail] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);

  // New user onboarding state
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' | 'salon'
  const [fullName, setFullName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [city, setCity] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [devCodeHint, setDevCodeHint] = useState(null);
  const [emailProvider, setEmailProvider] = useState(null);

  // References
  const otpInputRefs = useRef([]);
  const emailInputRef = useRef(null);

  // Load Google Identity Services SDK script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('google-gsi-client')) return;

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Reset modal state on open/close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setAuthMode(initialMode || 'login');
      setScreen('initial');
      setErrorMessage('');
      setSuccessNotice('');
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      setScreen('initial');
      setEmail('');
      setOtpValues(['', '', '', '', '', '']);
      setErrorMessage('');
      setSuccessNotice('');
      setDevCodeHint(null);
      setEmailProvider(null);
      setIsLoading(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialMode]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // Post-Auth Routing Helper
  // ----------------------------------------------------
  const handlePostAuthRouting = (user) => {
    onClose();
    const activeRole = user?.activeRole || 'customer';
    if (activeRole === 'salon' || (user?.roles && user.roles.includes('salon') && !user.roles.includes('customer'))) {
      if (onNavigate) {
        onNavigate('/salon/dashboard');
      } else {
        window.location.href = '/salon/dashboard';
      }
    } else {
      if (onNavigate) {
        onNavigate('/customer/home');
      } else {
        window.location.href = '/customer/home';
      }
    }
  };

  // ----------------------------------------------------
  // Live Google OAuth Trigger
  // ----------------------------------------------------
  const handleGoogleSignInClick = () => {
    setErrorMessage('');
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!googleClientId || googleClientId === 'your_google_client_id_here') {
      setErrorMessage(
        'Google Client ID required: Please add your VITE_GOOGLE_CLIENT_ID in the .env file to enable live Google authentication.'
      );
      return;
    }

    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setErrorMessage(tokenResponse.error_description || 'Google sign-in was canceled.');
              return;
            }
            setIsLoading(true);
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const profile = await res.json();
              const data = await authClient.loginWithGoogle({
                email: profile.email,
                name: profile.name,
                picture: profile.picture,
                sub: profile.sub,
              });
              setIsLoading(false);
              handlePostAuthRouting(data.user);
            } catch (err) {
              setIsLoading(false);
              setErrorMessage(err.message || 'Google authentication failed.');
            }
          },
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.error('[UPLOOKZ AUTH] Token client error:', err);
      }
    }

    // If GIS script hasn't loaded yet
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setErrorMessage('Google Identity Services is loading. Please try again in a few seconds.');
    }
  };

  // ----------------------------------------------------
  // Email OTP Handlers
  // ----------------------------------------------------
  const handleSendEmailOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authClient.sendEmailOtp(cleanEmail);
      setIsLoading(false);
      setScreen('otp');
      setResendCountdown(data.cooldownSeconds || 30);
      setEmailProvider(data.provider);

      if (data.provider === 'smtp' || data.provider === 'resend') {
        setSuccessNotice(`Verification code sent directly to your inbox at ${cleanEmail}!`);
      } else {
        setSuccessNotice(`Verification code generated for ${cleanEmail}.`);
      }

      if (data.devHint) {
        setDevCodeHint(data.devHint);
      }
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Unable to send verification code. Please try again.');
    }
  };

  const handleResendEmailOtp = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setErrorMessage('');
    setSuccessNotice('');
    setIsLoading(true);

    try {
      const data = await authClient.sendEmailOtp(email.trim().toLowerCase());
      setIsLoading(false);
      setResendCountdown(data.cooldownSeconds || 30);
      setEmailProvider(data.provider);
      setSuccessNotice('A fresh verification code has been dispatched to your email!');
      if (data.devHint) {
        setDevCodeHint(data.devHint);
      }
      setOtpValues(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to resend code. Please try again.');
    }
  };

  const handleOtpBoxChange = (index, value) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpValues];
    updated[index] = cleanDigit;
    setOtpValues(updated);
    setErrorMessage('');

    // Advance to next box
    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 filled
    if (cleanDigit && index === 5 && updated.every((d) => d.length === 1)) {
      triggerVerifyOtp(updated.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const digits = pasted.split('');
    const updated = [...otpValues];
    digits.forEach((d, i) => {
      if (i < 6) updated[i] = d;
    });
    setOtpValues(updated);

    if (pasted.length === 6) {
      otpInputRefs.current[5]?.focus();
      triggerVerifyOtp(pasted);
    } else {
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  const triggerVerifyOtp = async (codeToVerify) => {
    const otp = codeToVerify || otpValues.join('');
    if (otp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const data = await authClient.verifyEmailOtp(email.trim().toLowerCase(), otp);
      setIsLoading(false);

      if (data.isNewUser) {
        // Guide new user through role and name completion
        setScreen('choose_role');
      } else {
        handlePostAuthRouting(data.user);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Invalid or expired code. Please try again.');
    }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedRole === 'customer' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (selectedRole === 'salon' && (!salonName.trim() || !fullName.trim())) {
      setErrorMessage('Please enter your salon name and owner name.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authClient.completeRegistration({
        role: selectedRole,
        name: fullName.trim(),
        salonName: salonName.trim(),
        city: city.trim(),
      });
      setIsLoading(false);
      handlePostAuthRouting(data.user);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to complete registration.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      {/* SUBTLE DARK OVERLAY */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* WHITE CENTERED MODAL */}
      <div
        className="relative bg-white text-[#111827] w-full max-w-[430px] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 transition-all transform scale-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR / CLOSE BUTTON */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#111827] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
            aria-label="Close popup"
          >
            <X size={18} />
          </button>
        </div>

        {/* BACK BUTTON (When in OTP or Role screen) */}
        {screen !== 'initial' && (
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={() => {
                setScreen('initial');
                setErrorMessage('');
                setSuccessNotice('');
              }}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#111827] flex items-center justify-center transition-colors focus:outline-none"
              aria-label="Back to login methods"
            >
              <ArrowLeft size={16} />
            </button>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-6 sm:p-8 pt-8 sm:pt-9 space-y-6">

          {/* ---------------------------------------------------- */}
          {/* SCREEN 1: ONLY GOOGLE & EMAIL OTP LOGIN              */}
          {/* ---------------------------------------------------- */}
          {screen === 'initial' && (
            <div className="space-y-6">

              {/* UPLOOKZ Logo & Header */}
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0EA5E9] flex items-center justify-center text-white shadow-md shadow-[#0EA5E9]/25 font-bold text-lg">
                    U
                  </div>
                  <span className="text-xl font-bold tracking-tight text-[#111827]">
                    UPLOOKZ<span className="text-[#0EA5E9]">.</span>
                  </span>
                </div>

                <div className="pt-2">
                  <h2
                    id="modal-headline"
                    className="text-2xl sm:text-[1.65rem] font-bold tracking-tight text-[#111827] leading-tight"
                  >
                    {authMode === 'signup' ? 'Create Your Account' : 'Welcome to UPLOOKZ'}
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1">
                    Sign in with your Google account or email verification code
                  </p>
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
                >
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ACTION 1: GOOGLE SIGN-IN BUTTON */}
              <div>
                <button
                  type="button"
                  id="btn-google-login"
                  onClick={handleGoogleSignInClick}
                  disabled={isLoading}
                  className="w-full h-12 inline-flex items-center justify-center gap-3 px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#1E293B] font-semibold text-sm shadow-sm hover:shadow transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  <GoogleLogo className="w-5 h-5 transition-transform group-hover:scale-105" />
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* DIVIDER: OR CONTINUE WITH EMAIL */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[#E2E8F0]" />
                <span className="absolute bg-white px-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                  or
                </span>
              </div>

              {/* ACTION 2: EMAIL OTP INPUT FORM */}
              <form onSubmit={handleSendEmailOtp} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="email-input" className="block text-xs font-semibold text-[#475569]">
                    Email Address
                  </label>

                  <div className="relative flex items-center border border-[#CBD5E1] rounded-xl focus-within:border-[#0EA5E9] focus-within:ring-2 focus-within:ring-[#0EA5E9]/20 transition-all bg-white">
                    <div className="pl-3.5 pr-1 text-[#94A3B8]">
                      <Mail size={18} />
                    </div>
                    <input
                      ref={emailInputRef}
                      id="email-input"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="name@example.com"
                      className="w-full h-12 pl-2.5 pr-4 text-sm font-medium text-[#111827] placeholder-[#94A3B8] bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                {/* Primary Button */}
                <button
                  type="submit"
                  id="btn-send-email-code"
                  disabled={isLoading}
                  className="btn-lift w-full h-12 inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-sm shadow-md shadow-[#0EA5E9]/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      <span>Sending Code...</span>
                    </span>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Privacy Notice */}
              <p className="text-[12px] text-[#64748B] text-center leading-relaxed">
                By continuing, you agree to UPLOOKZ{' '}
                <a href="#terms" onClick={(e) => e.preventDefault()} className="text-[#0EA5E9] hover:underline">
                  Terms
                </a>{' '}
                and{' '}
                <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-[#0EA5E9] hover:underline">
                  Privacy Policy
                </a>.
              </p>

              {/* Mode Switcher: Login <-> Create Account */}
              <div className="pt-2 border-t border-[#E2E8F0] flex flex-col items-center gap-2 text-center text-xs text-[#64748B]">
                {authMode === 'signup' ? (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMessage('');
                      }}
                      className="font-semibold text-[#0EA5E9] hover:underline"
                    >
                      Log in
                    </button>
                  </p>
                ) : (
                  <p>
                    New to UPLOOKZ?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setErrorMessage('');
                      }}
                      className="font-semibold text-[#0EA5E9] hover:underline"
                    >
                      Create an account
                    </button>
                  </p>
                )}
              </div>

            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* SCREEN 2: 6-DIGIT EMAIL VERIFICATION CODE SCREEN     */}
          {/* ---------------------------------------------------- */}
          {screen === 'otp' && (
            <div className="space-y-6">

              {/* Heading & Subtitle */}
              <div className="space-y-1.5 text-left pt-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
                  Verify your email
                </h2>
                <div className="text-sm text-[#64748B] flex flex-wrap items-center gap-1.5">
                  <span>Enter the code sent to</span>
                  <span className="font-semibold text-[#111827]">{email}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setScreen('initial');
                      setErrorMessage('');
                    }}
                    className="text-xs font-semibold text-[#0EA5E9] hover:underline ml-1"
                  >
                    (Edit)
                  </button>
                </div>
              </div>

              {/* Success / Status Alert */}
              {successNotice && (
                <div className="p-3 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                  <span>{successNotice}</span>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
                >
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Dev mode helper badge (only shown if SMTP credentials not yet provided in .env) */}
              {devCodeHint && emailProvider === 'dev_logger' && (
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#16A34A] space-y-1.5">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Info size={14} /> Local Testing Mode:
                  </p>
                  <p className="text-[#15803D]">
                    Verification code: <strong className="font-mono text-sm tracking-widest">{devCodeHint}</strong>
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpValues(devCodeHint.split(''));
                        triggerVerifyOtp(devCodeHint);
                      }}
                      className="text-[11px] underline font-semibold hover:text-[#166534]"
                    >
                      Auto-fill & Verify
                    </button>
                    <span className="text-[10px] text-slate-500">
                      Add SMTP in .env for inbox delivery
                    </span>
                  </div>
                </div>
              )}

              {/* 6 OTP Boxes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 sm:gap-2.5">
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-13 sm:w-13 sm:h-14 text-center text-xl font-bold text-[#111827] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all shadow-sm"
                      aria-label={`Digit ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Resend Code Section with Countdown */}
                <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
                  {resendCountdown > 0 ? (
                    <span className="text-[#94A3B8]">
                      Resend code in <strong className="text-[#64748B]">{resendCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendEmailOtp}
                      disabled={isLoading}
                      className="font-semibold text-[#0EA5E9] hover:text-[#0284C7] hover:underline transition-colors"
                    >
                      Resend Verification Code
                    </button>
                  )}
                  <span className="text-[11px] text-[#94A3B8]">Valid for 5 mins</span>
                </div>
              </div>

              {/* Verify & Continue Button */}
              <button
                type="button"
                id="btn-verify-continue"
                onClick={() => triggerVerifyOtp()}
                disabled={isLoading || otpValues.some((d) => !d)}
                className="btn-lift w-full h-12 inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-sm shadow-md shadow-[#0EA5E9]/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </span>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* SCREEN 3: NEW USER PROFILE ONBOARDING                */}
          {/* ---------------------------------------------------- */}
          {screen === 'choose_role' && (
            <div className="space-y-6">

              <div className="space-y-1 text-left pt-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                  <CheckCircle2 size={13} />
                  Email Verified
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
                  Complete Your Profile
                </h2>
                <p className="text-sm text-[#64748B]">
                  Choose how you plan to use UPLOOKZ
                </p>
              </div>

              {errorMessage && (
                <div role="alert" className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {errorMessage}
                </div>
              )}

              {/* Role Cards */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    selectedRole === 'customer'
                      ? 'border-[#0EA5E9] bg-[#F0F9FF] ring-2 ring-[#0EA5E9]/20 shadow-sm'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                      selectedRole === 'customer' ? 'bg-[#0EA5E9] text-white' : 'bg-slate-100 text-[#64748B]'
                    }`}
                  >
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Customer</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5 leading-tight">
                      Book appointments without waiting
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('salon')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    selectedRole === 'salon'
                      ? 'border-[#0EA5E9] bg-[#F0F9FF] ring-2 ring-[#0EA5E9]/20 shadow-sm'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                      selectedRole === 'salon' ? 'bg-[#0EA5E9] text-white' : 'bg-slate-100 text-[#64748B]'
                    }`}
                  >
                    <Store size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Salon Partner</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5 leading-tight">
                      List salon & manage bookings
                    </p>
                  </div>
                </button>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleCompleteRegistration} className="space-y-3.5">
                {selectedRole === 'salon' ? (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#475569]">Salon / Studio Name</label>
                      <input
                        type="text"
                        required
                        value={salonName}
                        onChange={(e) => setSalonName(e.target.value)}
                        placeholder="e.g. Apex Studio & Grooming"
                        className="w-full h-11 px-3.5 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#475569]">Owner Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full h-11 px-3.5 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#475569]">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full h-11 px-3.5 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-lift w-full h-12 inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-sm shadow-md shadow-[#0EA5E9]/25 transition-all"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      <span>Creating Account...</span>
                    </span>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

            </div>
          )}

        </div>

        {/* FOOTER BADGE */}
        <div className="py-3 px-6 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-center gap-2 text-[11px] text-[#64748B]">
          <ShieldCheck size={14} className="text-[#0EA5E9]" />
          <span>Bank-grade 256-bit encrypted authentication</span>
        </div>

      </div>
    </div>
  );
}
