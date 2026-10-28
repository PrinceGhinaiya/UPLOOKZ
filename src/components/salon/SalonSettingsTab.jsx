import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  LogOut,
  UserCheck,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  Store
} from 'lucide-react';
import { authClient } from '../../services/authClient';

export default function SalonSettingsTab({
  salon,
  currentUser,
  onNavigate
}) {
  const [name, setName] = useState(currentUser?.name || 'Rahul Sharma');
  const [email, setEmail] = useState(currentUser?.email || 'salon@example.com');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98765 01234');
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const stored = authClient.getStoredUser() || {};
    const updated = { ...stored, name, email, phone };
    localStorage.setItem('uplookz_user_profile', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
          Salon Owner Account & Settings
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B]">
          Manage your personal credentials, partner verification, role switching, and session security.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Account Info Form */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
        <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
          <User size={16} className="text-[#0EA5E9]" />
          Owner Profile Details
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Primary Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Registered Business</label>
              <input
                type="text"
                disabled
                value={salon?.name || 'Apex Studio & Grooming'}
                className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] rounded-lg cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm"
            >
              Save Account Changes
            </button>
          </div>
        </form>
      </div>

      {/* Role Switcher & Customer Portal Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <UserCheck size={16} className="text-[#0EA5E9]" />
              Role & Portal Switching
            </h3>
            <p className="text-xs text-[#64748B]">
              Switch back to Customer Mode to explore other salons or book personal grooming appointments without logging out.
            </p>
          </div>

          <button
            onClick={handleSwitchToCustomer}
            className="btn-lift inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] text-xs font-semibold shadow-sm"
          >
            <UserCheck size={15} />
            <span>Switch to Customer Mode</span>
          </button>
        </div>
      </div>

      {/* Security & Session Info */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
        <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
          <Shield size={16} className="text-[#0EA5E9]" />
          Session & Account Security
        </h3>

        <div className="space-y-2 text-xs text-[#64748B]">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div>
              <p className="font-semibold text-[#111827]">Partner Verification</p>
              <p className="text-[11px] text-[#16A34A] font-medium">✓ Verified UPLOOKZ Partner Tier</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div>
              <p className="font-semibold text-[#111827]">Authentication Protocol</p>
              <p className="text-[11px]">Secure cryptographic token Bearer authorization</p>
            </div>
            <span className="font-mono text-[10px] text-[#0284C7] bg-[#F0F9FF] px-2 py-0.5 rounded">
              Bearer Session
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#F1F5F9] flex justify-end">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
          >
            <LogOut size={15} />
            <span>Log Out of Salon Account</span>
          </button>
        </div>
      </div>

    </div>
  );
}
