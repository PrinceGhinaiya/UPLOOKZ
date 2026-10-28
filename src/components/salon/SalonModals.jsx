import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, Mail, DollarSign, AlertCircle, CheckCircle2, Scissors, ShieldAlert, AlertTriangle } from 'lucide-react';
import { salonClient } from '../../services/salonClient';

/**
 * 1. Add / Edit Service Modal
 */
export function ServiceModal({ isOpen, onClose, onSave, service = null }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hair');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setName(service.name || '');
      setCategory(service.category || 'Hair');
      setPrice(service.price ? String(service.price) : '');
      setDurationMinutes(service.durationMinutes ? String(service.durationMinutes) : '45');
      setDescription(service.description || '');
      setActive(service.active !== undefined ? service.active : true);
    } else {
      setName('');
      setCategory('Hair');
      setPrice('');
      setDurationMinutes('45');
      setDescription('');
      setActive(true);
    }
    setError('');
  }, [service, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setError('Service name and price are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        category,
        price: parseFloat(price),
        durationMinutes: parseInt(durationMinutes, 10),
        description: description.trim(),
        active
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">
              {service ? 'Edit Service' : 'Add New Service'}
            </h3>
            <p className="text-xs text-[#64748B]">
              Configure service pricing and duration for customer bookings.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#94A3B8] hover:text-[#111827] hover:bg-[#F1F5F9]">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#334155] mb-1">Service Title *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Executive Fade & Beard Sculpt"
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              >
                <option value="Hair">Hair</option>
                <option value="Beard & Shave">Beard & Shave</option>
                <option value="Skin & Facial">Skin & Facial</option>
                <option value="Spa & Wellness">Spa & Wellness</option>
                <option value="Combo Packages">Combo Packages</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="10"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="650"
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Duration (Mins) *</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              >
                <option value="15">15 mins</option>
                <option value="30">30 mins</option>
                <option value="45">45 mins</option>
                <option value="60">60 mins</option>
                <option value="75">75 mins</option>
                <option value="90">90 mins</option>
                <option value="105">105 mins</option>
                <option value="120">120 mins</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this service include? (Wash, styling, consultation, products used...)"
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="activeToggle"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#0EA5E9] focus:ring-[#0EA5E9]"
            />
            <label htmlFor="activeToggle" className="text-xs font-medium text-[#334155] cursor-pointer">
              Active & Available for Client Bookings
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : service ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 2. Add / Edit Staff Modal
 */
export function StaffModal({ isOpen, onClose, onSave, staff = null, services = [] }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior Stylist');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('18:00');
  const [weeklyOff, setWeeklyOff] = useState(['Monday']);
  const [assignedServiceIds, setAssignedServiceIds] = useState([]);
  const [active, setActive] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setRole(staff.role || 'Senior Stylist');
      setPhone(staff.phone || '');
      setEmail(staff.email || '');
      setStartHour(staff.workingHours?.start || '09:00');
      setEndHour(staff.workingHours?.end || '18:00');
      setWeeklyOff(staff.weeklyOffDays || ['Monday']);
      setAssignedServiceIds(staff.assignedServiceIds || []);
      setActive(staff.active !== undefined ? staff.active : true);
      setIsManager(Boolean(staff.isManager));
    } else {
      setName('');
      setRole('Senior Stylist');
      setPhone('');
      setEmail('');
      setStartHour('09:00');
      setEndHour('18:00');
      setWeeklyOff(['Monday']);
      setAssignedServiceIds(services.map((s) => s.id));
      setActive(true);
      setIsManager(false);
    }
    setError('');
  }, [staff, isOpen, services]);

  if (!isOpen) return null;

  const handleToggleService = (srvId) => {
    setAssignedServiceIds((prev) =>
      prev.includes(srvId) ? prev.filter((id) => id !== srvId) : [...prev, srvId]
    );
  };

  const handleToggleOffDay = (day) => {
    setWeeklyOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Staff member name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        role: role.trim(),
        phone: phone.trim(),
        email: email.trim(),
        workingHours: { start: startHour, end: endHour },
        weeklyOffDays: weeklyOff,
        assignedServiceIds,
        active,
        isManager
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save staff member.');
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">
              {staff ? 'Edit Staff Profile' : 'Add Team Member'}
            </h3>
            <p className="text-xs text-[#64748B]">
              Assign services, duty hours, and weekly off schedule.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#94A3B8] hover:text-[#111827] hover:bg-[#F1F5F9]">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Karan Malhotra"
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Role / Designation *</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Senior Stylist & Barber"
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98111 22334"
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="karan@apexstudio.com"
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Shift Start</label>
              <input
                type="time"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Shift End</label>
              <input
                type="time"
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1.5">Weekly Off Day(s)</label>
            <div className="flex flex-wrap gap-1.5">
              {daysOfWeek.map((day) => (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleToggleOffDay(day)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    weeklyOff.includes(day)
                      ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                      : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1.5">Assigned Services</label>
            <div className="max-h-32 overflow-y-auto border border-[#E2E8F0] rounded-lg p-2.5 space-y-1.5 bg-[#F8FAFC]">
              {services.map((srv) => (
                <label key={srv.id} className="flex items-center gap-2 cursor-pointer text-xs text-[#334155]">
                  <input
                    type="checkbox"
                    checked={assignedServiceIds.includes(srv.id)}
                    onChange={() => handleToggleService(srv.id)}
                    className="rounded text-[#0EA5E9] focus:ring-[#0EA5E9]"
                  />
                  <span>{srv.name} (₹{srv.price})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[#334155] cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded text-[#0EA5E9] focus:ring-[#0EA5E9]"
              />
              Active on Duty
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-[#334155] cursor-pointer">
              <input
                type="checkbox"
                checked={isManager}
                onChange={(e) => setIsManager(e.target.checked)}
                className="rounded text-[#0EA5E9] focus:ring-[#0EA5E9]"
              />
              Manager Privileges (Can view financials)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : staff ? 'Update Staff' : 'Add Team Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 3. New Appointment Modal (With Availability Conflict Checking)
 */
export function NewAppointmentModal({ isOpen, onClose, onSave, services = [], staff = [] }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [date, setDate] = useState('2026-10-28');
  const [time, setTime] = useState('04:00 PM');
  const [notes, setNotes] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services]);

  if (!isOpen) return null;

  // Real-time conflict validation
  const checkConflict = async (testDate, testTime, testStaffId) => {
    try {
      const res = await salonClient.checkAvailability({
        date: testDate,
        time: testTime,
        staffId: testStaffId || null,
        durationMinutes: 45
      });
      if (!res.available) {
        setConflictWarning(res.reason || 'Slot conflicts with existing booking.');
      } else {
        setConflictWarning('');
      }
    } catch {
      setConflictWarning('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    setLoading(true);
    try {
      await onSave({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        serviceIds: [selectedServiceId],
        staffId: selectedStaffId || null,
        date,
        time,
        notes: notes.trim(),
        status: 'confirmed'
      });
      onClose();
    } catch (err) {
      setConflictWarning(err.message || 'Failed to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  const timeslots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">Book New Appointment</h3>
            <p className="text-xs text-[#64748B]">Schedule an appointment with live conflict validation.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#94A3B8] hover:text-[#111827] hover:bg-[#F1F5F9]">
            <X size={18} />
          </button>
        </div>

        {conflictWarning && (
          <div className="p-3 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>{conflictWarning}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Vikram Singhal"
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Phone Number</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">Select Service *</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            >
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} — ₹{srv.price} ({srv.durationMinutes}m)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  checkConflict(e.target.value, time, selectedStaffId);
                }}
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Time Slot *</label>
              <select
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  checkConflict(date, e.target.value, selectedStaffId);
                }}
                className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              >
                {timeslots.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">Assigned Stylist</label>
            <select
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                checkConflict(date, time, e.target.value);
              }}
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            >
              <option value="">Any Available Stylist</option>
              {staff.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">Appointment Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Skin fade, allergic to ammonia, requested quiet session"
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-sm disabled:opacity-50"
            >
              {loading ? 'Validating & Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 4. Add Walk-In to Live Queue Modal
 */
export function AddWalkInModal({ isOpen, onClose, onSave, services = [], staff = [] }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [staffId, setStaffId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (services.length > 0 && !serviceId) {
      setServiceId(services[0].id);
    }
  }, [services]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    setLoading(true);
    try {
      await onSave({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        serviceId,
        staffId: staffId || null,
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to add walk-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">Add Walk-In Customer</h3>
            <p className="text-xs text-[#64748B]">Insert client into the live queue with wait estimation.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#94A3B8] hover:text-[#111827] hover:bg-[#F1F5F9]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#334155] mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Sameer Kapoor"
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">Phone Number (Optional for SMS updates)</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 98200 11223"
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">Requested Service</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            >
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} (₹{srv.price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">Preferred Staff / Chair</label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            >
              <option value="">Next Available Stylist</option>
              {staff.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">Special Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Quick trim, needs to leave by 3 PM"
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-sm disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add to Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 5. Reschedule Appointment Modal
 */
export function RescheduleModal({ isOpen, onClose, onSave, appointment = null, staff = [] }) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newStaffId, setNewStaffId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appointment) {
      setNewDate(appointment.date || '');
      setNewTime(appointment.time || '11:00 AM');
      setNewStaffId(appointment.staffId || '');
    }
    setError('');
  }, [appointment, isOpen]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSave(appointment.id, {
        date: newDate,
        time: newTime,
        staffId: newStaffId || null
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Rescheduling failed.');
    } finally {
      setLoading(false);
    }
  };

  const timeslots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">Reschedule Appointment</h3>
            <p className="text-xs text-[#64748B]">For {appointment.customerName} • {appointment.serviceNames?.join(', ')}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#94A3B8] hover:text-[#111827] hover:bg-[#F1F5F9]">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#334155] mb-1">New Date</label>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">New Time</label>
            <select
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            >
              {timeslots.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">Assigned Stylist</label>
            <select
              value={newStaffId}
              onChange={(e) => setNewStaffId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            >
              <option value="">Keep current / Any available</option>
              {staff.map((st) => (
                <option key={st.id} value={st.id}>{st.name} ({st.role})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-sm disabled:opacity-50"
            >
              {loading ? 'Rescheduling...' : 'Update Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 6. Confirmation Dialog for Destructive Actions
 */
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', isDestructive = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-4 text-center">
        <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-[#F0F9FF] text-[#0EA5E9]'}`}>
          {isDestructive ? <ShieldAlert size={24} /> : <AlertTriangle size={24} />}
        </div>
        <div>
          <h3 className="text-base font-bold text-[#111827]">{title}</h3>
          <p className="text-xs text-[#64748B] mt-1">{message}</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all ${
              isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0EA5E9] hover:bg-[#0284C7]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
