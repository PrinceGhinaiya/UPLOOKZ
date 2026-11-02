import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Sparkles,
  CreditCard,
  DollarSign,
  Wallet
} from 'lucide-react';
import { salonClient } from '../../services/salonClient';
import { paymentClient } from '../../services/paymentClient';

function getTodayStr() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export default function BookingModal({
  isOpen,
  onClose,
  salon,
  initialService = null,
  currentUser,
  onBookingSuccess
}) {
  // If not open or no salon provided, do not render
  if (!isOpen || !salon) return null;

  const [salonDetails, setSalonDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Form fields
  const [selectedServiceId, setSelectedServiceId] = useState(initialService?.id || '');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState(currentUser?.name && currentUser.name !== 'Customer' ? currentUser.name : '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone && !currentUser.phone.includes('43210') ? currentUser.phone : '');
  const [notes, setNotes] = useState('');
  const [paymentChoice, setPaymentChoice] = useState('online'); // 'online' (PayU) or 'counter' (Pay at Salon)
  const [paymentNotice, setPaymentNotice] = useState('');

  // Slots state
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // 1. Fetch exact salon services and staff
  useEffect(() => {
    let isMounted = true;
    setLoadingDetails(true);
    setErrorMessage('');
    setConfirmedBooking(null);

    async function loadSalonData() {
      try {
        const data = await salonClient.fetchCustomerSalonDetails(salon.id);
        if (isMounted && data) {
          setSalonDetails(data);
          const activeSrvs = data.services || [];
          if (initialService && activeSrvs.some((s) => s.id === initialService.id)) {
            setSelectedServiceId(initialService.id);
          } else if (activeSrvs.length > 0) {
            setSelectedServiceId(activeSrvs[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load salon details for booking:', err);
          setErrorMessage('Could not load salon services.');
        }
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    }

    loadSalonData();
    return () => {
      isMounted = false;
    };
  }, [salon.id, initialService]);

  // Compute active service object
  const activeService = useMemo(() => {
    const list = salonDetails?.services || [];
    return list.find((s) => s.id === selectedServiceId) || list[0] || initialService;
  }, [salonDetails, selectedServiceId, initialService]);

  // 2. Fetch real-time available slots whenever date, service, or staff changes
  const loadAvailableSlots = useCallback(async () => {
    if (!salon?.id || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const duration = activeService?.durationMinutes || 30;
      const res = await salonClient.fetchAvailableSlots(salon.id, selectedDate, duration, selectedStaffId);
      if (res && res.slots) {
        setSlots(res.slots);
        const firstOpen = res.slots.find((s) => s.available);
        if (firstOpen) {
          setSelectedTime(firstOpen.time);
        } else {
          setSelectedTime('');
        }
      } else {
        setSlots([]);
        setSelectedTime('');
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [salon?.id, selectedDate, activeService?.durationMinutes, selectedStaffId]);

  useEffect(() => {
    loadAvailableSlots();
  }, [loadAvailableSlots]);

  // 3. Handle appointment confirmation
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedTime) {
      setErrorMessage('Please select an available time slot.');
      return;
    }
    if (!activeService) {
      setErrorMessage('Please choose a valid service.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        salonId: salon.id, // Strictly locked to this salon
        serviceIds: [activeService.id],
        staffId: selectedStaffId || null,
        date: selectedDate,
        time: selectedTime,
        notes: notes ? notes.trim() : '',
        customerName: customerName.trim() || currentUser?.name || 'Customer',
        customerPhone: customerPhone.trim() || currentUser?.phone || '',
        customerEmail: currentUser?.email || '',
        paymentMethod: paymentChoice === 'online' ? 'PayU' : 'Pay at Salon'
      };

      const res = await salonClient.bookCustomerAppointment(payload);
      if (res && res.success && res.appointment) {
        const bookedApt = res.appointment;

        if (paymentChoice === 'online') {
          // Launch PayU Official Hosted Checkout in Test Mode
          try {
            await paymentClient.openCheckout({
              appointment: bookedApt,
              returnUrl: `/customer/home?tab=appointments${salon?.id ? `&salonId=${salon.id}` : ''}`
            });
            // The browser will redirect to PayU Hosted Checkout automatically
          } catch (checkoutErr) {
            console.error('[BookingModal] PayU checkout launch error:', checkoutErr);
            setPaymentNotice('Could not redirect to PayU. Your appointment slot is reserved with payment pending.');
            setConfirmedBooking({
              appointment: bookedApt,
              salonName: salon.name,
              serviceName: activeService.name,
              date: selectedDate,
              time: selectedTime,
              price: activeService.price,
              duration: activeService.durationMinutes || 30,
              paymentVerified: false
            });
            if (onBookingSuccess) onBookingSuccess(bookedApt);
          }
        } else {
          // Pay at Salon
          setConfirmedBooking({
            appointment: bookedApt,
            salonName: salon.name,
            serviceName: activeService.name,
            date: selectedDate,
            time: selectedTime,
            price: activeService.price,
            duration: activeService.durationMinutes || 30,
            paymentVerified: false
          });
          if (onBookingSuccess) onBookingSuccess(bookedApt);
        }
      } else {
        setErrorMessage(res?.message || 'Failed to confirm booking.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setErrorMessage(err.message || 'An error occurred during booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const coverImage = (Array.isArray(salon.gallery) && salon.gallery.length > 0)
    ? salon.gallery[0]
    : salon.logo;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#CBD5E1] my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0EA5E9] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Book Appointment</h3>
              <p className="text-[11px] text-[#64748B]">Real-time verified slot in IST</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#94A3B8] hover:text-[#334155] hover:bg-[#E2E8F0] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* SUCCESS SCREEN */}
          {confirmedBooking ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50 animate-bounce">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-[#111827]">Booking Confirmed!</h3>
                <p className="text-xs text-[#64748B]">
                  Your appointment has been successfully scheduled with the salon.
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 text-xs space-y-2.5 text-left">
                <div className="flex justify-between pb-2 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Salon:</span>
                  <strong className="text-[#111827]">{confirmedBooking.salonName}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Service:</span>
                  <strong className="text-[#111827]">{confirmedBooking.serviceName}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Date & Time:</span>
                  <strong className="text-[#0EA5E9]">
                    {confirmedBooking.date} at {confirmedBooking.time}
                  </strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Estimated Duration:</span>
                  <span className="text-[#334155] font-semibold">{confirmedBooking.duration} mins</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Total Amount:</span>
                  <strong className="text-emerald-700 font-bold">₹{confirmedBooking.price}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Payment Status:</span>
                  {confirmedBooking.paymentVerified ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                      <ShieldCheck size={12} className="text-emerald-600" />
                      Paid via Razorpay (Test)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] border border-amber-200">
                      Payment Pending (Pay at Salon)
                    </span>
                  )}
                </div>
                {confirmedBooking.razorpayPaymentId && (
                  <div className="flex justify-between pb-2 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Payment Ref:</span>
                    <strong className="text-[#111827] font-mono text-[11px]">
                      #{confirmedBooking.razorpayPaymentId}
                    </strong>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="text-[#64748B]">Booking Ref:</span>
                  <strong className="text-[#111827] font-mono">
                    #{confirmedBooking.appointment.id.slice(-6).toUpperCase()}
                  </strong>
                </div>
              </div>

              {paymentNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 text-left">
                  {paymentNotice}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* BOOKING FORM */
            <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Locked Salon Card Preview (Zero Ambiguity) */}
              <div className="p-3.5 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#E0F2FE] overflow-hidden shrink-0 border border-[#BAE6FD]">
                  {coverImage ? (
                    <img src={coverImage} alt={salon.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#0284C7] font-bold">
                      {salon.name?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284C7]">Selected Salon</span>
                    <ShieldCheck size={13} className="text-[#0EA5E9]" />
                  </div>
                  <h4 className="text-xs font-bold text-[#111827] truncate">{salon.name}</h4>
                  <p className="text-[11px] text-[#64748B] truncate flex items-center gap-1">
                    <MapPin size={10} /> {salon.city || salon.address || 'Mumbai'}
                  </p>
                </div>
              </div>

              {/* Step 2: Select Service belonging to this salon */}
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Select Service</label>
                {loadingDetails ? (
                  <div className="p-2.5 bg-[#F8FAFC] border rounded-lg text-[#64748B] text-xs">
                    Loading services...
                  </div>
                ) : (
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] bg-white font-medium"
                    required
                  >
                    {salonDetails?.services?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — ₹{s.price} ({s.durationMinutes || 30} mins)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Step 3: Preferred Stylist (Scoped to this salon) */}
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Preferred Stylist (Optional)</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] bg-white"
                >
                  <option value="">Any Available Master Stylist</option>
                  {salonDetails?.staff?.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.role || 'Stylist'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 4: Appointment Date */}
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Appointment Date (IST)</label>
                <input
                  type="date"
                  required
                  min={getTodayStr()}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] bg-white font-medium"
                />
              </div>

              {/* Step 5: Real-time Slot Availability */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-[#334155]">Available Time Slots</label>
                  <span className="text-[11px] text-[#64748B]">
                    {loadingSlots ? 'Checking slots...' : `${slots.filter((s) => s.available).length} slots open`}
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="p-5 text-center text-[#64748B] flex items-center justify-center gap-2 border border-dashed rounded-xl">
                    <RefreshCw size={14} className="animate-spin text-[#0EA5E9]" />
                    <span>Checking real-time calendar...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-center text-xs">
                    No time slots available for this date. The salon may be closed or fully booked.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-[#F1F5F9] rounded-xl">
                    {slots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center ${
                          !slot.available
                            ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed line-through opacity-60'
                            : selectedTime === slot.time
                            ? 'bg-[#0EA5E9] text-white shadow-sm ring-2 ring-[#0EA5E9]/30'
                            : 'bg-white hover:bg-[#F0F9FF] text-[#334155] border border-[#E2E8F0] hover:border-[#0EA5E9]'
                        }`}
                        title={slot.reason || slot.time}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 6: Payment Method Option */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#334155] flex items-center gap-1.5">
                    <CreditCard size={13} className="text-[#0EA5E9]" />
                    <span>Payment Method</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    PayU Test Mode
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => setPaymentChoice('online')}
                    className={`cursor-pointer p-3 rounded-xl border transition-all ${
                      paymentChoice === 'online'
                        ? 'border-[#0EA5E9] bg-[#F0F9FF] ring-2 ring-[#0EA5E9]/20 shadow-sm'
                        : 'border-[#CBD5E1] bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#0EA5E9]" />
                        Pay Online
                      </span>
                      <span className="text-[9px] font-bold uppercase text-[#0284C7] bg-[#E0F2FE] px-1.5 py-0.5 rounded">
                        PayU
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B]">
                      UPI, Cards & NetBanking via official PayU checkout.
                    </p>
                  </div>

                  <div
                    onClick={() => setPaymentChoice('counter')}
                    className={`cursor-pointer p-3 rounded-xl border transition-all ${
                      paymentChoice === 'counter'
                        ? 'border-[#0EA5E9] bg-[#F0F9FF] ring-2 ring-[#0EA5E9]/20 shadow-sm'
                        : 'border-[#CBD5E1] bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                        <Wallet size={14} className="text-[#64748B]" />
                        Pay at Salon
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B]">
                      Pay cash or UPI at the salon counter.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 7: Summary Breakdown */}
              {activeService && (
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Service Price:</span>
                    <strong className="text-[#111827]">₹{activeService.price}</strong>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Estimated Duration:</span>
                    <span>{activeService.durationMinutes || 30} mins</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Payment Option:</span>
                    <span className="font-semibold text-[#111827]">
                      {paymentChoice === 'online' ? 'PayU Hosted Checkout (Test)' : 'Pay at Salon Reception'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#64748B] pt-1.5 border-t border-[#F1F5F9]">
                    <span className="font-bold text-[#111827]">Total Amount:</span>
                    <strong className="text-sm font-extrabold text-[#0EA5E9]">₹{activeService.price}</strong>
                  </div>
                </div>
              )}

              {/* Customer Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] bg-white font-medium"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Special Instructions (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Skin sensitivity, specific haircut style"
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9] bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedTime || !activeService}
                  className="btn-lift px-5 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-[#94A3B8] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>{paymentChoice === 'online' ? 'Redirecting to PayU...' : 'Confirming...'}</span>
                    </>
                  ) : paymentChoice === 'online' ? (
                    <>
                      <ShieldCheck size={14} />
                      <span>Pay ₹{activeService?.price || 0} via PayU</span>
                    </>
                  ) : (
                    <>
                      <Calendar size={13} />
                      <span>Confirm Booking</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
