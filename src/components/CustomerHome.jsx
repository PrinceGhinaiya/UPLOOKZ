import React from 'react';
import { Calendar, Search, Clock, MapPin, User, LogOut, ArrowRight, Star, Scissors } from 'lucide-react';

export default function CustomerHome({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#F7FBFF] flex flex-col justify-between selection:bg-[#0EA5E9] selection:text-white">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
              Customer Portal
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-xs">
                JD
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-[#111827]">John Doe</p>
                <p className="text-[11px] text-[#64748B]">Customer</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('/login')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#64748B] hover:text-red-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-5 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-clean flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              Logged In as Customer
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
              Welcome Back, John!
            </h1>
            <p className="text-sm sm:text-base text-[#64748B]">
              Ready for your next look? Discover verified premium salons and book your slot in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('/');
              }}
              className="btn-lift inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-semibold shadow-sm transition-all"
            >
              <Search size={16} />
              <span>Explore Salons</span>
            </a>
          </div>
        </div>

        {/* Quick Stats & Bookings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Next Appointment */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#2563EB]">
                Upcoming
              </span>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Next Appointment</p>
              <h3 className="text-base font-bold text-[#111827] mt-0.5">Haircut & Beard Sculpt</h3>
              <p className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
                <Clock size={13} /> Tomorrow at 4:30 PM
              </p>
              <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                <MapPin size={13} /> Apex Studio & Grooming
              </p>
            </div>
          </div>

          {/* Card 2: Favorite Salons */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-amber-600 flex items-center justify-center">
                <Star size={20} className="fill-amber-500 text-amber-500" />
              </div>
              <span className="text-xs font-semibold text-[#64748B]">3 Saved</span>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Top Pick</p>
              <h3 className="text-base font-bold text-[#111827] mt-0.5">Apex Studio & Grooming</h3>
              <p className="text-xs text-[#16A34A] font-semibold mt-1">
                4.9 ★ • Open Today until 9:00 PM
              </p>
            </div>
          </div>

          {/* Card 3: Recent Activity */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
                <Scissors size={20} />
              </div>
              <span className="text-xs font-semibold text-[#64748B]">Total 8 visits</span>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Loyalty Status</p>
              <h3 className="text-base font-bold text-[#111827] mt-0.5">Silver Grooming Tier</h3>
              <p className="text-xs text-[#64748B] mt-1">
                2 more bookings to reach Gold Tier
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[#E2E8F0] bg-white text-center text-xs text-[#94A3B8]">
        <p>© {new Date().getFullYear()} UPLOOKZ. Customer Portal.</p>
      </footer>
    </div>
  );
}
