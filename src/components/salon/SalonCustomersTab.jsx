import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Search,
  Calendar,
  DollarSign,
  Scissors,
  Tag,
  Clock,
  Edit3,
  X,
  Check,
  History,
  FileText
} from 'lucide-react';

export default function SalonCustomersTab({
  customers = [],
  onUpdateNotes
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = c.name && c.name.toLowerCase().includes(q);
    const matchPhone = c.phone && c.phone.includes(q);
    const matchEmail = c.email && c.email.toLowerCase().includes(q);
    return matchName || matchPhone || matchEmail;
  });

  const handleOpenCustomer = (c) => {
    setSelectedCustomer(c);
    setNotesText(c.notes || '');
    setIsEditingNotes(false);
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      await onUpdateNotes(selectedCustomer.id, { notes: notesText.trim() });
      setSelectedCustomer((prev) => ({ ...prev, notes: notesText.trim() }));
      setIsEditingNotes(false);
    } catch (err) {
      alert(err.message || 'Failed to save notes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Salon Customer Directory
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Client profiles, visit history, services used, lifetime value, and styling notes.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-3 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
      </div>

      {/* Customers Table / Card List */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-clean overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center mx-auto">
              <User size={22} />
            </div>
            <h3 className="text-base font-bold text-[#111827]">No Customer Records Found</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Clients who complete bookings or join the walk-in queue will be recorded in this salon directory.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="py-3 px-4 sm:px-6">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Visits</th>
                  <th className="py-3 px-4">Lifetime Spend</th>
                  <th className="py-3 px-4">Last Visit</th>
                  <th className="py-3 px-4">Services Used</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => handleOpenCustomer(cust)}
                    className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-xs shrink-0">
                          {cust.name?.slice(0, 2).toUpperCase() || 'CU'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#111827]">{cust.name}</p>
                          {cust.tags && cust.tags.length > 0 && (
                            <span className="text-[10px] text-[#0284C7] font-semibold bg-[#F0F9FF] px-1.5 py-0.5 rounded">
                              {cust.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#64748B]">
                      <p className="text-xs text-[#111827]">{cust.phone || '—'}</p>
                      <p className="text-[11px] text-[#94A3B8]">{cust.email || '—'}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#111827]">{cust.totalVisits}</span> visits
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#111827]">
                      ₹{cust.totalSpend.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-[#64748B]">
                      {cust.lastVisitDate || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {cust.servicesUsed?.slice(0, 2).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] bg-[#F1F5F9] text-[#475569] font-medium truncate max-w-[120px]"
                          >
                            {s}
                          </span>
                        ))}
                        {cust.servicesUsed?.length > 2 && (
                          <span className="text-[10px] text-[#94A3B8] font-semibold self-center">
                            +{cust.servicesUsed.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCustomer(cust);
                        }}
                        className="text-xs font-semibold text-[#0EA5E9] hover:underline"
                      >
                        View Profile →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between space-y-6 overflow-y-auto">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-base">
                    {selectedCustomer.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111827]">{selectedCustomer.name}</h3>
                    <p className="text-xs text-[#64748B]">
                      {selectedCustomer.totalVisits} completed visits • ₹{selectedCustomer.totalSpend} lifetime
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#111827] hover:bg-[#F1F5F9]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-[#111827]">Contact Details</h4>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5 text-[#64748B]">
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="text-[#0EA5E9]" />
                    <span className="text-[#111827] font-medium">{selectedCustomer.phone || 'No phone provided'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail size={13} className="text-[#0EA5E9]" />
                    <span>{selectedCustomer.email || 'No email provided'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar size={13} className="text-[#0EA5E9]" />
                    <span>Last visited: {selectedCustomer.lastVisitDate}</span>
                  </p>
                </div>
              </div>

              {/* Stylist Notes & Client Preferences */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#111827] flex items-center gap-1.5">
                    <FileText size={14} className="text-[#0EA5E9]" />
                    Styling Preferences & Notes
                  </h4>
                  {!isEditingNotes && (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="text-[#0EA5E9] hover:underline font-semibold flex items-center gap-1"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="e.g. Sensitive scalp, scissor-cut only, low fade, prefers espresso..."
                      className="w-full p-2.5 text-xs border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setIsEditingNotes(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-[#64748B] hover:bg-[#F1F5F9]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0EA5E9] text-white hover:bg-[#0284C7]"
                      >
                        {loading ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#475569] leading-relaxed">
                    {selectedCustomer.notes || 'No private styling preferences recorded yet. Click Edit to add notes.'}
                  </div>
                )}
              </div>

              {/* Past Appointment History */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-[#111827] flex items-center gap-1.5">
                  <History size={14} className="text-[#0EA5E9]" />
                  Visit History ({selectedCustomer.appointments?.length || 0})
                </h4>

                <div className="divide-y divide-[#F1F5F9] border border-[#E2E8F0] rounded-xl max-h-48 overflow-y-auto">
                  {selectedCustomer.appointments?.length === 0 ? (
                    <p className="p-4 text-center text-[#94A3B8]">No past bookings recorded.</p>
                  ) : (
                    selectedCustomer.appointments?.map((apt) => (
                      <div key={apt.id} className="p-3 text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#111827]">
                            {apt.serviceNames?.join(', ')}
                          </span>
                          <span className="font-bold text-[#0EA5E9]">₹{apt.totalAmount}</span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          {apt.date} at {apt.time} • Stylist: {apt.staffName || 'Stylist'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
