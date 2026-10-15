import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Store,
  User,
  Lock,
  Mail,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { authClient } from '../services/authClient';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', placeholder: '98765 43210' },
  { code: '+1', country: 'United States', flag: '🇺🇸', placeholder: '202 555 0123' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', placeholder: '7911 123456' },
  { code: '+971', country: 'UAE', flag: '🇦🇪', placeholder: '50 123 4567' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', placeholder: '8123 4567' },
];

export default function LoginModal({ isOpen, onClose, onNavigate, initialMode = 'login' }) {
  // Screens: 'phone' | 'otp' | 'choose_role' | 'password'
  const [screen, setScreen] = useState('phone');

  // Form states
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Registration states (for new users)
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' | 'salon'
  const [fullName, setFullName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');

  // Password login states (preserving legacy email/password)
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [devCodeHint, setDevCodeHint] = useState(null);

  // References
  const otpInputRefs = useRef([]);
  const phoneInputRef = useRef(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus phone input
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      // Reset state when closed
      setScreen('phone');
      setPhone('');
      setOtpValues(['', '', '', '', '', '']);
      setErrorMessage('');
      setSuccessNotice('');
      setDevCodeHint(null);
      setIsLoading(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
  // Handlers
  // ----------------------------------------------------

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (selectedCountry.code === '+91') {
      if (val.length <= 10) setPhone(val);
    } else {
      if (val.length <= 15) setPhone(val);
    }
    setErrorMessage('');
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    // Validation
    if (!phone.trim()) {
      setErrorMessage('Please enter your mobile number.');
      return;
    }

    if (selectedCountry.code === '+91') {
      if (phone.length !== 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!/^[6-9]/.test(phone)) {
        setErrorMessage('Mobile number must begin with 6, 7, 8, or 9.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const data = await authClient.sendOtp(phone, selectedCountry.code);
      setIsLoading(false);
      setScreen('otp');
      setResendCountdown(data.cooldownSeconds || 30);
      setSuccessNotice(`Verification code sent to ${selectedCountry.code} ${phone}`);
      if (data.devHint) {
        setDevCodeHint(data.devHint);
      }
      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Unable to send verification code. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setErrorMessage('');
    setSuccessNotice('');
    setIsLoading(true);

    try {
      const data = await authClient.sendOtp(phone, selectedCountry.code);
      setIsLoading(false);
      setResendCountdown(data.cooldownSeconds || 30);
      setSuccessNotice('A fresh verification code has been sent!');
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

    // Advance to next input
    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 filled
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
      const data = await authClient.verifyOtp(phone, selectedCountry.code, otp);
      setIsLoading(false);

      if (data.isNewUser) {
        // New user: guide them through account type selection
        setScreen('choose_role');
      } else {
        // Existing user: direct route based on saved role
        handlePostAuthRouting(data.user);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Verification failed. Please try again.');
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
      setErrorMessage('Please enter your salon name and your name.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authClient.completeRegistration({
        role: selectedRole,
        name: fullName.trim(),
        salonName: salonName.trim(),
        city: city.trim(),
        email: email.trim(),
      });
      setIsLoading(false);
      handlePostAuthRouting(data.user);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to complete registration.');
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailOrPhone.trim()) {
      setErrorMessage('Please enter your email or phone.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authClient.loginWithPassword(emailOrPhone, password);
      setIsLoading(false);
      handlePostAuthRouting(data.user);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    }
  };

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      {/* SUBTLE DARK OVERLAY KEEPING LANDING PAGE VISIBLE BEHIND */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* WHITE CENTERED MODAL */}
      <div
        className="relative bg-white text-[#111827] w-full max-w-[440px] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 transition-all transform scale-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR / CLOSE BUTTON */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#111827] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
            aria-label="Close login popup"
          >
            <X size={18} />
          </button>
        </div>

        {/* BACK BUTTON (When in OTP, Role, or Password screen) */}
        {screen !== 'phone' && (
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={() => {
                setScreen('phone');
                setErrorMessage('');
                setSuccessNotice('');
              }}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#111827] flex items-center justify-center transition-colors focus:outline-none"
              aria-label="Back to phone number"
            >
              <ArrowLeft size={16} />
            </button>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-6 sm:p-8 pt-8 sm:pt-9 space-y-6">

          {/* ---------------------------------------------------- */}
          {/* SCREEN 1: PHONE NUMBER INPUT (PRIMARY FLOW)           */}
          {/* ---------------------------------------------------- */}
          {screen === 'phone' && (
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
                    Welcome to UPLOOKZ
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1">
                    Enter your mobile number to continue
                  </p>
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 animate-shake"
                >
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Phone Input Form */}
              <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="mobile-input" className="block text-xs font-semibold text-[#475569]">
                    Mobile Number
                  </label>

                  <div className="relative flex items-center border border-[#CBD5E1] rounded-xl focus-within:border-[#0EA5E9] focus-within:ring-2 focus-within:ring-[#0EA5E9]/20 transition-all bg-white overflow-visible">
                    
                    {/* Country Code Dropdown Trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="h-12 pl-3.5 pr-2.5 flex items-center gap-1.5 text-sm font-semibold text-[#111827] hover:bg-slate-50 transition-colors rounded-l-xl focus:outline-none"
                        aria-expanded={showCountryDropdown}
                        aria-label="Select country code"
                      >
                        <span className="text-base">{selectedCountry.flag}</span>
                        <span>{selectedCountry.code}</span>
                        <ChevronDown size={14} className="text-[#94A3B8]" />
                      </button>

                      {/* Dropdown Menu */}
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-clean-lg z-30 py-1 max-h-56 overflow-y-auto">
                          {COUNTRY_CODES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c);
                                setShowCountryDropdown(false);
                                phoneInputRef.current?.focus();
                              }}
                              className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#F0F9FF] transition-colors ${
                                selectedCountry.code === c.code ? 'font-semibold text-[#0EA5E9] bg-[#F0F9FF]' : 'text-[#334155]'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span>{c.flag}</span>
                                <span>{c.country}</span>
                              </span>
                              <span className="text-[#64748B]">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-[1px] bg-[#E2E8F0]" />

                    {/* Number Input Field */}
                    <input
                      ref={phoneInputRef}
                      id="mobile-input"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder={selectedCountry.placeholder}
                      className="w-full h-12 pl-3 pr-4 text-base font-medium text-[#111827] placeholder-[#94A3B8] bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                {/* Primary Button: Send Verification Code */}
                <button
                  type="submit"
                  id="btn-send-verification-code"
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

              {/* Privacy Message */}
              <p className="text-[12px] text-[#64748B] text-center leading-relaxed">
                We'll send a 6-digit verification code to your number. By continuing, you agree to our{' '}
                <a href="#terms" onClick={(e) => e.preventDefault()} className="text-[#0EA5E9] hover:underline">
                  Terms
                </a>{' '}
                and{' '}
                <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-[#0EA5E9] hover:underline">
                  Privacy Policy
                </a>.
              </p>

              {/* Alternative Login: Email / Password */}
              <div className="pt-2 border-t border-[#E2E8F0] text-center">
                <button
                  type="button"
                  onClick={() => {
                    setScreen('password');
                    setErrorMessage('');
                  }}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#0EA5E9] transition-colors"
                >
                  Or sign in with Password / Email
                </button>
              </div>

            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* SCREEN 2: 6-DIGIT OTP VERIFICATION SCREEN            */}
          {/* ---------------------------------------------------- */}
          {screen === 'otp' && (
            <div className="space-y-6">

              {/* Heading & Subtitle */}
              <div className="space-y-1.5 text-left pt-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
                  Verify your number
                </h2>
                <div className="text-sm text-[#64748B] flex flex-wrap items-center gap-1.5">
                  <span>Enter the code sent to</span>
                  <span className="font-semibold text-[#111827]">
                    {selectedCountry.code} {phone}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setScreen('phone');
                      setErrorMessage('');
                    }}
                    className="text-xs font-semibold text-[#0EA5E9] hover:underline ml-1"
                  >
                    (Edit)
                  </button>
                </div>
              </div>

              {/* Success / Error Alerts */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
                >
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Dev mode helper badge (active in local dev environment when SMS API keys are not set) */}
              {devCodeHint && (
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#16A34A] space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Dev OTP Delivery:
                  </p>
                  <p className="text-[#15803D]">
                    Server generated code: <strong className="font-mono text-sm tracking-widest">{devCodeHint}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpValues(devCodeHint.split(''));
                      triggerVerifyOtp(devCodeHint);
                    }}
                    className="text-[11px] underline font-medium hover:text-[#166534]"
                  >
                    Auto-fill & Continue
                  </button>
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
                      onClick={handleResendOtp}
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
          {/* SCREEN 3: ACCOUNT TYPE SELECTION & ONBOARDING        */}
          {/* ---------------------------------------------------- */}
          {screen === 'choose_role' && (
            <div className="space-y-6">
              
              <div className="space-y-1 text-left pt-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                  <CheckCircle2 size={13} />
                  Phone Verified
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
                  Welcome to UPLOOKZ
                </h2>
                <p className="text-sm text-[#64748B]">
                  Choose how you'd like to use UPLOOKZ
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
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                    selectedRole === 'customer' ? 'bg-[#0EA5E9] text-white' : 'bg-slate-100 text-[#64748B]'
                  }`}>
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Customer</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5 leading-tight">
                      Book salon visits without waiting
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
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                    selectedRole === 'salon' ? 'bg-[#0EA5E9] text-white' : 'bg-slate-100 text-[#64748B]'
                  }`}>
                    <Store size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Salon Partner</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5 leading-tight">
                      Manage salon & bookings
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
                      placeholder="e.g. John Doe"
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
                      <span>Get Started</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* SCREEN 4: LEGACY PASSWORD LOGIN SCREEN               */}
          {/* ---------------------------------------------------- */}
          {screen === 'password' && (
            <div className="space-y-6">
              <div className="space-y-1 text-left pt-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
                  Password Login
                </h2>
                <p className="text-sm text-[#64748B]">
                  Sign in with your registered email or phone and password
                </p>
              </div>

              {errorMessage && (
                <div role="alert" className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#475569]">Email or Phone</label>
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="john@example.com or 9876543210"
                    className="w-full h-11 px-3.5 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#475569]">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-lift w-full h-12 inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-sm shadow-md transition-all"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      <span>Signing In...</span>
                    </span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    setScreen('phone');
                    setErrorMessage('');
                  }}
                  className="text-xs font-semibold text-[#0EA5E9] hover:underline"
                >
                  Back to Mobile OTP Login
                </button>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER BADGE */}
        <div className="py-3 px-6 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-center gap-2 text-[11px] text-[#64748B]">
          <ShieldCheck size={14} className="text-[#0EA5E9]" />
          <span>Bank-grade 256-bit encrypted verification</span>
        </div>

      </div>
    </div>
  );
}
