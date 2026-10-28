import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { salonClient } from '../../services/salonClient';

export default function SalonCalendarTab({
  salon,
  appointments = [],
  staff = [],
  blockedSlots = [],
  onOpenNewAppointment,
  onRefresh
}) {
  const [selectedDate, setSelectedDate] = useState('2026-10-28');
  const [viewType, setViewType] = useState('day'); // 'day' | 'week'
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState('01:30 PM');
  const [blockEndTime, setBlockEndTime] = useState('02:30 PM');
  const [blockReason, setBlockReason] = useState('Lunch & Sanitization');
  const [blockStaffId, setBlockStaffId] = useState('');
  const [loading, setLoading] = useState(false);

  // Time grid slots from 09:00 AM to 08:30 PM in 30 min intervals
  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM'
  ];

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Day's active appointments
  const dayAppointments = appointments.filter((a) => a.date === selectedDate && a.status !== 'cancelled');
  const dayBlockedSlots = blockedSlots.filter((b) => b.date === selectedDate);

  const handleAddBlockedSlot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await salonClient.addBlockedSlot({
        date: selectedDate,
        startTime: blockStartTime,
        endTime: blockEndTime,
        reason: blockReason,
        staffId: blockStaffId || null
      });
      setShowBlockModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to block slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlockedSlot = async (slotId) => {
    try {
      await salonClient.deleteBlockedSlot(slotId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to remove blocked slot.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Salon Calendar & Availability
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Hours: {salon?.openingTime || '09:00'} – {salon?.closingTime || '21:00'} • Staff availability and blocked slots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowBlockModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold shadow-sm transition-all"
          >
            <ShieldAlert size={14} />
            <span>+ Block Slot / Break</span>
          </button>

          <button
            onClick={onOpenNewAppointment}
            className="btn-lift inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Date Navigation Strip */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-clean flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#64748B]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setSelectedDate('2026-10-28')}
            className="px-2.5 py-1 text-xs font-semibold text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg"
          >
            Today
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] font-bold text-[#111827]"
          />
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#64748B]"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-[#0284C7]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9]" />
            Appointment Scheduled
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Blocked Slot / Break
          </span>
          <span className="flex items-center gap-1.5 text-[#16A34A]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            Available Open Slot
          </span>
        </div>
      </div>

      {/* Visual Timeline Grid */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-clean overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#111827]">
            Timeline Schedule for {selectedDate}
          </h3>
          <span className="text-xs text-[#64748B]">
            {dayAppointments.length} bookings • {dayBlockedSlots.length} blocks
          </span>
        </div>

        <div className="divide-y divide-[#F1F5F9] max-h-[600px] overflow-y-auto">
          {timeSlots.map((slot) => {
            const aptInSlot = dayAppointments.find((a) => a.time === slot);
            const blockInSlot = dayBlockedSlots.find((b) => b.startTime === slot);

            return (
              <div
                key={slot}
                className={`p-3 sm:px-6 flex items-start gap-4 transition-colors ${
                  aptInSlot
                    ? 'bg-[#F0F9FF]/70'
                    : blockInSlot
                    ? 'bg-amber-50/70'
                    : 'hover:bg-[#F8FAFC]'
                }`}
              >
                {/* Time Label */}
                <span className="w-20 shrink-0 text-xs font-bold text-[#64748B] pt-0.5">
                  {slot}
                </span>

                {/* Content */}
                <div className="flex-1">
                  {aptInSlot ? (
                    <div className="p-3 bg-white border border-[#BAE6FD] rounded-xl shadow-sm flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#111827]">
                            {aptInSlot.customerName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#E0F2FE] text-[#0284C7]">
                            {aptInSlot.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          {aptInSlot.serviceNames?.join(', ')} • {aptInSlot.durationMinutes}m • ₹{aptInSlot.totalAmount}
                        </p>
                      </div>

                      <div className="text-right text-xs">
                        <span className="font-semibold text-[#334155]">
                          {aptInSlot.staffName || 'Stylist'}
                        </span>
                      </div>
                    </div>
                  ) : blockInSlot ? (
                    <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={14} className="text-amber-700" />
                        <span className="font-semibold">{blockInSlot.reason}</span>
                        <span className="text-[11px] text-amber-700">
                          ({blockInSlot.startTime} – {blockInSlot.endTime})
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteBlockedSlot(blockInSlot.id)}
                        className="text-amber-800 hover:text-red-600 p-1 rounded"
                        title="Unblock slot"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-[#94A3B8] py-1">
                      <span>Available open time slot</span>
                      <button
                        onClick={onOpenNewAppointment}
                        className="text-[11px] font-semibold text-[#0EA5E9] hover:underline"
                      >
                        + Book
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Block Slot Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#111827]">Block Time Slot</h3>
              <p className="text-xs text-[#64748B]">Prevent client bookings during lunch, sanitization, or maintenance.</p>
            </div>

            <form onSubmit={handleAddBlockedSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Reason / Note *</label>
                <input
                  type="text"
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Lunch & Equipment Sanitization"
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Start Time</label>
                  <select
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                  >
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">End Time</label>
                  <select
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                  >
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Block Target</label>
                <select
                  value={blockStaffId}
                  onChange={(e) => setBlockStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="">Entire Salon (All Stylists)</option>
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>{st.name} only</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
                >
                  {loading ? 'Blocking...' : 'Block Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
