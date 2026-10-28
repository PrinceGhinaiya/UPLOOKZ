import React, { useState, useEffect, useCallback } from 'react';
import SalonHeader from './salon/SalonHeader';
import SalonSidebar from './salon/SalonSidebar';
import SalonOverviewTab from './salon/SalonOverviewTab';
import SalonAppointmentsTab from './salon/SalonAppointmentsTab';
import SalonQueueTab from './salon/SalonQueueTab';
import SalonCalendarTab from './salon/SalonCalendarTab';
import SalonServicesTab from './salon/SalonServicesTab';
import SalonStaffTab from './salon/SalonStaffTab';
import SalonCustomersTab from './salon/SalonCustomersTab';
import SalonAnalyticsTab from './salon/SalonAnalyticsTab';
import SalonReviewsTab from './salon/SalonReviewsTab';
import SalonProfileTab from './salon/SalonProfileTab';
import SalonSettingsTab from './salon/SalonSettingsTab';
import SalonOnboardingWizard from './salon/SalonOnboardingWizard';
import {
  NewAppointmentModal,
  AddWalkInModal,
  ServiceModal,
  RescheduleModal
} from './salon/SalonModals';
import { salonClient } from '../services/salonClient';
import { authClient } from '../services/authClient';

export default function SalonDashboard({ onNavigate }) {
  // Current user & authentication
  const [currentUser, setCurrentUser] = useState(() => authClient.getStoredUser() || {
    name: 'Rahul Sharma',
    salonName: 'Apex Studio & Grooming',
    phone: '+91 98765 01234',
    roles: ['salon'],
    activeRole: 'salon'
  });

  // Salon & Subsystem Data State
  const [salon, setSalon] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [reviewsData, setReviewsData] = useState({});
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Modals state
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isAddWalkInOpen, setIsAddWalkInOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);

  // Read URL search params on mount (e.g. ?tab=appointments)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Sync active tab to URL without full reload
  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Fetch all initial data from backend
  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Session user
      const u = await authClient.fetchSession();
      if (u) setCurrentUser(u);

      // 2. Salon profile
      const profRes = await salonClient.fetchProfile();
      if (profRes && profRes.salon) {
        setSalon(profRes.salon);
      }

      // 3. Parallel fetch core entities
      const [
        aptsRes,
        queueRes,
        servicesRes,
        staffRes,
        customersRes,
        analyticsRes,
        reviewsRes,
        blockedRes,
        notifsRes
      ] = await Promise.all([
        salonClient.fetchAppointments(),
        salonClient.fetchQueue(),
        salonClient.fetchServices(),
        salonClient.fetchStaff(),
        salonClient.fetchCustomers(),
        salonClient.fetchAnalytics('month'),
        salonClient.fetchReviews(),
        salonClient.fetchBlockedSlots(),
        salonClient.fetchNotifications()
      ]);

      if (aptsRes?.appointments) setAppointments(aptsRes.appointments);
      if (queueRes?.queue) setQueue(queueRes.queue);
      if (servicesRes?.services) setServices(servicesRes.services);
      if (staffRes?.staff) setStaff(staffRes.staff);
      if (customersRes?.customers) setCustomers(customersRes.customers);
      if (analyticsRes?.analytics) setAnalytics(analyticsRes.analytics);
      if (reviewsRes) setReviewsData(reviewsRes);
      if (blockedRes?.blockedSlots) setBlockedSlots(blockedRes.blockedSlots);
      if (notifsRes?.notifications) setNotifications(notifsRes.notifications);
    } catch (err) {
      console.error('[SalonDashboard] Error loading data:', err);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Periodic silent refresh every 15 seconds for live queue and appointment sync
  useEffect(() => {
    const timer = setInterval(() => {
      salonClient.fetchAppointments().then((res) => {
        if (res?.appointments) setAppointments(res.appointments);
      }).catch(() => {});
      salonClient.fetchQueue().then((res) => {
        if (res?.queue) setQueue(res.queue);
      }).catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // -----------------------------------------------------------
  // Action Handlers
  // -----------------------------------------------------------
  const handleCreateAppointment = async (formData) => {
    const res = await salonClient.createAppointment(formData);
    if (res?.appointment) {
      setAppointments((prev) => [res.appointment, ...prev]);
      // Refresh analytics
      salonClient.fetchAnalytics('month').then((a) => a?.analytics && setAnalytics(a.analytics));
    }
    return res;
  };

  const handleUpdateAppointmentStatus = async (id, status, notes = '') => {
    const res = await salonClient.updateAppointmentStatus(id, status, notes);
    if (res?.appointment) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? res.appointment : a))
      );
      salonClient.fetchAnalytics('month').then((a) => a?.analytics && setAnalytics(a.analytics));
    }
  };

  const handleRescheduleAppointment = async (id, rescheduleData) => {
    const res = await salonClient.rescheduleAppointment(id, rescheduleData);
    if (res?.appointment) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? res.appointment : a))
      );
    }
  };

  const handleAddWalkIn = async (walkInData) => {
    const res = await salonClient.addWalkIn(walkInData);
    if (res?.entry) {
      setQueue((prev) => [...prev, res.entry]);
      salonClient.fetchQueue().then((q) => q?.queue && setQueue(q.queue));
    }
  };

  const handleUpdateQueueStatus = async (id, status, reason = '') => {
    const res = await salonClient.updateQueueStatus(id, status, reason);
    if (res?.entry) {
      salonClient.fetchQueue().then((q) => q?.queue && setQueue(q.queue));
      salonClient.fetchAnalytics('month').then((a) => a?.analytics && setAnalytics(a.analytics));
    }
  };

  const handleReorderQueue = async (id, direction) => {
    const res = await salonClient.reorderQueue(id, direction);
    if (res?.queue) {
      setQueue((prev) => {
        const other = prev.filter((q) => q.status !== 'waiting');
        return [...other, ...res.queue];
      });
      salonClient.fetchQueue().then((q) => q?.queue && setQueue(q.queue));
    }
  };

  const handleAddService = async (serviceData) => {
    const res = await salonClient.addService(serviceData);
    if (res?.service) {
      setServices((prev) => [...prev, res.service]);
    }
  };

  const handleUpdateService = async (id, serviceData) => {
    const res = await salonClient.updateService(id, serviceData);
    if (res?.service) {
      setServices((prev) => prev.map((s) => (s.id === id ? res.service : s)));
    }
  };

  const handleDeleteService = async (id) => {
    await salonClient.deleteService(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddStaff = async (staffData) => {
    const res = await salonClient.addStaff(staffData);
    if (res?.staff) {
      setStaff((prev) => [...prev, res.staff]);
    }
  };

  const handleUpdateStaff = async (id, staffData) => {
    const res = await salonClient.updateStaff(id, staffData);
    if (res?.staff) {
      setStaff((prev) => prev.map((st) => (st.id === id ? res.staff : st)));
    }
  };

  const handleDeleteStaff = async (id) => {
    await salonClient.deleteStaff(id);
    setStaff((prev) => prev.filter((st) => st.id !== id));
  };

  const handleUpdateSalonProfile = async (profileData) => {
    const res = await salonClient.updateProfile(profileData);
    if (res?.salon) {
      setSalon(res.salon);
    }
  };

  const handleUpdateCustomerNotes = async (customerId, notesData) => {
    await salonClient.updateCustomerNotes(customerId, notesData);
    salonClient.fetchCustomers().then((c) => c?.customers && setCustomers(c.customers));
  };

  // If loading
  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#F7FBFF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#64748B]">Loading UPLOOKZ Partner Portal...</p>
        </div>
      </div>
    );
  }

  // If owner has never registered/configured a salon profile, show onboarding wizard
  if (!salon && (!currentUser?.salonName || currentUser.salonName.trim() === '')) {
    return (
      <SalonOnboardingWizard
        currentUser={currentUser}
        onComplete={(newSalon) => {
          setSalon(newSalon);
          loadDashboardData();
        }}
      />
    );
  }

  // Compute live counts for sidebar badges
  const todayStr = '2026-10-28';
  const todayAppointmentsCount = appointments.filter((a) => a.date === todayStr && a.status !== 'cancelled').length;
  const waitingQueueCount = queue.filter((q) => q.status === 'waiting').length;
  const activeStaffCount = staff.filter((s) => s.active).length;

  return (
    <div className="min-h-screen bg-[#F7FBFF] text-[#111827] flex flex-col selection:bg-[#0EA5E9] selection:text-white">
      
      {/* Top Header */}
      <SalonHeader
        salon={salon}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onNavigate={onNavigate}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        notifications={notifications}
        onRefreshNotifications={() => {
          salonClient.fetchNotifications().then((n) => n?.notifications && setNotifications(n.notifications));
        }}
      />

      {/* Main Container with Sidebar + Dynamic Tab View */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex">
        
        {/* Navigation Sidebar */}
        <SalonSidebar
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          stats={{
            todayAppointmentsCount,
            waitingQueueCount,
            servicesCount: services.length,
            activeStaffCount,
            rating: reviewsData.averageRating || 4.9
          }}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Tab Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden min-w-0">
          
          {activeTab === 'overview' && (
            <SalonOverviewTab
              salon={salon}
              currentUser={currentUser}
              appointments={appointments}
              queue={queue}
              analytics={analytics}
              onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
              onOpenAddWalkIn={() => setIsAddWalkInOpen(true)}
              onOpenAddService={() => setIsAddServiceOpen(true)}
              setActiveTab={handleSelectTab}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onUpdateQueueStatus={handleUpdateQueueStatus}
            />
          )}

          {activeTab === 'appointments' && (
            <SalonAppointmentsTab
              appointments={appointments}
              services={services}
              staff={staff}
              onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
              onOpenReschedule={(apt) => setRescheduleAppointment(apt)}
              onUpdateStatus={handleUpdateAppointmentStatus}
              onRefresh={loadDashboardData}
            />
          )}

          {activeTab === 'queue' && (
            <SalonQueueTab
              queue={queue}
              staff={staff}
              services={services}
              onOpenAddWalkIn={() => setIsAddWalkInOpen(true)}
              onUpdateQueueStatus={handleUpdateQueueStatus}
              onReorderQueue={handleReorderQueue}
            />
          )}

          {activeTab === 'calendar' && (
            <SalonCalendarTab
              salon={salon}
              appointments={appointments}
              staff={staff}
              blockedSlots={blockedSlots}
              onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
              onRefresh={loadDashboardData}
            />
          )}

          {activeTab === 'services' && (
            <SalonServicesTab
              services={services}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
            />
          )}

          {activeTab === 'staff' && (
            <SalonStaffTab
              staff={staff}
              services={services}
              appointments={appointments}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          )}

          {activeTab === 'customers' && (
            <SalonCustomersTab
              customers={customers}
              onUpdateNotes={handleUpdateCustomerNotes}
            />
          )}

          {activeTab === 'analytics' && (
            <SalonAnalyticsTab
              analytics={analytics}
            />
          )}

          {activeTab === 'reviews' && (
            <SalonReviewsTab
              reviewsData={reviewsData}
              onRefresh={() => salonClient.fetchReviews().then((r) => r && setReviewsData(r))}
            />
          )}

          {activeTab === 'profile' && (
            <SalonProfileTab
              salon={salon}
              onUpdateSalonProfile={handleUpdateSalonProfile}
              onRefresh={loadDashboardData}
            />
          )}

          {activeTab === 'settings' && (
            <SalonSettingsTab
              salon={salon}
              currentUser={currentUser}
              onNavigate={onNavigate}
            />
          )}

        </main>

      </div>

      {/* Global Modals */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        onSave={handleCreateAppointment}
        services={services}
        staff={staff}
      />

      <AddWalkInModal
        isOpen={isAddWalkInOpen}
        onClose={() => setIsAddWalkInOpen(false)}
        onSave={handleAddWalkIn}
        services={services}
        staff={staff}
      />

      <ServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        onSave={handleAddService}
        service={null}
      />

      <RescheduleModal
        isOpen={Boolean(rescheduleAppointment)}
        onClose={() => setRescheduleAppointment(null)}
        onSave={handleRescheduleAppointment}
        appointment={rescheduleAppointment}
        staff={staff}
      />

      {/* Footer */}
      <footer className="py-6 border-t border-[#E2E8F0] bg-white text-center text-xs text-[#94A3B8]">
        <p>© {new Date().getFullYear()} UPLOOKZ. Complete Salon Management System.</p>
      </footer>

    </div>
  );
}
