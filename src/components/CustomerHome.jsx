import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  LogOut,
  Store,
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
  Star,
  Scissors,
  Filter,
  Heart,
  ChevronRight,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Plus,
  CreditCard,
  ShieldCheck,
  Receipt,
  Wallet,
  Check
} from 'lucide-react';
import { authClient } from '../services/authClient';
import { salonClient } from '../services/salonClient';
import { paymentClient } from '../services/paymentClient';
import CustomerSearchBar from './customer/CustomerSearchBar';
import CustomerCategoryPills from './customer/CustomerCategoryPills';
import SalonCard from './customer/SalonCard';
import SalonDetailsView from './customer/SalonDetailsView';
import BookingModal from './customer/BookingModal';

function getTodayStr() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export default function CustomerHome({ onNavigate }) {
  const [currentUser, setCurrentUser] = useState(() => authClient.getStoredUser() || {
    name: 'Customer',
    phone: '+91 98765 43210',
    roles: ['customer'],
    activeRole: 'customer'
  });

  // Main View Navigation
  const [activeMainTab, setActiveMainTab] = useState('discovery'); // 'discovery' | 'appointments' | 'favorites' | 'payments'
  const [viewingSalonId, setViewingSalonId] = useState(null);

  // PayU Payment States
  const [payingAptId, setPayingAptId] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [minRating, setMinRating] = useState('');
  const [openOnly, setOpenOnly] = useState(false);

  // Salons & Customer Data
  const [salons, setSalons] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queueInfo, setQueueInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Booking Modal State (Explicitly locked to target salon & service)
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingSalon, setBookingSalon] = useState(null);
  const [bookingService, setBookingService] = useState(null);

  // Queue Modal State
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queueSalon, setQueueSalon] = useState(null);

  // Reschedule & Cancel Modals State
  const [cancelModalApt, setCancelModalApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [rescheduleApt, setRescheduleApt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(getTodayStr());
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Review Modal State
  const [reviewModalApt, setReviewModalApt] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 1. Load Salons from DB with active filters
  const loadSalons = useCallback(async () => {
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedLocation && selectedLocation !== 'All Locations') params.city = selectedLocation;
      if (selectedCategory) params.category = selectedCategory;
      if (minRating) params.minRating = minRating;
      if (openOnly) params.openOnly = 'true';
      if (sortBy) params.sortBy = sortBy;

      const res = await salonClient.fetchCustomerSalons(params);
      if (res && res.salons) {
        setSalons(res.salons);
      }
    } catch (err) {
      console.error('[CustomerHome] Error loading salons:', err);
    }
  }, [searchQuery, selectedLocation, selectedCategory, minRating, openOnly, sortBy]);

  // 2. Initial Data Load
  const loadInitialData = useCallback(async () => {
    setRefreshing(true);
    try {
      const u = await authClient.fetchSession();
      if (u) setCurrentUser(u);

      const [salonsRes, aptsRes, favsRes, recentRes] = await Promise.all([
        salonClient.fetchCustomerSalons().catch((err) => {
          console.error('[CustomerHome] fetchCustomerSalons error:', err);
          return { salons: [] };
        }),
        salonClient.fetchCustomerAppointments().catch((err) => {
          console.error('[CustomerHome] fetchCustomerAppointments error:', err);
          return { appointments: [] };
        }),
        salonClient.fetchFavorites().catch(() => ({ favorites: [] })),
        salonClient.fetchRecentlyViewed().catch(() => ({ recentlyViewed: [] }))
      ]);

      if (salonsRes?.salons) setSalons(salonsRes.salons);
      if (aptsRes?.appointments) setAppointments(aptsRes.appointments);
      if (favsRes?.favorites) {
        setFavorites(favsRes.favorites.map((s) => (typeof s === 'string' ? s : s.id)));
      }
      if (recentRes?.recentlyViewed) setRecentlyViewed(recentRes.recentlyViewed);

      // Load payment receipts
      try {
        const hist = await paymentClient.fetchCustomerPaymentHistory();
        setPaymentHistory(hist || []);
      } catch (err) {
        console.warn('[CustomerHome] Payment history fetch error:', err);
      }
    } catch (err) {
      console.error('[CustomerHome] Error loading initial data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadPaymentHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const hist = await paymentClient.fetchCustomerPaymentHistory();
      setPaymentHistory(hist || []);
    } catch (err) {
      console.warn('[CustomerHome] loadPaymentHistory error:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Listen for official PayU Hosted Checkout redirect callbacks
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const salonParam = params.get('salonId');
      const paymentStatus = params.get('payment');
      const txnid = params.get('txnid');
      const appointmentId = params.get('appointmentId');
      const amount = params.get('amount');
      const errorMsg = params.get('error');

      // CRITICAL: Stay on the exact page/tab where customer started or clicked pay!
      if (tabParam === 'appointments' || tabParam === 'payments' || tabParam === 'favorites' || tabParam === 'discovery') {
        setActiveMainTab(tabParam);
      }
      if (salonParam) {
        setViewingSalonId(salonParam);
      }

      if (paymentStatus === 'success') {
        showToast(`Payment of ₹${amount || ''} verified successfully via PayU!`);
        if (appointmentId) {
          setAppointments((prev) =>
            prev.map((a) =>
              a.id === appointmentId
                ? {
                    ...a,
                    paymentStatus: 'paid',
                    paymentMethod: 'PayU',
                    payuTxnId: txnid
                  }
                : a
            )
          );
        }
        loadInitialData();

        const preserveParams = new URLSearchParams();
        if (tabParam) preserveParams.set('tab', tabParam);
        if (salonParam) preserveParams.set('salonId', salonParam);
        const cleanQuery = preserveParams.toString() ? `?${preserveParams.toString()}` : '';
        const targetPath = window.location.pathname === '/' ? '/customer/home' : window.location.pathname;
        window.history.replaceState({}, document.title, `${targetPath}${cleanQuery}`);
      } else if (paymentStatus === 'failed') {
        showToast(`Payment was not completed: ${errorMsg || 'Declined or cancelled on PayU'}`);
        loadInitialData();

        const preserveParams = new URLSearchParams();
        if (tabParam) preserveParams.set('tab', tabParam);
        if (salonParam) preserveParams.set('salonId', salonParam);
        const cleanQuery = preserveParams.toString() ? `?${preserveParams.toString()}` : '';
        const targetPath = window.location.pathname === '/' ? '/customer/home' : window.location.pathname;
        window.history.replaceState({}, document.title, `${targetPath}${cleanQuery}`);
      }
    } catch (e) {
      console.warn('Error reading PayU callback url:', e);
    }
  }, [loadInitialData]);

  useEffect(() => {
    if (activeMainTab === 'payments') {
      loadPaymentHistory();
    }
  }, [activeMainTab, loadPaymentHistory]);

  // Reload salons when filter state changes
  useEffect(() => {
    loadSalons();
  }, [loadSalons]);

  // Load Reschedule Slots
  const loadRescheduleSlots = useCallback(async (salonId, date) => {
    if (!salonId || !date) return;
    try {
      const res = await salonClient.fetchAvailableSlots(salonId, date, 30, null);
      if (res?.slots) {
        setRescheduleSlots(res.slots);
        const firstAvail = res.slots.find((s) => s.available);
        if (firstAvail) setRescheduleTime(firstAvail.time);
      }
    } catch (err) {
      console.error('[CustomerHome] Error loading reschedule slots:', err);
    }
  }, []);

  useEffect(() => {
    if (rescheduleApt && rescheduleDate) {
      loadRescheduleSlots(rescheduleApt.salonId, rescheduleDate);
    }
  }, [rescheduleApt, rescheduleDate, loadRescheduleSlots]);

  // Extract unique locations from current salons
  const availableLocations = useMemo(() => {
    const locs = salons.map((s) => s.city).filter(Boolean);
    return Array.from(new Set(locs));
  }, [salons]);

  // 3. User Actions & Handlers
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

  // Toggle Favorite
  const handleToggleFavorite = async (salonId) => {
    try {
      const res = await salonClient.toggleFavorite(salonId);
      if (res && res.success) {
        setFavorites(res.favorites || []);
        showToast(res.isFavorite ? 'Saved to Favorites' : 'Removed from Favorites');
      }
    } catch {
      // Local fallback for offline/guest
      setFavorites((prev) =>
        prev.includes(salonId) ? prev.filter((id) => id !== salonId) : [...prev, salonId]
      );
    }
  };

  // Dedicated Open Booking Modal for a specific salon & service
  const handleOpenBooking = (salon, service = null) => {
    if (!salon) return;
    setBookingSalon(salon);
    setBookingService(service);
    setIsBookModalOpen(true);
  };

  // Handle successful booking
  const handleBookingSuccess = (newApt) => {
    setAppointments((prev) => [newApt, ...prev]);
    showToast(`Appointment booked successfully at ${newApt.salonName || 'Salon'}!`);
  };

  // Cancellation handler
  const handleConfirmCancelAppointment = async () => {
    if (!cancelModalApt) return;
    setCancelLoading(true);
    try {
      const res = await salonClient.cancelCustomerAppointment(cancelModalApt.id, cancelReason);
      if (res?.appointment) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === cancelModalApt.id ? res.appointment : a))
        );
        showToast('Appointment successfully cancelled.');
        setCancelModalApt(null);
        setCancelReason('');
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelLoading(false);
    }
  };

  // PayU Pay Now Handler for unpaid appointments
  const handlePayNow = async (apt) => {
    if (!apt || !apt.id) return;
    setPayingAptId(apt.id);
    try {
      // Preserve originating location: stay on the exact active tab and salon page
      const currentTab = activeMainTab || 'appointments';
      const salonQuery = (viewingSalonId || apt.salonId) ? `&salonId=${viewingSalonId || apt.salonId}` : '';
      const returnUrl = `/customer/home?tab=${currentTab}${salonQuery}`;

      // Redirects customer directly to PayU's Official Hosted Checkout
      await paymentClient.openCheckout({
        appointment: apt,
        returnUrl
      });
      // The browser redirects immediately to PayU hosted checkout
    } catch (err) {
      console.error('[CustomerHome] Pay Now error:', err);
      showToast(`Payment error: ${err.message}`);
    } finally {
      setPayingAptId(null);
    }
  };

  // Reschedule handler
  const handleConfirmReschedule = async () => {
    if (!rescheduleApt || !rescheduleTime) {
      alert('Please select an available slot to reschedule.');
      return;
    }
    setRescheduleLoading(true);
    try {
      const res = await salonClient.rescheduleCustomerAppointment(
        rescheduleApt.id,
        rescheduleDate,
        rescheduleTime,
        null
      );
      if (res?.appointment) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === rescheduleApt.id ? res.appointment : a))
        );
        showToast(`Appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}.`);
        setRescheduleApt(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to reschedule appointment.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalApt) return;
    setReviewLoading(true);
    try {
      const res = await salonClient.submitCustomerReview({
        salonId: reviewModalApt.salonId,
        appointmentId: reviewModalApt.id,
        rating: reviewRating,
        comment: reviewComment
      });
      if (res?.review) {
        showToast('Thank you! Your verified review has been posted.');
        setReviewModalApt(null);
        setReviewComment('');
        loadSalons();
        salonClient.fetchCustomerAppointments().then((r) => r?.appointments && setAppointments(r.appointments));
      }
    } catch (err) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Queue check-in
  const handleJoinQueue = async () => {
    if (!queueSalon) return;
    try {
      const res = await salonClient.joinCustomerQueue({
        salonId: queueSalon.id,
        customerName: currentUser?.name || 'Customer',
        customerPhone: currentUser?.phone || '',
        notes: 'Customer online check-in'
      });
      if (res?.entry) {
        alert(`You are in line at ${queueSalon.name}! Position #${res.entry.position}. Estimated wait: ~${res.entry.estimatedWaitMinutes} mins.`);
        setIsQueueModalOpen(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to join queue.');
    }
  };

  const displayName = currentUser?.name || 'Customer';
  const displayInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  // Computed subsets of salons
  const recommendedSalons = useMemo(() => {
    return [...salons]
      .filter((s) => (s.rating || 5) >= 4.0 || salons.length <= 4)
      .sort((a, b) => (b.rating || 5) - (a.rating || 5))
      .slice(0, 6);
  }, [salons]);

  const nearbySalons = useMemo(() => {
    if (selectedLocation === 'All Locations') return salons.slice(0, 4);
    return salons.filter((s) => s.city && s.city.toLowerCase().includes(selectedLocation.toLowerCase()));
  }, [salons, selectedLocation]);

  const favoriteSalonsList = useMemo(() => {
    return salons.filter((s) => favorites.includes(s.id));
  }, [salons, favorites]);

  const nextAppointment = useMemo(() => {
    return appointments.find((a) => ['in_service', 'arrived', 'confirmed', 'pending'].includes(a.status));
  }, [appointments]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#111827] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={16} className="text-[#38BDF8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Global Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setViewingSalonId(null);
                setActiveMainTab('discovery');
              }}
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0EA5E9] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <span className="font-bold text-base tracking-tight">U</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-[#111827]">
                UPLOOKZ<span className="text-[#0EA5E9]">.</span>
              </span>
            </button>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
              Customer Portal
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => {
                setViewingSalonId(null);
                setActiveMainTab('discovery');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeMainTab === 'discovery' && !viewingSalonId
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9]'
              }`}
            >
              Discover Salons
            </button>

            <button
              onClick={() => {
                setViewingSalonId(null);
                setActiveMainTab('appointments');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeMainTab === 'appointments'
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9]'
              }`}
            >
              <span>My Bookings</span>
              {appointments.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center">
                  {appointments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setViewingSalonId(null);
                setActiveMainTab('favorites');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeMainTab === 'favorites'
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9]'
              }`}
            >
              <Heart size={13} className={favorites.length > 0 ? 'text-red-500 fill-red-500' : ''} />
              <span>Saved Salons ({favorites.length})</span>
            </button>

            <button
              onClick={() => {
                setViewingSalonId(null);
                setActiveMainTab('payments');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeMainTab === 'payments'
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9]'
              }`}
            >
              <Receipt size={13} />
              <span>Payments ({paymentHistory.length})</span>
            </button>
          </nav>

          {/* User Controls & Switch Role */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSwitchToSalon}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0EA5E9] bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] px-3 py-1.5 rounded-xl transition-all"
              title="Switch to Salon Owner Dashboard"
            >
              <Store size={14} />
              <span className="hidden sm:inline">Switch to</span> Salon Mode
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-xs">
                {displayInitials}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-[#111827] leading-tight">{displayName}</p>
                <p className="text-[11px] text-[#64748B] leading-tight">{currentUser?.phone || 'Customer'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-[#64748B] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden flex items-center justify-around border-t border-[#F1F5F9] px-2 py-2 bg-white text-xs">
          <button
            onClick={() => {
              setViewingSalonId(null);
              setActiveMainTab('discovery');
            }}
            className={`font-semibold py-1 px-2.5 rounded-lg ${
              activeMainTab === 'discovery' && !viewingSalonId ? 'text-[#0EA5E9] bg-[#F0F9FF]' : 'text-[#64748B]'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => {
              setViewingSalonId(null);
              setActiveMainTab('appointments');
            }}
            className={`font-semibold py-1 px-2.5 rounded-lg ${
              activeMainTab === 'appointments' ? 'text-[#0EA5E9] bg-[#F0F9FF]' : 'text-[#64748B]'
            }`}
          >
            Bookings ({appointments.length})
          </button>
          <button
            onClick={() => {
              setViewingSalonId(null);
              setActiveMainTab('favorites');
            }}
            className={`font-semibold py-1 px-2.5 rounded-lg ${
              activeMainTab === 'favorites' ? 'text-[#0EA5E9] bg-[#F0F9FF]' : 'text-[#64748B]'
            }`}
          >
            Favorites ({favorites.length})
          </button>
          <button
            onClick={() => {
              setViewingSalonId(null);
              setActiveMainTab('payments');
            }}
            className={`font-semibold py-1 px-2.5 rounded-lg ${
              activeMainTab === 'payments' ? 'text-[#0EA5E9] bg-[#F0F9FF]' : 'text-[#64748B]'
            }`}
          >
            Receipts ({paymentHistory.length})
          </button>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* VIEW 1: DEDICATED SALON DETAILS PAGE */}
        {viewingSalonId ? (
          <SalonDetailsView
            salonId={viewingSalonId}
            onBack={() => setViewingSalonId(null)}
            onBookSalon={(s) => handleOpenBooking(s, null)}
            onBookService={(s, srv) => handleOpenBooking(s, srv)}
            onJoinQueue={(s) => {
              setQueueSalon(s);
              setIsQueueModalOpen(true);
            }}
            isFavorite={favorites.includes(viewingSalonId)}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : activeMainTab === 'appointments' ? (
          /* VIEW 2: MY APPOINTMENTS & PAST VISITS */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-xl font-bold text-[#111827]">My Bookings & Visit History</h2>
                <p className="text-xs text-[#64748B]">Real-time status of your scheduled appointments</p>
              </div>
              <button
                onClick={() => setActiveMainTab('discovery')}
                className="px-4 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Book New Appointment</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 shadow-clean">
                <div className="w-12 h-12 rounded-full bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center mx-auto">
                  <Calendar size={24} />
                </div>
                <h3 className="text-base font-bold text-[#111827]">No Appointments Yet</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Discover verified salons around you, choose your preferred stylist, and book your first appointment with zero hassle.
                </p>
                <button
                  onClick={() => setActiveMainTab('discovery')}
                  className="px-4 py-2 rounded-xl bg-[#0EA5E9] text-white text-xs font-semibold"
                >
                  Explore Salons Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => {
                  const isUpcoming = apt.status === 'confirmed' || apt.status === 'pending';
                  const isArrived = apt.status === 'arrived';
                  const isInService = apt.status === 'in_service';
                  const isCompleted = apt.status === 'completed';
                  const isCancelled = apt.status === 'cancelled';

                  return (
                    <div
                      key={apt.id}
                      className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean hover:shadow-clean-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center shrink-0 border border-[#BAE6FD]">
                          <Scissors size={20} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-[#111827]">{apt.salonName || 'Salon Partner'}</h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isArrived
                                  ? 'bg-[#FDF4FF] text-[#C026D3] border border-[#F5D0FE]'
                                  : isInService
                                  ? 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
                                  : isUpcoming
                                  ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                                  : isCompleted
                                  ? 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {isArrived ? 'Arrived / Checked In' : isInService ? 'In Progress' : apt.status}
                            </span>

                            {/* Payment Status Badge */}
                            {apt.paymentStatus === 'paid' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                                <ShieldCheck size={11} className="text-[#059669]" />
                                Paid ({apt.paymentMethod || 'PayU'})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Payment Pending
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-[#334155]">
                            {apt.serviceNames?.join(', ') || 'Grooming Service'}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                            <span className="flex items-center gap-1">
                              <Calendar size={13} className="text-[#94A3B8]" />
                              {apt.date} at {apt.time}
                            </span>
                            {apt.staffName && (
                              <span className="flex items-center gap-1">
                                <Clock size={13} className="text-[#94A3B8]" />
                                Stylist: {apt.staffName}
                              </span>
                            )}
                            <span className="font-bold text-[#111827]">₹{apt.totalAmount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Appointment Actions */}
                      <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#F1F5F9] flex-wrap">
                        {/* Prominent PayU Pay Now button for unpaid appointments */}
                        {apt.paymentStatus !== 'paid' && apt.status !== 'cancelled' && (
                          <button
                            onClick={() => handlePayNow(apt)}
                            disabled={payingAptId === apt.id}
                            className="btn-lift inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-[#94A3B8] text-white text-xs font-bold shadow-sm transition-all"
                            title="Pay online via PayU Hosted Checkout (Test Mode)"
                          >
                            {payingAptId === apt.id ? (
                              <>
                                <RefreshCw size={12} className="animate-spin" />
                                <span>Redirecting to PayU...</span>
                              </>
                            ) : (
                              <>
                                <CreditCard size={12} />
                                <span>Pay ₹{apt.totalAmount} Now</span>
                              </>
                            )}
                          </button>
                        )}

                        {apt.paymentStatus === 'paid' && (apt.payuPaymentId || apt.payuTxnId || apt.razorpayPaymentId) && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-[#059669] bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                            Ref: #{(apt.payuPaymentId || apt.payuTxnId || apt.razorpayPaymentId).slice(-8)}
                          </span>
                        )}

                        {isUpcoming && (
                          <>
                            <button
                              onClick={() => {
                                setRescheduleApt(apt);
                                setRescheduleDate(apt.date || getTodayStr());
                                setRescheduleTime('');
                              }}
                              className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] text-xs font-semibold transition-all"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => {
                                setCancelModalApt(apt);
                                setCancelReason('');
                              }}
                              className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {isCompleted && (
                          <button
                            onClick={() => {
                              setReviewModalApt(apt);
                              setReviewRating(5);
                              setReviewComment('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold transition-all"
                          >
                            <Star size={13} className="fill-amber-500 text-amber-500" />
                            <span>Write Verified Review</span>
                          </button>
                        )}

                        <span className="text-[11px] font-mono text-[#94A3B8] ml-2">
                          #{apt.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeMainTab === 'favorites' ? (
          /* VIEW 3: SAVED FAVORITE SALONS */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-xl font-bold text-[#111827]">Saved Salons</h2>
                <p className="text-xs text-[#64748B]">Your favorite grooming destinations for quick rebooking</p>
              </div>
            </div>

            {favoriteSalonsList.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 shadow-clean">
                <Heart size={32} className="text-[#CBD5E1] mx-auto" />
                <h3 className="text-base font-bold text-[#111827]">No Saved Salons</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Click the heart icon on any salon discovery card to save it to your favorites list for instant access.
                </p>
                <button
                  onClick={() => setActiveMainTab('discovery')}
                  className="px-4 py-2 rounded-xl bg-[#0EA5E9] text-white text-xs font-semibold"
                >
                  Explore Salons
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteSalonsList.map((salon) => (
                  <SalonCard
                    key={salon.id}
                    salon={salon}
                    isFavorite={true}
                    onToggleFavorite={handleToggleFavorite}
                    onViewSalon={(id) => setViewingSalonId(id)}
                    onBookAppointment={(s) => handleOpenBooking(s, null)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeMainTab === 'payments' ? (
          /* VIEW 4: PAYMENT RECEIPTS & HISTORY */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-xl font-bold text-[#111827]">Payment Receipts & History</h2>
                <p className="text-xs text-[#64748B]">
                  Verified PayU transaction records and payment receipts
                </p>
              </div>
              <button
                onClick={loadPaymentHistory}
                disabled={loadingHistory}
                className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingHistory ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center text-xs text-[#64748B]">
                <RefreshCw size={18} className="animate-spin text-[#0EA5E9] mx-auto mb-2" />
                Loading your payment receipts...
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 shadow-clean">
                <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto border border-[#A7F3D0]">
                  <Receipt size={24} />
                </div>
                <h3 className="text-base font-bold text-[#111827]">No Payment Receipts Yet</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  When you complete an online payment via PayU or record a salon visit, your verified receipts will appear here.
                </p>
                <button
                  onClick={() => setActiveMainTab('appointments')}
                  className="px-4 py-2 rounded-xl bg-[#0EA5E9] text-white text-xs font-semibold"
                >
                  View My Bookings
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentHistory.map((txn) => (
                  <div
                    key={txn.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean hover:shadow-clean-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 border border-[#A7F3D0]">
                        <Receipt size={20} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#111827]">{txn.salonName}</h4>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            <ShieldCheck size={11} />
                            Verified ({txn.paymentMethod || 'PayU'})
                          </span>
                        </div>
                        <p className="text-xs text-[#475569]">
                          {txn.serviceNames?.join(', ') || 'Salon Service Visit'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-[#64748B] flex-wrap">
                          <span>{txn.date || txn.appointmentDate}</span>
                          {(txn.payuPaymentId || txn.payuTxnId || txn.razorpayPaymentId) && (
                            <span className="font-mono text-[10px] text-[#0284C7] bg-[#F0F9FF] px-2 py-0.5 rounded border border-[#BAE6FD]">
                              Payment ID: #{txn.payuPaymentId || txn.payuTxnId || txn.razorpayPaymentId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:border-[#F1F5F9] sm:pl-6">
                      <div className="text-base font-extrabold text-emerald-700">₹{txn.amount}</div>
                      <div className="text-[10px] text-[#64748B] font-mono">
                        Ref: #{txn.bookingReference?.slice(-6).toUpperCase() || txn.id.slice(-6).toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* VIEW 4: SALON DISCOVERY & EXPLORE HOME */
          <div className="space-y-8">
            {/* Top Search Bar & Location Selector */}
            <div className="space-y-3">
              <CustomerSearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchSubmit={loadSalons}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                availableLocations={availableLocations}
                onSelectSalon={(id) => setViewingSalonId(id)}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                onSelectService={(srv) => {
                  const targetSalon = salons.find((s) => s.id === srv.salonId);
                  if (targetSalon) handleOpenBooking(targetSalon, srv);
                }}
              />

              {/* Popular Category Chips */}
              <CustomerCategoryPills
                activeCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>

            {/* Next Appointment Alert (if any upcoming) */}
            {nextAppointment && (
              <div className="bg-gradient-to-r from-[#F0F9FF] to-[#E0F2FE] border border-[#BAE6FD] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#0EA5E9] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Calendar size={20} />
                  </div>
                  <div className="space-y-1">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      nextAppointment.status === 'arrived'
                        ? 'bg-[#FDF4FF] text-[#C026D3] border-[#F5D0FE]'
                        : nextAppointment.status === 'in_service'
                        ? 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
                        : 'bg-white text-[#0284C7] border-[#BAE6FD]'
                    }`}>
                      {nextAppointment.status === 'arrived'
                        ? 'Checked In — Salon Notified'
                        : nextAppointment.status === 'in_service'
                        ? 'Service In Progress'
                        : 'Upcoming Scheduled Visit'}
                    </span>
                    <h4 className="text-sm font-bold text-[#111827]">
                      {nextAppointment.salonName || 'Salon Partner'} — {nextAppointment.serviceNames?.join(', ')}
                    </h4>
                    <p className="text-xs text-[#475569]">
                      Scheduled for <strong className="text-[#111827]">{nextAppointment.date} at {nextAppointment.time}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveMainTab('appointments')}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0284C7] border border-[#BAE6FD] text-xs font-semibold shadow-sm transition-all shrink-0"
                >
                  Manage Booking →
                </button>
              </div>
            )}

            {/* Sorting & Advanced Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#111827]">
                  {salons.length} Salons Available
                </span>
                {(selectedCategory || selectedLocation !== 'All Locations' || searchQuery || minRating || openOnly) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedLocation('All Locations');
                      setSelectedCategory('');
                      setMinRating('');
                      setOpenOnly(false);
                      setSortBy('relevance');
                    }}
                    className="text-xs text-[#0EA5E9] hover:underline font-medium ml-2"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                {/* Rating filter */}
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-[#334155] focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="">All Ratings</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                </select>

                {/* Open Now toggle */}
                <button
                  type="button"
                  onClick={() => setOpenOnly(!openOnly)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    openOnly
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {openOnly ? '✓ Open Now' : 'Open Now'}
                </button>

                {/* Sorting dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-[#334155] focus:outline-none focus:border-[#0EA5E9] font-medium"
                >
                  <option value="relevance">Sort: Recommended</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Salon Name</option>
                </select>
              </div>
            </div>

            {/* SECTION 1: RECOMMENDED SALONS (Top rated & verified) */}
            {!searchQuery && !selectedCategory && recommendedSalons.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#111827]">Recommended Salons</h3>
                    <p className="text-xs text-[#64748B]">Highest customer ratings and verified services</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedSalons.map((salon) => (
                    <SalonCard
                      key={salon.id}
                      salon={salon}
                      isFavorite={favorites.includes(salon.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onViewSalon={(id) => setViewingSalonId(id)}
                      onBookAppointment={(s) => handleOpenBooking(s, null)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: EXPLORE ALL SALONS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    {searchQuery ? `Search Results for "${searchQuery}"` : selectedCategory ? `${selectedCategory} Salons` : 'Explore All Salons'}
                  </h3>
                  <p className="text-xs text-[#64748B]">Real partner salons with instant booking</p>
                </div>
              </div>

              {loading ? (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 shadow-clean">
                  <div className="w-10 h-10 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-[#64748B]">Finding verified salons in your area...</p>
                </div>
              ) : salons.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 shadow-clean">
                  <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center mx-auto border border-[#BAE6FD]">
                    <Scissors size={24} />
                  </div>
                  {searchQuery || selectedCategory || selectedLocation !== 'All Locations' || minRating || openOnly ? (
                    <>
                      <h4 className="text-base font-bold text-[#111827]">No salons match your search</h4>
                      <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                        We couldn't find any salons matching your current filters. Try adjusting your search query or reset filters.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedLocation('All Locations');
                          setSelectedCategory('');
                          setMinRating('');
                          setOpenOnly(false);
                          setSortBy('relevance');
                        }}
                        className="px-4 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        Reset All Filters
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="text-base font-bold text-[#111827]">No salons available yet.</h4>
                      <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                        Be the first to register your salon.
                      </p>
                      <button
                        onClick={handleSwitchToSalon}
                        className="px-5 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-1.5"
                      >
                        <Plus size={15} />
                        <span>Register Your Salon</span>
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {salons.map((salon) => (
                    <SalonCard
                      key={salon.id}
                      salon={salon}
                      isFavorite={favorites.includes(salon.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onViewSalon={(id) => setViewingSalonId(id)}
                      onBookAppointment={(s) => handleOpenBooking(s, null)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. Dedicated Booking Modal (Locked strictly to selected salon) */}
      <BookingModal
        isOpen={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setBookingSalon(null);
          setBookingService(null);
        }}
        salon={bookingSalon}
        initialService={bookingService}
        currentUser={currentUser}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* 4. Live Queue Modal */}
      {isQueueModalOpen && queueSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center mx-auto">
              <Clock size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#111827]">
                {queueSalon.name} Live Queue
              </h3>
              <p className="text-xs text-[#64748B] mt-1">Walk-in priority check-in for today</p>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#64748B]">Waiting</span>
                <p className="text-xl font-bold text-amber-700 mt-0.5">
                  {queueSalon.liveQueue?.waitingCount || 0}
                </p>
              </div>
              <div>
                <span className="text-[#64748B]">Estimated Wait</span>
                <p className="text-xl font-bold text-[#111827] mt-0.5">
                  ~{queueSalon.liveQueue?.estimatedWaitMinutes || 0} mins
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleJoinQueue}
                className="btn-lift w-full py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm"
              >
                Join Walk-In Queue
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

      {/* 5. Cancel Appointment Modal */}
      {cancelModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Cancel Appointment?</h3>
                <p className="text-xs text-[#64748B]">{cancelModalApt.date} at {cancelModalApt.time}</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B]">
              Are you sure you want to cancel this booking? The slot will immediately become available to other clients.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Reason (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Schedule conflict, feeling unwell"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalApt(null)}
                className="px-3 py-2 text-xs text-[#64748B] hover:bg-[#F1F5F9] rounded-lg"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleConfirmCancelAppointment}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Reschedule Appointment Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Reschedule Appointment</h3>
                <p className="text-xs text-[#64748B]">Current: {rescheduleApt.date} at {rescheduleApt.time}</p>
              </div>
              <button onClick={() => setRescheduleApt(null)} className="p-1 text-[#94A3B8] hover:text-[#111827]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#334155] mb-1">New Date (IST)</label>
                <input
                  type="date"
                  min={getTodayStr()}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Choose New Available Slot</label>
                <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 border border-[#E2E8F0] rounded-xl">
                  {rescheduleSlots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setRescheduleTime(s.time)}
                      className={`py-1.5 px-1 rounded-lg text-xs font-semibold ${
                        rescheduleTime === s.time
                          ? 'bg-[#0EA5E9] text-white'
                          : s.available
                          ? 'bg-white hover:bg-[#F0F9FF] border border-[#CBD5E1]'
                          : 'bg-[#F8FAFC] text-[#94A3B8] line-through cursor-not-allowed'
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setRescheduleApt(null)}
                className="px-3 py-2 text-xs text-[#64748B] hover:bg-[#F1F5F9] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rescheduleLoading || !rescheduleTime}
                onClick={handleConfirmReschedule}
                className="px-4 py-2 text-xs font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg disabled:opacity-50"
              >
                {rescheduleLoading ? 'Updating...' : `Confirm (${rescheduleTime || 'Select Slot'})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Rate & Review Modal */}
      {reviewModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Rate Your Experience</h3>
                <p className="text-xs text-[#64748B]">{reviewModalApt.serviceNames?.join(', ')}</p>
              </div>
              <button onClick={() => setReviewModalApt(null)} className="p-1 text-[#94A3B8] hover:text-[#111827]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#334155] mb-1.5 text-center">Your Rating</label>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={24}
                        className={star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-[#CBD5E1]'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Share Your Feedback</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us about your haircut, the stylist's skill, and salon ambiance..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-2.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setReviewModalApt(null)}
                  className="px-3 py-2 text-xs text-[#64748B] hover:bg-[#F1F5F9] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="px-4 py-2 text-xs font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg disabled:opacity-50"
                >
                  {reviewLoading ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Professional Footer */}
      <footer className="py-8 border-t border-[#E2E8F0] bg-white text-center text-xs text-[#94A3B8] space-y-2">
        <p className="font-semibold text-[#64748B]">UPLOOKZ — Modern Salon Discovery & Appointment Platform</p>
        <p>© {new Date().getFullYear()} UPLOOKZ Technologies Pvt Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
