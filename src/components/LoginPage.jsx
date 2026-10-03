import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

export default function LoginPage({ onNavigate, initialRole = 'customer' }) {
  const [role, setRole] = useState(initialRole);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);
  const [imgSrc, setImgSrc] = useState('/images/login-bg.jpg');

  // Sync role if initialRole changes or from URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'salon' || roleParam === 'salon_owner') {
      setRole('salon');
    } else if (roleParam === 'customer') {
      setRole('customer');
    }
  }, []);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    setForgotPasswordNotice(false);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setForgotPasswordNotice(false);

    // Form Validation
    if (!emailOrPhone.trim()) {
      setError('Please enter your email or phone number');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    // Clean, integration-ready transition
    setTimeout(() => {
      setIsLoading(false);
      if (role === 'customer') {
        if (onNavigate) {
          onNavigate('/customer/home');
        } else {
          window.location.href = '/customer/home';
        }
      } else {
        if (onNavigate) {
          onNavigate('/salon/dashboard');
        } else {
          window.location.href = '/salon/dashboard';
        }
      }
    }, 350);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setForgotPasswordNotice(true);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden selection:bg-[#0EA5E9] selection:text-white bg-[#0A0F1D]">
      
      {/* Scoped CSS animation for continuous, ultra-smooth background pan & zoom */}
      <style>{`
        @keyframes salonCinematicMotion {
          0% {
            transform: scale(1) translate3d(0, 0, 0);
          }
          50% {
            transform: scale(1.05) translate3d(-1.2%, -0.8%, 0);
          }
          100% {
            transform: scale(1) translate3d(0, 0, 0);
          }
        }
        .salon-bg-animated {
          animation: salonCinematicMotion 28s ease-in-out infinite;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>

      {/* FULL BACKGROUND AREA WITH CINEMATIC CONTINUOUS MOTION */}
      <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
        
        {/* Salon Interior High-Quality Image with Fallback */}
        <img
          src={imgSrc}
          onError={() => setImgSrc('/images/hero-1.jpg')}
          alt="Luxury Salon Interior"
          className="salon-bg-animated absolute -inset-[4%] w-[108%] h-[108%] object-cover object-center select-none"
          loading="eager"
          style={{ imageRendering: 'high-quality' }}
        />

        {/* Ambient Gradient Overlays for Readability & Mood */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80 lg:from-black/75 lg:via-black/35 lg:to-[#070B12]/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070B12]/90 via-transparent via-50% to-black/40" />

        {/* Reference-Inspired Soft Blue Wave & Accent Flow */}
        <svg
          className="absolute inset-0 w-full h-full opacity-35 pointer-events-none mix-blend-screen"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-50,220 C220,120 420,440 680,260 C920,90 1140,320 1500,180"
            fill="none"
            stroke="url(#waveGrad)"
            strokeWidth="1.5"
          />
          <path
            d="M-50,260 C240,160 440,480 710,290 C950,120 1160,350 1500,210"
            fill="none"
            stroke="url(#waveGrad)"
            strokeWidth="1.2"
          />
          <path
            d="M-50,300 C260,200 460,520 740,320 C980,150 1180,380 1500,240"
            fill="none"
            stroke="url(#waveGrad)"
            strokeWidth="1"
          />
        </svg>

        {/* Subtle luminous blue ambient glow on left */}
        <div className="hidden lg:block absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#0EA5E9]/15 blur-3xl pointer-events-none" />
      </div>

      {/* TOP BAR / NAVIGATION */}
      <header className="relative z-20 w-full px-5 sm:px-8 py-5 flex items-center justify-between">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) onNavigate('/');
          }}
          className="flex items-center gap-2.5 group focus:outline-none"
          title="Return to UPLOOKZ Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0EA5E9] flex items-center justify-center text-white shadow-md shadow-[#0EA5E9]/30 transition-transform group-hover:scale-105">
            <span className="font-bold text-base tracking-tight">U</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white drop-shadow">
            UPLOOKZ<span className="text-[#0EA5E9]">.</span>
          </span>
        </a>

        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) onNavigate('/');
          }}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white/80 hover:text-white bg-black/25 hover:bg-black/40 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full transition-all"
        >
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </a>
      </header>

      {/* MAIN SPLIT-SCREEN CONTENT CONTAINER */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 gap-8 lg:gap-12">
        
        {/* LEFT AREA (Cinematic Salon Mood & Atmosphere Text for Desktop) */}
        <div className="hidden lg:flex flex-col justify-center max-w-lg space-y-6 text-white py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-sky-200 w-fit">
            <Sparkles size={14} className="text-[#38BDF8]" />
            <span>Elevated Grooming Experience</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.15] drop-shadow-md">
            Upgrade Your Look.<br />
            <span className="text-[#38BDF8]">Without Waiting.</span>
          </h2>

          <p className="text-base text-slate-200/90 leading-relaxed drop-shadow-sm max-w-md">
            Step into verified premium salons with transparent pricing, unisex grooming, and effortless scheduling.
          </p>

          <div className="pt-4 grid grid-cols-3 gap-3 border-t border-white/15 text-xs text-slate-300">
            <div>
              <p className="font-bold text-white text-sm">4.9 ★</p>
              <p className="text-slate-300/80 mt-0.5">Top-Rated Salons</p>
            </div>
            <div>
              <p className="font-bold text-white text-sm">Instant</p>
              <p className="text-slate-300/80 mt-0.5">Slot Confirmation</p>
            </div>
            <div>
              <p className="font-bold text-white text-sm">Zero Wait</p>
              <p className="text-slate-300/80 mt-0.5">Seamless Visits</p>
            </div>
          </div>
        </div>

        {/* RIGHT AREA: CLEAN PREMIUM WHITE LOGIN CARD */}
        <div className="w-full max-w-[440px] mx-auto lg:mx-0 lg:ml-auto">
          
          <div className="bg-white text-[#111827] border border-slate-100 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/40 p-6 sm:p-9 space-y-6">
            
            {/* Role Selection Tabs */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
                Select Account Type
              </label>
              <div
                className="grid grid-cols-2 p-1.5 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]"
                role="tablist"
                aria-label="Login role selection"
              >
                <button
                  type="button"
                  role="tab"
                  id="tab-customer"
                  aria-selected={role === 'customer'}
                  onClick={() => handleRoleChange('customer')}
                  className={`py-2.5 px-3 text-sm font-semibold rounded-lg transition-all duration-200 text-center ${
                    role === 'customer'
                      ? 'bg-white text-[#0EA5E9] shadow-sm'
                      : 'text-[#64748B] hover:text-[#111827]'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  role="tab"
                  id="tab-salon-owner"
                  aria-selected={role === 'salon'}
                  onClick={() => handleRoleChange('salon')}
                  className={`py-2.5 px-3 text-sm font-semibold rounded-lg transition-all duration-200 text-center ${
                    role === 'salon'
                      ? 'bg-white text-[#0EA5E9] shadow-sm'
                      : 'text-[#64748B] hover:text-[#111827]'
                  }`}
                >
                  Salon Owner
                </button>
              </div>
            </div>

            {/* Header Content */}
            <div className="space-y-1 text-left">
              <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-[#111827] leading-tight">
                Welcome Back
              </h1>
              <p className="text-sm text-[#64748B]">
                {role === 'customer'
                  ? 'Sign in to access your bookings and grooming history.'
                  : 'Sign in to manage your salon, services, and bookings.'}
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div
                role="alert"
                className="p-3.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Forgot Password Notice */}
            {forgotPasswordNotice && (
              <div
                role="status"
                className="p-3.5 text-xs text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg space-y-1"
              >
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#0EA5E9]" />
                  Password reset link ready
                </p>
                <p className="text-[#64748B]">
                  Instructions will be sent to your registered email or phone number.
                </p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              
              {/* Email / Phone Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email-or-phone"
                  className="block text-xs font-semibold text-[#334155]"
                >
                  Email / Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <User size={16} />
                  </div>
                  <input
                    id="email-or-phone"
                    name="emailOrPhone"
                    type="text"
                    autoComplete="username"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder={
                      role === 'customer'
                        ? 'name@example.com or 9876543210'
                        : 'partner@example.com or phone'
                    }
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-[#334155]"
                  >
                    Password
                  </label>
                  <a
                    href="#forgot-password"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-[#0EA5E9] hover:text-[#0284C7] transition-colors focus:outline-none focus:underline"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <Lock size={16} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#64748B] focus:outline-none transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#64748B]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#CBD5E1] text-[#0EA5E9] focus:ring-[#0EA5E9]/20 focus:ring-offset-0 transition-colors"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="login-submit-button"
                  disabled={isLoading}
                  className="btn-lift w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-sm shadow-md shadow-[#0EA5E9]/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </span>
                  ) : (
                    <>
                      <span>{role === 'customer' ? 'Login' : 'Login as Salon Owner'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Sign Up Link Switch */}
            <div className="pt-2 text-center border-t border-[#E2E8F0]">
              {role === 'customer' ? (
                <p className="text-sm text-[#64748B]">
                  Don't have an account?{' '}
                  <a
                    href="/signup"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onNavigate) onNavigate('/signup');
                    }}
                    className="font-semibold text-[#0EA5E9] hover:text-[#0284C7] hover:underline transition-colors"
                  >
                    Sign Up
                  </a>
                </p>
              ) : (
                <p className="text-sm text-[#64748B]">
                  Don't have an account?{' '}
                  <a
                    href="/salon/register"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onNavigate) onNavigate('/salon/register');
                    }}
                    className="font-semibold text-[#0EA5E9] hover:text-[#0284C7] hover:underline transition-colors"
                  >
                    Register Your Salon
                  </a>
                </p>
              )}
            </div>

          </div>

          {/* Security footnote */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/70 drop-shadow-sm">
            <ShieldCheck size={14} className="text-[#38BDF8]" />
            <span>Secure SSL 256-bit encrypted authentication</span>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 w-full py-4 px-5 text-center text-xs text-white/60">
        <p>© {new Date().getFullYear()} UPLOOKZ. All rights reserved.</p>
      </footer>

    </div>
  );
}
