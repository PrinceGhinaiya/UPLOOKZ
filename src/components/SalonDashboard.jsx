import React from 'react';
import { Store, Users, Calendar, DollarSign, LogOut, Star, Clock, CheckCircle2, Plus } from 'lucide-react';

export default function SalonDashboard({ onNavigate }) {
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
              Salon Partner Portal
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-xs">
                AS
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-[#111827]">Apex Studio</p>
                <p className="text-[11px] text-[#64748B]">Salon Owner</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('/login?role=salon')}
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
        
        {/* Salon Owner Welcome Banner */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-clean flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              Storefront Online • Accepting Bookings
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
              Apex Studio & Grooming Dashboard
            </h1>
            <p className="text-sm sm:text-base text-[#64748B]">
              Manage today's schedule, staff allocations, and client service requests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-lift inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-semibold shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>Add Service</span>
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Today's Appointments</span>
              <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center">
                <Calendar size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#111827]">14</p>
            <p className="text-xs text-[#16A34A] font-medium">↑ 3 new requests today</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Salon Rating</span>
              <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-amber-600 flex items-center justify-center">
                <Star size={16} className="fill-amber-500 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#111827]">4.9 / 5.0</p>
            <p className="text-xs text-[#64748B]">Based on 128 verified reviews</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Active Stylists</span>
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#111827]">6 on Duty</p>
            <p className="text-xs text-[#64748B]">All chairs operational</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Partner Tier</span>
              <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <Store size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#111827]">Verified Pro</p>
            <p className="text-xs text-[#0284C7] font-medium">UPLOOKZ Featured</p>
          </div>

        </div>

        {/* Schedule & Services Table */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-clean overflow-hidden">
          <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#111827]">Upcoming Schedule for Today</h3>
              <p className="text-xs text-[#64748B]">Real-time client appointments</p>
            </div>
            <span className="text-xs font-medium text-[#0EA5E9] bg-[#F0F9FF] px-2.5 py-1 rounded-md">
              Live sync active
            </span>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {[
              { client: 'Rahul S.', service: 'Executive Haircut & Styling', time: '11:00 AM', stylist: 'Karan (Chair 1)', status: 'Confirmed' },
              { client: 'Ananya P.', service: 'Hair Spa & Scalp Therapy', time: '12:30 PM', stylist: 'Priya (Chair 3)', status: 'In Progress' },
              { client: 'Vikram M.', service: 'Beard Sculpt & Shave', time: '02:00 PM', stylist: 'Amit (Chair 2)', status: 'Confirmed' },
              { client: 'Sneha R.', service: 'Precision Cut & Blowdry', time: '03:15 PM', stylist: 'Priya (Chair 3)', status: 'Pending Arrival' },
            ].map((row, idx) => (
              <div key={idx} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center font-bold text-xs shrink-0">
                    {row.client.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{row.client}</p>
                    <p className="text-xs text-[#64748B]">{row.service}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1 font-medium text-[#111827]">
                    <Clock size={13} className="text-[#0EA5E9]" />
                    {row.time}
                  </span>
                  <span>{row.stylist}</span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[#E2E8F0] bg-white text-center text-xs text-[#94A3B8]">
        <p>© {new Date().getFullYear()} UPLOOKZ. Salon Partner Dashboard.</p>
      </footer>
    </div>
  );
}
