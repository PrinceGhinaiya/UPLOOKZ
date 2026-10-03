import React, { useState } from 'react';
import { Store, User, Mail, Phone, MapPin, ArrowLeft, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function SalonRegister({ onNavigate }) {
  const [salonName, setSalonName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!salonName.trim() || !ownerName.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in all required salon details.');
      return;
    }
    // Route to Salon Dashboard
    if (onNavigate) {
      onNavigate('/salon/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FBFF] flex flex-col justify-between selection:bg-[#0EA5E9] selection:text-white">
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('/');
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0EA5E9] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <span className="font-bold text-base tracking-tight">U</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111827]">
              UPLOOKZ<span className="text-[#0EA5E9]">.</span>
            </span>
          </a>

          <a
            href="/login?role=salon"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('/login?role=salon');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0EA5E9] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#F0F9FF]"
          >
            <ArrowLeft size={16} />
            Back to Salon Login
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-[480px] mx-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-clean-lg p-6 sm:p-9 space-y-6">
            
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                <Store size={13} className="text-[#0EA5E9]" />
                Salon Partner Onboarding
              </div>
              <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-[#111827]">
                Register Your Salon
              </h1>
              <p className="text-sm text-[#64748B]">
                List your business on UPLOOKZ to reach new clients and optimize your bookings.
              </p>
            </div>

            {error && (
              <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#334155]">Salon / Studio Name</label>
                <div className="relative">
                  <Store size={16} className="absolute left-3.5 top-3 text-[#94A3B8]" />
                  <input
                    type="text"
                    required
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    placeholder="e.g. Apex Studio & Grooming"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#334155]">Owner / Manager Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-[#94A3B8]" />
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#334155]">Business Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3 text-[#94A3B8]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="salon@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#334155]">Business Phone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3 text-[#94A3B8]" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#334155]">City / Area</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai, Bandra West"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-lift w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-sm shadow-md transition-all"
                >
                  <span>Submit Salon Registration</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            <div className="pt-2 text-center border-t border-[#E2E8F0]">
              <p className="text-sm text-[#64748B]">
                Already registered?{' '}
                <a
                  href="/login?role=salon"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('/login?role=salon');
                  }}
                  className="font-semibold text-[#0EA5E9] hover:text-[#0284C7] hover:underline"
                >
                  Login as Salon Owner
                </a>
              </p>
            </div>

          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-[#E2E8F0] bg-white text-center text-xs text-[#94A3B8]">
        <p>© {new Date().getFullYear()} UPLOOKZ. Salon Partner Network.</p>
      </footer>
    </div>
  );
}
