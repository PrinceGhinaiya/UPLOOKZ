import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  UserCheck,
  LogOut,
  Settings,
  Store,
  Menu,
  X,
  CheckCircle2,
  Calendar,
  Users,
  Star,
  ExternalLink
} from 'lucide-react';
import { authClient } from '../../services/authClient';
import { salonClient } from '../../services/salonClient';

export default function SalonHeader({
  salon,
  currentUser,
  activeTab,
  setActiveTab,
  onNavigate,
  onOpenMobileSidebar,
  notifications = [],
  onRefreshNotifications
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await salonClient.markAllNotificationsRead();
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      await salonClient.markNotificationRead(notif.id);
      if (onRefreshNotifications) onRefreshNotifications();
      if (notif.link) {
        setActiveTab(notif.link);
      }
      setShowNotifications(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchToCustomer = async () => {
    try {
      await authClient.switchRole('customer');
      if (onNavigate) onNavigate('/customer/home');
      else window.location.href = '/customer/home';
    } catch {
      if (onNavigate) onNavigate('/customer/home');
    }
  };

  const handleLogout = async () => {
    await authClient.logout();
    if (onNavigate) onNavigate('/');
    else window.location.href = '/';
  };

  const displaySalonName = salon?.name || currentUser?.salonName || 'Apex Studio & Grooming';
  const displayOwnerName = currentUser?.name || 'Rahul Sharma';
  const displayInitials = (displaySalonName || 'AS')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9]"
            aria-label="Open Navigation"
          >
            <Menu size={20} />
          </button>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('/');
            }}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0EA5E9] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <span className="font-bold text-base tracking-tight">U</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111827]">
              UPLOOKZ<span className="text-[#0EA5E9]">.</span>
            </span>
          </a>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#E2E8F0]">
            <span className="text-xs font-semibold text-[#111827] truncate max-w-[200px]">
              {displaySalonName}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Seamless Mode Switcher (Salon Owner <-> Customer without logging out) */}
          <button
            onClick={handleSwitchToCustomer}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] px-3 py-1.5 rounded-lg transition-all"
            title="Switch to Customer Mode"
          >
            <UserCheck size={14} className="text-[#0EA5E9]" />
            <span className="hidden md:inline">Switch to</span> Customer Mode
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] transition-colors"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#0EA5E9] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E2E8F0] rounded-2xl shadow-clean-lg p-4 z-50 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#111827]">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#F0F9FF] text-[#0284C7]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-[#0EA5E9] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#F1F5F9] max-h-80 overflow-y-auto mt-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#94A3B8]">
                      No notifications right now.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 rounded-lg text-left cursor-pointer transition-colors ${
                          notif.read ? 'hover:bg-[#F8FAFC]' : 'bg-[#F0F9FF]/60 hover:bg-[#F0F9FF]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-[#111827]">{notif.title}</p>
                          <span className="text-[10px] text-[#94A3B8] shrink-0">
                            {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-xs shrink-0">
                {displayInitials}
              </div>
              <div className="hidden lg:block text-left text-xs leading-tight">
                <p className="font-semibold text-[#111827] truncate max-w-[120px]">{displayOwnerName}</p>
                <p className="text-[10px] text-[#64748B]">Owner</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-2xl shadow-clean-lg p-2 z-50 animate-fadeIn text-xs">
                <div className="p-3 border-b border-[#F1F5F9]">
                  <p className="font-bold text-[#111827]">{displayOwnerName}</p>
                  <p className="text-[11px] text-[#64748B] truncate">{currentUser?.email || 'salon@example.com'}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0F9FF] text-[#0284C7]">
                    Salon Owner Verified
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#334155] hover:bg-[#F8FAFC] transition-colors text-left"
                  >
                    <Store size={14} className="text-[#0EA5E9]" />
                    <span>Salon Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#334155] hover:bg-[#F8FAFC] transition-colors text-left"
                  >
                    <Settings size={14} className="text-[#0EA5E9]" />
                    <span>Account Settings</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[#F1F5F9]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
