import React from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  UserPlus,
  Play,
  Scissors,
  Star,
  AlertCircle
} from 'lucide-react';

export default function SalonOverviewTab({
  salon,
  currentUser,
  appointments = [],
  queue = [],
  analytics = {},
  onOpenNewAppointment,
  onOpenAddWalkIn,
  onOpenAddService,
  setActiveTab,
  onUpdateAppointmentStatus,
  onUpdateQueueStatus
}) {
  const todayStr = '2026-10-28';

  // 1. Calculations based on actual recorded database records
  const todayAppointments = appointments.filter((a) => a.date === todayStr);
  const waitingQueue = queue.filter((q) => q.status === 'waiting');
  const inServiceQueue = queue.filter((q) => q.status === 'in_service');
  const inServiceAppointments = appointments.filter((a) => a.date === todayStr && a.status === 'in_service');
  const currentlyBeingServed = inServiceQueue.length + inServiceAppointments.length;
  const completedToday = appointments.filter((a) => a.date === todayStr && a.status === 'completed').length;
  const upcomingToday = appointments.filter((a) => a.date === todayStr && (a.status === 'confirmed' || a.status === 'pending')).length;

  const todayRevenue = analytics.todayRevenue || 0;

  const displaySalonName = salon?.name || currentUser?.salonName || 'Apex Studio & Grooming';
  const displayOwnerName = currentUser?.name || 'Rahul Sharma';

  // Next walk-in to serve
  const nextInQueue = waitingQueue.length > 0 ? waitingQueue[0] : null;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-clean flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            Storefront Live • Operational Today
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
            {displaySalonName} Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Welcome back, {displayOwnerName}. Manage today's schedule, live walk-in arrivals, stylist chairs, and verified revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAddWalkIn}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] text-xs font-semibold shadow-sm transition-all"
          >
            <UserPlus size={15} />
            <span>+ Add Walk-In</span>
          </button>

          <button
            onClick={onOpenNewAppointment}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* 6 Core KPI Summary Cards as specified in requirements */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4">
        
        {/* 1. Today's Appointments */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-clean space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B]">Today's Bookings</span>
            <div className="w-7 h-7 rounded-lg bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center">
              <Calendar size={14} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#111827]">{todayAppointments.length}</p>
          <p className="text-[10px] text-[#64748B] font-medium">
            {upcomingToday} upcoming • {completedToday} done
          </p>
        </div>

        {/* 2. Customers Currently Waiting */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-clean space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B]">Waiting in Queue</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-700">{waitingQueue.length}</p>
          <p className="text-[10px] text-amber-700 font-medium">
            {waitingQueue.length > 0 ? `~${waitingQueue[0].estimatedWaitMinutes}m estimated next` : 'No wait right now'}
          </p>
        </div>

        {/* 3. Customers Being Served */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-clean space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B]">Being Served</span>
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
              <Scissors size={14} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#16A34A]">{currentlyBeingServed}</p>
          <p className="text-[10px] text-[#16A34A] font-medium">Chairs operational</p>
        </div>

        {/* 4. Completed Appointments */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-clean space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B]">Completed Today</span>
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#111827]">{completedToday}</p>
          <p className="text-[10px] text-[#64748B]">Services fulfilled</p>
        </div>

        {/* 5. Today's Revenue */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-clean space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B]">Today's Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
              <DollarSign size={14} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#111827]">₹{todayRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-[#059669] font-medium">From verified transactions</p>
        </div>

        {/* 6. Upcoming Appointments */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-clean space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B]">Upcoming Today</span>
            <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
              <Calendar size={14} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#7C3AED]">{upcomingToday}</p>
          <p className="text-[10px] text-[#64748B]">Slots scheduled</p>
        </div>

      </div>

      {/* Two Column Grid: Today's Schedule & Live Queue Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (2 cols): Today's Schedule Overview */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl shadow-clean overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 sm:px-6 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#111827]">Today's Appointment Schedule</h3>
                <p className="text-xs text-[#64748B]">Live client bookings for {todayStr}</p>
              </div>
              <button
                onClick={() => setActiveTab('appointments')}
                className="text-xs font-semibold text-[#0EA5E9] hover:underline flex items-center gap-1"
              >
                <span>View All ({todayAppointments.length})</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="divide-y divide-[#F1F5F9]">
              {todayAppointments.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#94A3B8]">
                  No appointments scheduled for today yet.
                </div>
              ) : (
                todayAppointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center font-bold text-xs shrink-0">
                        {apt.customerName?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#111827]">{apt.customerName}</p>
                          <span className="text-[11px] text-[#94A3B8]">{apt.customerPhone}</span>
                        </div>
                        <p className="text-xs text-[#64748B]">
                          {apt.serviceNames?.join(', ')} • ₹{apt.totalAmount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                      <div className="text-right">
                        <span className="flex items-center gap-1 font-semibold text-[#111827]">
                          <Clock size={12} className="text-[#0EA5E9]" />
                          {apt.time}
                        </span>
                        <span className="text-[11px] text-[#64748B]">{apt.staffName || 'Stylist'}</span>
                      </div>

                      {/* Status Tag & Fast Action */}
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          apt.status === 'completed'
                            ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                            : apt.status === 'in_service'
                            ? 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
                            : apt.status === 'confirmed'
                            ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                            : apt.status === 'cancelled'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {apt.status}
                        </span>

                        {apt.status === 'confirmed' && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(apt.id, 'in_service')}
                            title="Start Service"
                            className="p-1 rounded-lg bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0EA5E9]"
                          >
                            <Play size={13} />
                          </button>
                        )}

                        {apt.status === 'in_service' && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(apt.id, 'completed')}
                            title="Mark Completed"
                            className="p-1 rounded-lg bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A]"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] text-center">
            <button
              onClick={() => setActiveTab('appointments')}
              className="text-xs font-semibold text-[#0EA5E9] hover:underline"
            >
              Manage full calendar & daily slots →
            </button>
          </div>
        </div>

        {/* Right (1 col): Live Walk-In Queue Snapshot */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-clean overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#111827]">Live Walk-In Queue</h3>
                <p className="text-xs text-[#64748B]">{waitingQueue.length} customers waiting</p>
              </div>
              <button
                onClick={() => setActiveTab('queue')}
                className="text-xs font-semibold text-[#0EA5E9] hover:underline"
              >
                Open Queue
              </button>
            </div>

            {/* Quick Serve Next Card */}
            {nextInQueue ? (
              <div className="p-4 m-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0284C7]">Next in Line (Position #1)</span>
                  <span className="text-[11px] font-semibold text-[#64748B]">
                    Wait: ~{nextInQueue.estimatedWaitMinutes} mins
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">{nextInQueue.customerName}</p>
                    <p className="text-xs text-[#64748B]">{nextInQueue.serviceName}</p>
                  </div>
                  <button
                    onClick={() => onUpdateQueueStatus(nextInQueue.id, 'in_service')}
                    className="btn-lift inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm"
                  >
                    <Play size={13} />
                    <span>Call to Chair</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 m-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-xs text-[#64748B]">
                All walk-in chairs clear. Ready for new customers.
              </div>
            )}

            {/* Waiting Queue List */}
            <div className="divide-y divide-[#F1F5F9] px-4">
              {waitingQueue.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#94A3B8]">
                  Queue is currently empty.
                </div>
              ) : (
                waitingQueue.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#E0F2FE] text-[#0284C7] font-bold text-[10px] flex items-center justify-center">
                        #{entry.position}
                      </span>
                      <div>
                        <p className="font-semibold text-[#111827]">{entry.customerName}</p>
                        <p className="text-[11px] text-[#64748B]">{entry.serviceName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-amber-700">
                        ~{entry.estimatedWaitMinutes}m wait
                      </span>
                      <p className="text-[10px] text-[#94A3B8]">Arr: {entry.arrivalTime}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
            <button
              onClick={onOpenAddWalkIn}
              className="text-xs font-semibold text-[#0EA5E9] hover:underline"
            >
              + Add walk-in customer
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className="text-xs font-semibold text-[#64748B] hover:text-[#111827]"
            >
              Manage Live Queue →
            </button>
          </div>
        </div>

      </div>

      {/* Quick Links Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div
          onClick={() => setActiveTab('services')}
          className="bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] rounded-2xl p-5 shadow-clean hover:shadow-clean-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Scissors size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#111827]">Services & Menu</p>
              <p className="text-xs text-[#64748B]">Update prices & durations</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-[#94A3B8] group-hover:text-[#0EA5E9] transition-colors" />
        </div>

        <div
          onClick={() => setActiveTab('staff')}
          className="bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] rounded-2xl p-5 shadow-clean hover:shadow-clean-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#111827]">Staff & Barbers</p>
              <p className="text-xs text-[#64748B]">Duty hours & assignments</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-[#94A3B8] group-hover:text-[#16A34A] transition-colors" />
        </div>

        <div
          onClick={() => setActiveTab('analytics')}
          className="bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] rounded-2xl p-5 shadow-clean hover:shadow-clean-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#111827]">Revenue Analytics</p>
              <p className="text-xs text-[#64748B]">Track verified performance</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-[#94A3B8] group-hover:text-amber-600 transition-colors" />
        </div>

      </div>

    </div>
  );
}
