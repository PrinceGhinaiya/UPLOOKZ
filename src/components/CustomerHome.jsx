import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Clock,
  MapPin,
  User,
  LogOut,
  ArrowRight,
  Star,
  Scissors,
  Store,
  RefreshCw,
  Plus,
  CheckCircle2,
  X,
  Timer
} from 'lucide-react';
import { authClient } from '../services/authClient';
import { salonClient } from '../services/salonClient';

export default function CustomerHome({ onNavigate }) {
  const [currentUser, setCurrentUser] = useState(() => authClient.getStoredUser() || {
    name: 'John Doe',
    phone: '+91 98765 43210',
    roles: ['customer', 'salon'],
    activeRole: 'customer'
  });

  const [appointments, setAppointments] = useState([]);
  const [queueInfo, setQueueInfo] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  // Booking Form State
  const [bookServiceId, setBookServiceId] = useState('');
  const [bookDate, setBookDate] = useState('2026-10-28');
  const [bookTime, setBookTime] = useState('04:30 PM');
  const [bookNotes, setBookNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Load user session, customer appointments, and salon info
  useEffect(() => {
    authClient.fetchSession().then((u) => {
      if (u) setCurrentUser(u);
    });

    // Fetch customer's real bookings
    salonClient.fetchCustomerAppointments().then((res) => {
      if (res?.appointments) setAppointments(res.appointments);
    }).catch(() => {});

    // Fetch live queue status
    salonClient.fetchCustomerQueueStatus().then((res) => {
      if (res) setQueueInfo(res);
    }).catch(() => {});

    // Fetch services
    salonClient.fetchCustomerSalonInfo().then((res) => {
      if (res?.services) {
        setAvailableServices(res.services);
        if (res.services.length > 0) setBookServiceId(res.services[0].id);
      }
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await authClient.logout();
    if (onNavigate) {
      onNavigate('/');
    } else {
      window.location.href = '/';
    }
  };

  const handleSwitchToSalon = async () => {
    try {
      const res = await authClient.switchRole('salon');
      if (res.user) setCurrentUser(res.user);
      if (onNavigate) {
        onNavigate('/salon/dashboard');
      } else {
        window.location.href = '/salon/dashboard';
      }
    } catch {
      if (onNavigate) onNavigate('/salon/dashboard');
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await salonClient.bookCustomerAppointment({
        serviceIds: [bookServiceId],
        date: bookDate,
        time: bookTime,
        notes: bookNotes,
        customerName: currentUser?.name || 'John Doe',
        customerPhone: currentUser?.phone || '+91 98765 43210',
        customerEmail: currentUser?.email || 'john@example.com'
      });

      if (res?.appointment) {
        setAppointments((prev) => [res.appointment, ...prev]);
        setBookingSuccess(true);
        setTimeout(() => {
          setBookingSuccess(false);
          setIsBookModalOpen(false);
        }, 1500);
      }
    } catch (err) {
      setBookingError(err.message || 'Slot conflict or booking error.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    try {
      const res = await salonClient.joinCustomerQueue({
        customerName: currentUser?.name || 'Customer',
        customerPhone: currentUser?.phone || '',
        serviceId: availableServices[0]?.id || 'srv_01',
        notes: 'Online queue check-in'
      });
      if (res?.entry) {
        alert(`You are in line! Position #${res.entry.position}. Estimated wait: ~${res.entry.estimatedWaitMinutes} mins.`);
        setIsQueueModalOpen(false);
        // Refresh queue
        salonClient.fetchCustomerQueueStatus().then((q) => q && setQueueInfo(q));
      }
    } catch (err) {
      alert(err.message || 'Failed to join queue.');
    }
  };

  const displayName = currentUser?.name || 'John Doe';
  const displayInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  // Get active upcoming appointment
  const nextAppointment = appointments.find(
    (a) => a.status === 'confirmed' || a.status === 'in_service' || a.status === 'pending'
  ) || appointments[0];

  const timeslots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
  ];

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
            {/* Seamless Mode Switcher (Customer <-> Salon Owner without logging out) */}
            <button
              onClick={handleSwitchToSalon}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0EA5E9] bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] px-3 py-1.5 rounded-lg transition-all"
              title="Switch to Salon Partner Dashboard"
            >
              <Store size={14} />
              <span className="hidden sm:inline">Switch to</span> Salon Mode
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-xs">
                {displayInitials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-[#111827]">{displayName}</p>
                <p className="text-[11px] text-[#64748B]">{currentUser?.phone || 'Customer'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
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
              Verified Account • Logged in as Customer
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
              Welcome Back, {displayName.split(' ')[0]}!
            </h1>
            <p className="text-sm sm:text-base text-[#64748B]">
              Ready for your next look? Discover verified premium salons and plan your grooming visit with ease.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="btn-lift inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-semibold shadow-sm transition-all"
            >
              <Calendar size={16} />
              <span>Book Appointment</span>
            </button>

            <button
              onClick={() => setIsQueueModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] text-sm font-semibold transition-all"
            >
              <Clock size={16} />
              <span>Live Queue Status</span>
            </button>
          </div>
        </div>

        {/* Quick Stats & Bookings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Next Appointment (Connected to real database!) */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                nextAppointment?.status === 'in_service'
                  ? 'bg-[#E0F2FE] text-[#0284C7]'
                  : nextAppointment?.status === 'completed'
                  ? 'bg-[#F0FDF4] text-[#16A34A]'
                  : 'bg-[#EFF6FF] text-[#2563EB]'
              }`}>
                {nextAppointment ? nextAppointment.status : 'Upcoming'}
              </span>
            </div>

            {nextAppointment ? (
              <div>
                <p className="text-xs text-[#64748B]">Next Appointment</p>
                <h3 className="text-base font-bold text-[#111827] mt-0.5">
                  {nextAppointment.serviceNames?.join(', ') || 'Executive Haircut & Styling'}
                </h3>
                <p className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
                  <Clock size={13} /> {nextAppointment.date} at {nextAppointment.time}
                </p>
                <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                  <MapPin size={13} /> Apex Studio & Grooming (Bandra West)
                </p>
                <p className="text-xs font-semibold text-[#0EA5E9] mt-2">
                  Stylist: {nextAppointment.staffName || 'Karan Malhotra'} • ₹{nextAppointment.totalAmount}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-[#64748B]">Next Appointment</p>
                <h3 className="text-base font-bold text-[#111827] mt-0.5">No Active Bookings</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Book your next grooming visit with master stylists in Bandra.
                </p>
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="mt-3 text-xs font-semibold text-[#0EA5E9] hover:underline"
                >
                  Book Appointment Now →
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Favorite Salons */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-amber-600 flex items-center justify-center">
                <Star size={20} className="fill-amber-500 text-amber-500" />
              </div>
              <span className="text-xs font-semibold text-[#64748B]">Verified Partner</span>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Top Pick</p>
              <h3 className="text-base font-bold text-[#111827] mt-0.5">Apex Studio & Grooming</h3>
              <p className="text-xs text-[#16A34A] font-semibold mt-1">
                4.9 ★ • Open Today until 9:00 PM
              </p>
              <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                <Timer size={13} className="text-[#0EA5E9]" />
                Live Walk-In Queue: {queueInfo?.waitingCount || 2} waiting (~{queueInfo?.estimatedWaitMinutes || 20}m)
              </p>
            </div>
          </div>

          {/* Card 3: Recent Activity */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
                <Scissors size={20} />
              </div>
              <span className="text-xs font-semibold text-[#64748B]">
                {appointments.filter((a) => a.status === 'completed').length + 2} visits
              </span>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Loyalty Status</p>
              <h3 className="text-base font-bold text-[#111827] mt-0.5">Silver Grooming Tier</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Earn 5% rewards on all completed haircuts and spa sessions.
              </p>
            </div>
          </div>

        </div>

        {/* Customer Past Appointments History */}
        {appointments.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-clean overflow-hidden">
            <div className="p-5 sm:px-6 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111827]">Your Grooming Appointments</h3>
                <p className="text-xs text-[#64748B]">Synchronized with Apex Studio & Grooming schedule</p>
              </div>
              <span className="text-xs font-semibold text-[#0EA5E9] bg-[#F0F9FF] px-2.5 py-1 rounded-md">
                Live Sync
              </span>
            </div>

            <div className="divide-y divide-[#F1F5F9]">
              {appointments.map((apt) => (
                <div key={apt.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111827] text-sm">
                        {apt.serviceNames?.join(', ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        apt.status === 'completed'
                          ? 'bg-[#F0FDF4] text-[#16A34A]'
                          : apt.status === 'in_service'
                          ? 'bg-[#E0F2FE] text-[#0284C7]'
                          : 'bg-[#EFF6FF] text-[#2563EB]'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-[#64748B] mt-0.5">
                      Apex Studio & Grooming • Stylist: {apt.staffName || 'Stylist'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[#64748B]">
                    <span className="font-semibold text-[#111827]">
                      {apt.date} at {apt.time}
                    </span>
                    <span className="font-bold text-[#0EA5E9]">
                      ₹{apt.totalAmount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Customer Booking Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">Book at Apex Studio</h3>
                <p className="text-xs text-[#64748B]">Plot 42, Linking Road, Bandra West</p>
              </div>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#111827] hover:bg-[#F1F5F9]"
              >
                <X size={18} />
              </button>
            </div>

            {bookingSuccess && (
              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Appointment booked! The salon owner will confirm shortly.</span>
              </div>
            )}

            {bookingError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {bookingError}
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Select Service</label>
                <select
                  value={bookServiceId}
                  onChange={(e) => setBookServiceId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                >
                  {availableServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ₹{s.price} ({s.durationMinutes}m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Time Slot</label>
                  <select
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                  >
                    {timeslots.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Special Preferences / Styling Notes</label>
                <input
                  type="text"
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="e.g. Low fade, scissor cut, natural finish"
                  className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-sm disabled:opacity-50"
                >
                  {bookingLoading ? 'Checking Availability...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Live Queue Modal */}
      {isQueueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center mx-auto">
              <Clock size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#111827]">Apex Studio Live Queue</h3>
              <p className="text-xs text-[#64748B] mt-1">Real-time walk-in status for today</p>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#64748B]">Currently Waiting</span>
                <p className="text-xl font-bold text-amber-700 mt-0.5">
                  {queueInfo?.waitingCount || 0}
                </p>
              </div>
              <div>
                <span className="text-[#64748B]">Estimated Wait</span>
                <p className="text-xl font-bold text-[#111827] mt-0.5">
                  ~{queueInfo?.estimatedWaitMinutes || 0} mins
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleJoinQueue}
                className="w-full py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm"
              >
                Join Walk-In Queue Now
              </button>
              <button
                type="button"
                onClick={() => setIsQueueModalOpen(false)}
                className="w-full py-2 rounded-xl text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 border-t border-[#E2E8F0] bg-white text-center text-xs text-[#94A3B8]">
        <p>© {new Date().getFullYear()} UPLOOKZ. Customer Portal.</p>
      </footer>
    </div>
  );
}
