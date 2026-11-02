import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Plus,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Scissors,
  Check,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertCircle,
  CreditCard,
  DollarSign,
  QrCode,
  Wallet,
  X,
  ShieldCheck,
  Lock
} from 'lucide-react';

export default function SalonAppointmentsTab({
  appointments = [],
  services = [],
  staff = [],
  onOpenNewAppointment,
  onOpenReschedule,
  onUpdateStatus,
  onRecordPayment,
  onRefresh
}) {
  const getTodayStr = () => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week' | 'month'
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'paid' | 'unpaid'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Payment Recording Modal State
  const [paymentModalApt, setPaymentModalApt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    // Date filter depending on view mode
    if (viewMode === 'day') {
      if (apt.date !== selectedDate) return false;
    } else if (viewMode === 'week') {
      // Show within 7 days of selectedDate
      const base = new Date(selectedDate);
      const target = new Date(apt.date);
      const diffDays = Math.abs((target - base) / (1000 * 60 * 60 * 24));
      if (diffDays > 6) return false;
    } else if (viewMode === 'month') {
      // Match YYYY-MM
      if (!apt.date.startsWith(selectedDate.slice(0, 7))) return false;
    }

    if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
    if (staffFilter !== 'all' && apt.staffId !== staffFilter) return false;
    if (paymentFilter === 'paid' && apt.paymentStatus !== 'paid') return false;
    if (paymentFilter === 'unpaid' && apt.paymentStatus === 'paid') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = apt.customerName && apt.customerName.toLowerCase().includes(q);
      const matchPhone = apt.customerPhone && apt.customerPhone.includes(q);
      const matchService = apt.serviceNames && apt.serviceNames.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchPhone && !matchService) return false;
    }

    return true;
  });

  const handleOpenPaymentModal = (apt) => {
    setPaymentModalApt(apt);
    setPaymentMethod(apt.paymentMethod === 'Card' ? 'Card' : apt.paymentMethod === 'UPI' ? 'UPI' : 'Cash');
    setPaymentAmount(apt.totalAmount?.toString() || '0');
    setPaymentSuccessMsg('');
  };

  const handleConfirmPayment = async () => {
    if (!paymentModalApt || !onRecordPayment) return;
    const numAmount = parseFloat(paymentAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    setPaymentLoading(true);
    try {
      await onRecordPayment(paymentModalApt.id, {
        paymentStatus: 'paid',
        paymentMethod,
        amount: numAmount
      });
      setPaymentSuccessMsg(`✓ Payment of ₹${numAmount} successfully recorded via ${paymentMethod}!`);
      setTimeout(() => {
        setPaymentModalApt(null);
        setPaymentLoading(false);
        setPaymentSuccessMsg('');
      }, 1000);
    } catch (err) {
      alert(err.message || 'Failed to record payment');
      setPaymentLoading(false);
    }
  };

  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(getTodayStr());
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Appointments Management
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Review, confirm, schedule, and fulfill client bookings across days, weeks, and months.
          </p>
        </div>

        <button
          onClick={onOpenNewAppointment}
          className="btn-lift inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all shrink-0"
        >
          <Plus size={16} />
          <span>New Appointment</span>
        </button>
      </div>

      {/* Controls Bar: Day/Week/Month Toggle + Date Stepper + Search & Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-clean space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Day / Week / Month View Switcher */}
          <div className="inline-flex p-1 bg-[#F1F5F9] rounded-xl text-xs font-semibold text-[#64748B]">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white text-[#111827] shadow-sm' : 'hover:text-[#111827]'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-white text-[#111827] shadow-sm' : 'hover:text-[#111827]'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'month' ? 'bg-white text-[#111827] shadow-sm' : 'hover:text-[#111827]'
              }`}
            >
              Month
            </button>
          </div>

          {/* Date Picker Stepper */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDate}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={handleSetToday}
              className="px-2.5 py-1 text-xs font-semibold text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg hover:bg-[#E0F2FE]"
            >
              Today
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] font-medium text-[#111827]"
            />

            <button
              onClick={handleNextDate}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>

        </div>

        {/* Filters Row: Search + Status + Staff + Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#F1F5F9]">
          
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, phone, service..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] text-[#334155]"
            >
              <option value="all">All Appointment Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="confirmed">Confirmed</option>
              <option value="arrived">Client Arrived</option>
              <option value="in_service">In Service</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] text-[#334155]"
            >
              <option value="all">All Stylists</option>
              {staff.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] text-[#334155] font-medium"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid Transactions Only</option>
              <option value="unpaid">Unpaid / Payment Pending</option>
            </select>
          </div>

        </div>

      </div>

      {/* Appointment Cards List */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center mx-auto">
              <Calendar size={22} />
            </div>
            <h3 className="text-base font-bold text-[#111827]">No Appointments Found</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              There are no bookings matching the selected date or filter criteria. You can create a new appointment manually.
            </p>
            <button
              onClick={onOpenNewAppointment}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0EA5E9] text-white text-xs font-semibold shadow-sm"
            >
              <Plus size={14} />
              <span>Schedule Appointment</span>
            </button>
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] rounded-2xl p-4 sm:p-5 shadow-clean hover:shadow-clean-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Details */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center font-bold text-sm shrink-0 border border-[#BAE6FD]">
                  {apt.customerName?.slice(0, 2).toUpperCase() || 'CU'}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-[#111827]">{apt.customerName}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      apt.status === 'completed'
                        ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                        : apt.status === 'in_service'
                        ? 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
                        : apt.status === 'arrived'
                        ? 'bg-[#FDF4FF] text-[#C026D3] border border-[#F5D0FE]'
                        : apt.status === 'confirmed'
                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                        : apt.status === 'cancelled'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {apt.status}
                    </span>
                    {apt.paymentStatus === 'paid' ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                          {(apt.paymentMethod === 'PayU' || apt.paymentMethod === 'Razorpay') ? (
                            <ShieldCheck size={11} className="text-[#059669]" />
                          ) : (
                            <Check size={11} />
                          )}
                          Paid ({apt.paymentMethod || 'Cash'})
                        </span>
                        {(apt.payuPaymentId || apt.payuTxnId || apt.razorpayPaymentId) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD]">
                            Ref: #{(apt.payuPaymentId || apt.payuTxnId || apt.razorpayPaymentId).slice(-8)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Payment Pending
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-[#334155]">
                    {apt.serviceNames?.join(', ')}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-[#0EA5E9]" />
                      {apt.date}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-[#111827]">
                      <Clock size={13} className="text-[#0EA5E9]" />
                      {apt.time} ({apt.durationMinutes}m)
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={13} className="text-[#0EA5E9]" />
                      Stylist: <strong className="text-[#111827]">{apt.staffName || 'Any'}</strong>
                    </span>
                    {apt.customerPhone && (
                      <span className="flex items-center gap-1">
                        <Phone size={13} className="text-[#0EA5E9]" />
                        {apt.customerPhone}
                      </span>
                    )}
                    {apt.arrivedAt && (
                      <span className="flex items-center gap-1 font-semibold text-[#C026D3] bg-[#FDF4FF] px-2 py-0.5 rounded-full border border-[#F5D0FE] text-[11px]">
                        <UserCheck size={11} />
                        Arrived: {apt.arrivedAt.split(' ')[1] || apt.arrivedAt}
                      </span>
                    )}
                  </div>

                  {apt.notes && (
                    <p className="text-[11px] text-[#64748B] italic bg-[#F8FAFC] px-2 py-1 rounded inline-block">
                      Note: "{apt.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Price & Status Action Controls */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-[#F1F5F9] gap-3">
                <div className="text-left md:text-right">
                  <p className="text-base font-bold text-[#111827]">₹{apt.totalAmount}</p>
                  <p className="text-[10px] text-[#94A3B8]">Includes taxes</p>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  
                  {apt.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onUpdateStatus(apt.id, 'confirmed')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0EA5E9] text-white text-xs font-semibold hover:bg-[#0284C7] shadow-sm"
                      >
                        <Check size={13} />
                        <span>Confirm</span>
                      </button>
                      <button
                        onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {apt.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => onUpdateStatus(apt.id, 'arrived')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FDF4FF] to-[#FAE8FF] text-[#C026D3] hover:from-[#FAE8FF] hover:to-[#F5D0FE] text-xs font-bold border border-[#F5D0FE] shadow-sm transition-all active:scale-95"
                        title="Client reached salon"
                      >
                        <UserCheck size={13} className="text-[#C026D3]" />
                        <span>Client Arrived</span>
                      </button>
                      <button
                        onClick={() => onUpdateStatus(apt.id, 'in_service')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F9FF] text-[#0284C7] hover:bg-[#E0F2FE] text-xs font-bold border border-[#BAE6FD] transition-all active:scale-95"
                        title="Seat client and start"
                      >
                        <Play size={13} />
                        <span>Start</span>
                      </button>
                      <button
                        onClick={() => onOpenReschedule(apt)}
                        className="p-1.5 rounded-xl text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] border border-[#CBD5E1] transition-all"
                        title="Reschedule appointment"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </>
                  )}

                  {apt.status === 'arrived' && (
                    <>
                      <button
                        onClick={() => onUpdateStatus(apt.id, 'in_service')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0EA5E9] text-white hover:bg-[#0284C7] text-xs font-bold shadow-sm transition-all active:scale-95"
                        title="Seat client and start service"
                      >
                        <Play size={13} />
                        <span>Start Service</span>
                      </button>
                      <button
                        onClick={() => onOpenReschedule(apt)}
                        className="p-1.5 rounded-xl text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] border border-[#CBD5E1] transition-all"
                        title="Reschedule appointment"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </>
                  )}

                  {apt.status === 'in_service' && (
                    <button
                      onClick={() => onUpdateStatus(apt.id, 'completed')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#16A34A] text-white hover:bg-[#15803D] text-xs font-semibold shadow-sm"
                    >
                      <CheckCircle2 size={13} />
                      <span>Complete Service</span>
                    </button>
                  )}

                  {/* Payment recording button or locked status for online Razorpay payments */}
                  {apt.paymentStatus === 'paid' && (apt.paymentMethod === 'PayU' || apt.paymentMethod === 'Razorpay') ? (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] text-xs font-medium cursor-not-allowed select-none"
                      title="Paid online via PayU. Manual payment modification is locked to prevent tampering."
                    >
                      <Lock size={12} className="text-[#94A3B8]" />
                      <span>Paid Online (Locked)</span>
                    </span>
                  ) : apt.paymentStatus !== 'paid' && apt.status !== 'cancelled' ? (
                    <button
                      onClick={() => handleOpenPaymentModal(apt)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] text-xs font-semibold shadow-sm transition-all"
                      title="Collect cash or online payment"
                    >
                      <DollarSign size={13} />
                      <span>Record Payment</span>
                    </button>
                  ) : null}

                  {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                    <button
                      onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                      className="text-xs text-[#94A3B8] hover:text-red-600 px-2 py-1"
                      title="Cancel appointment"
                    >
                      Cancel
                    </button>
                  )}

                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Payment Modal */}
      {paymentModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center border border-[#A7F3D0]">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Record Payment</h3>
                  <p className="text-xs text-[#64748B]">Verify payment & update revenue</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalApt(null)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#111827] hover:bg-[#F1F5F9]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Client & Service Info */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Client:</span>
                <span className="font-bold text-[#111827]">{paymentModalApt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Service:</span>
                <span className="font-semibold text-[#334155]">{paymentModalApt.serviceNames?.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Schedule:</span>
                <span className="text-[#64748B]">{paymentModalApt.date} at {paymentModalApt.time}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#E2E8F0]">
                <span className="font-semibold text-[#111827]">Total Amount:</span>
                <span className="font-bold text-[#0EA5E9]">₹{paymentModalApt.totalAmount}</span>
              </div>
            </div>

            {/* Success message or Form */}
            {paymentSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 animate-fadeIn">
                {paymentSuccessMsg}
              </div>
            ) : (
              <>
                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#111827] block">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Cash')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        paymentMethod === 'Cash'
                          ? 'bg-[#F0FDF4] border-[#16A34A] text-[#16A34A] ring-1 ring-[#16A34A]'
                          : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <Wallet size={18} />
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        paymentMethod === 'UPI'
                          ? 'bg-[#F0F9FF] border-[#0EA5E9] text-[#0EA5E9] ring-1 ring-[#0EA5E9]'
                          : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <QrCode size={18} />
                      <span>UPI / QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Card')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        paymentMethod === 'Card'
                          ? 'bg-[#FAF5FF] border-[#9333EA] text-[#9333EA] ring-1 ring-[#9333EA]'
                          : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <CreditCard size={18} />
                      <span>Card / POS</span>
                    </button>
                  </div>
                </div>

                {/* Amount Paid Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] block">
                    Received Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-bold text-[#64748B]">₹</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min="0"
                      step="1"
                      className="w-full pl-8 pr-3 py-2 text-sm font-bold text-[#111827] border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">
                    Verify the received amount before recording to the ledger.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalApt(null)}
                    disabled={paymentLoading}
                    className="flex-1 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={paymentLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    {paymentLoading ? (
                      <span>Recording...</span>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Confirm & Collect</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
