import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  CalendarCheck,
  Scissors,
  Users,
  UserCheck,
  BarChart3,
  Star,
  Store,
  Settings,
  X
} from 'lucide-react';

export default function SalonSidebar({
  activeTab,
  setActiveTab,
  stats = {},
  isMobileOpen = false,
  onCloseMobile
}) {
  const navItems = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: CalendarCheck,
      badge: stats.todayAppointmentsCount ? String(stats.todayAppointmentsCount) : null,
      badgeColor: 'bg-[#0EA5E9] text-white'
    },
    {
      id: 'queue',
      label: 'Live Queue',
      icon: Clock,
      badge: stats.waitingQueueCount ? `${stats.waitingQueueCount} Waiting` : null,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'calendar',
      label: 'Calendar & Slots',
      icon: CalendarDays,
      badge: null
    },
    {
      id: 'services',
      label: 'Services & Pricing',
      icon: Scissors,
      badge: stats.servicesCount ? String(stats.servicesCount) : null
    },
    {
      id: 'staff',
      label: 'Staff Management',
      icon: Users,
      badge: stats.activeStaffCount ? `${stats.activeStaffCount} on duty` : null
    },
    {
      id: 'customers',
      label: 'Customer Directory',
      icon: UserCheck,
      badge: null
    },
    {
      id: 'analytics',
      label: 'Revenue & Analytics',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'reviews',
      label: 'Reviews & Feedback',
      icon: Star,
      badge: stats.rating ? `${stats.rating} ★` : null,
      badgeColor: 'bg-amber-50 text-amber-700'
    },
    {
      id: 'profile',
      label: 'Salon Profile',
      icon: Store,
      badge: null
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0] w-64 p-4 space-y-6">
      
      {/* Mobile Header */}
      <div className="flex lg:hidden items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0EA5E9] flex items-center justify-center text-white text-xs font-bold">
            U
          </div>
          <span className="font-bold text-sm text-[#111827]">Partner Portal</span>
        </div>
        <button
          onClick={onCloseMobile}
          className="p-1 rounded-lg text-[#94A3B8] hover:text-[#111827] hover:bg-[#F1F5F9]"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
          Salon Management
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#F0F9FF] text-[#0284C7] shadow-sm border border-[#BAE6FD]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#111827] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={16}
                  className={isActive ? 'text-[#0EA5E9]' : 'text-[#94A3B8] group-hover:text-[#475569]'}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Live Storefront Status Card at bottom of sidebar */}
      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#334155]">UPLOOKZ Storefront</span>
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
        </div>
        <p className="text-[11px] text-[#64748B]">
          Accepting online customer bookings and walk-in queues.
        </p>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fadeIn">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-64 h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
