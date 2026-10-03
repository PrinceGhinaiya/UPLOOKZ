import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function LoginPage({ onNavigate, initialRole = 'customer' }) {
  const [role, setRole] = useState(initialRole);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

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

    // Validation
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
    // Redirects to respective customer/salon dashboard
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
    <div className="min-h-screen bg-[#F7FBFF] flex flex-col justify-between selection:bg-[#0EA5E9] selection:text-white">
      {/* Top Header / Branding Bar */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('/');
            }}
            className="flex items-center gap-2.5 group focus:outline-none"
            title="Return to UPLOOKZ Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0EA5E9] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <span className="font-bold text-base tracking-tight">U</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111827]">
              UPLOOKZ<span className="text-[#0EA5E9]">.</span>
            </span>
          </a>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('/');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0EA5E9] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#F0F9FF]"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to</span> Home
          </a>
        </div>
      </header>

      {/* Main Centered Login Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-[440px] mx-auto">
          
          {/* Login Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-clean-lg p-6 sm:p-9 space-y-6">
            
            {/* Role Selection Tabs */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
                Select Account Type
              </label>
              <div
                className="grid grid-cols-2 p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]/80"
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
            <div className="space-y-1.5 text-left">
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
                className="p-3.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-in fade-in"
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

            {/* Form */}
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
                  className="btn-lift w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-sm shadow-md shadow-[#0EA5E9]/20 transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
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

          {/* Trust footnote */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#94A3B8]">
            <ShieldCheck size={14} className="text-[#0EA5E9]" />
            <span>Secure SSL 256-bit encrypted authentication</span>
          </div>

        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 border-t border-[#E2E8F0] bg-white text-center text-xs text-[#94A3B8]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} UPLOOKZ. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[#64748B]">
            <a
              href="/#about"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('/#about');
              }}
              className="hover:text-[#0EA5E9] transition-colors"
            >
              About
            </a>
            <span>•</span>
            <a
              href="/#for-salons"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('/#for-salons');
              }}
              className="hover:text-[#0EA5E9] transition-colors"
            >
              For Salons
            </a>
            <span>•</span>
            <span className="text-[#94A3B8]">Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
