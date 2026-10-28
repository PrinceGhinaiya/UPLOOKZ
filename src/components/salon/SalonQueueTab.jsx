import React, { useState } from 'react';
import {
  Clock,
  UserPlus,
  Play,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  User,
  Phone,
  Scissors,
  Users,
  Timer,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function SalonQueueTab({
  queue = [],
  staff = [],
  services = [],
  onOpenAddWalkIn,
  onUpdateQueueStatus,
  onReorderQueue
}) {
  const [activeSubTab, setActiveSubTab] = useState('active'); // 'active' | 'history'
  const [cancelModalEntry, setCancelModalEntry] = useState(null);
  const [cancelReason, setCancelReason] = useState('Customer left / No show');

  // Active queue entries
  const waitingEntries = queue
    .filter((q) => q.status === 'waiting')
    .sort((a, b) => a.position - b.position);

  const inServiceEntries = queue.filter((q) => q.status === 'in_service');
  const completedEntries = queue.filter((q) => q.status === 'completed' || q.status === 'cancelled');

  // Stats
  const activeStaff = staff.filter((s) => s.active);
  const avgWait = waitingEntries.length > 0 ? waitingEntries[waitingEntries.length - 1].estimatedWaitMinutes : 0;

  const handleConfirmCancel = () => {
    if (cancelModalEntry) {
      onUpdateQueueStatus(cancelModalEntry.id, 'cancelled', cancelReason);
      setCancelModalEntry(null);
      setCancelReason('Customer left / No show');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Live Walk-In Queue Manager
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Real-time queue tracking for walk-in arrivals with dynamic wait estimation based on chair availability.
          </p>
        </div>

        <button
          onClick={onOpenAddWalkIn}
          className="btn-lift inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all shrink-0"
        >
          <UserPlus size={16} />
          <span>+ Add Walk-In Customer</span>
        </button>
      </div>

      {/* Real-time Queue KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Customers Waiting</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700">{waitingEntries.length}</p>
          <p className="text-xs text-[#64748B]">In physical queue</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Currently In Chair</span>
            <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
              <Scissors size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#16A34A]">{inServiceEntries.length}</p>
          <p className="text-xs text-[#64748B]">Being served right now</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Est. Wait for New Arrival</span>
            <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center">
              <Timer size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">~{avgWait} mins</p>
          <p className="text-xs text-[#0EA5E9] font-medium">Updated automatically</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Stylists On Duty</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{activeStaff.length}</p>
          <p className="text-xs text-[#64748B]">Operational chairs</p>
        </div>

      </div>

      {/* Sub Tabs: Active Queue vs History */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('active')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeSubTab === 'active'
              ? 'bg-[#0EA5E9] text-white shadow-sm'
              : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9]'
          }`}
        >
          Active Queue ({waitingEntries.length + inServiceEntries.length})
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeSubTab === 'history'
              ? 'bg-[#0EA5E9] text-white shadow-sm'
              : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9]'
          }`}
        >
          Completed & History ({completedEntries.length})
        </button>
      </div>

      {activeSubTab === 'active' ? (
        <div className="space-y-6">
          
          {/* Section A: Customers In Chair (In Service) */}
          {inServiceEntries.length > 0 && (
            <div className="bg-white border border-[#BBF7D0] rounded-2xl p-5 shadow-clean space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-ping" />
                  <h3 className="text-sm font-bold text-[#111827]">
                    Currently In Service ({inServiceEntries.length})
                  </h3>
                </div>
                <span className="text-xs text-[#16A34A] font-semibold bg-[#F0FDF4] px-2.5 py-1 rounded-full border border-[#BBF7D0]">
                  Chairs Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {inServiceEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl bg-[#F0FDF4]/60 border border-[#BBF7D0] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#111827]">{entry.customerName}</span>
                        <span className="text-[11px] text-[#64748B]">{entry.customerPhone}</span>
                      </div>
                      <p className="text-xs text-[#16A34A] font-medium flex items-center gap-1.5">
                        <Scissors size={12} />
                        {entry.serviceName}
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Stylist: <strong>{entry.staffName || 'Active Stylist'}</strong> • Started at {entry.startedAt || 'Recently'}
                      </p>
                    </div>

                    <button
                      onClick={() => onUpdateQueueStatus(entry.id, 'completed')}
                      className="btn-lift inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-sm shrink-0"
                    >
                      <CheckCircle2 size={14} />
                      <span>Finish & Pay</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section B: Waiting Queue Entries (Ordered by Position) */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-clean overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#111827]">Waiting Line</h3>
                <p className="text-xs text-[#64748B]">
                  Reorder positions, start service in chair, or update records.
                </p>
              </div>
              
              {waitingEntries.length > 0 && (
                <button
                  onClick={() => onUpdateQueueStatus(waitingEntries[0].id, 'in_service')}
                  className="btn-lift inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm"
                >
                  <Play size={14} />
                  <span>Call Next (#1 {waitingEntries[0].customerName})</span>
                </button>
              )}
            </div>

            {waitingEntries.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center mx-auto">
                  <Clock size={22} />
                </div>
                <h4 className="text-base font-bold text-[#111827]">No Customers Waiting</h4>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  The walk-in queue is clear. Walk-in customers who arrive will appear here in real time.
                </p>
                <button
                  onClick={onOpenAddWalkIn}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0EA5E9] text-white text-xs font-semibold shadow-sm"
                >
                  <UserPlus size={14} />
                  <span>Add Walk-In Customer</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {waitingEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors"
                  >
                    {/* Left: Position & Info */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-sm shrink-0 border border-[#BAE6FD]">
                        #{entry.position}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#111827]">{entry.customerName}</p>
                          {entry.customerPhone && (
                            <span className="text-xs text-[#94A3B8]">{entry.customerPhone}</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-[#475569]">
                          {entry.serviceName}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                          <span>Arrived at: {entry.arrivalTime}</span>
                          <span>Stylist: {entry.staffName || 'Next Available'}</span>
                          {entry.notes && (
                            <span className="italic text-[#94A3B8]">({entry.notes})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Wait Estimate, Reorder, and Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                      
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          ~{entry.estimatedWaitMinutes}m wait
                        </span>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => onReorderQueue(entry.id, 'up')}
                          className="p-1 rounded text-[#94A3B8] hover:text-[#111827] hover:bg-[#E2E8F0] disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          disabled={index === waitingEntries.length - 1}
                          onClick={() => onReorderQueue(entry.id, 'down')}
                          className="p-1 rounded text-[#94A3B8] hover:text-[#111827] hover:bg-[#E2E8F0] disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      {/* Action: Call to chair */}
                      <button
                        onClick={() => onUpdateQueueStatus(entry.id, 'in_service')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0EA5E9] text-white hover:bg-[#0284C7] font-semibold shadow-sm"
                        title="Seat client in chair"
                      >
                        <Play size={13} />
                        <span>Seat in Chair</span>
                      </button>

                      {/* Cancel / Remove */}
                      <button
                        onClick={() => setCancelModalEntry(entry)}
                        className="text-xs text-[#94A3B8] hover:text-red-600 px-2 py-1"
                        title="Remove from queue"
                      >
                        Remove
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* History & Completed Tab */
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-clean overflow-hidden">
          <div className="p-5 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#111827]">Walk-In History</h3>
            <p className="text-xs text-[#64748B]">Fulfilled and cancelled walk-in queue entries.</p>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {completedEntries.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#94A3B8]">
                No completed or cancelled walk-ins recorded yet.
              </div>
            ) : (
              completedEntries.map((entry) => (
                <div key={entry.id} className="p-4 sm:px-6 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-[#111827]">{entry.customerName}</p>
                    <p className="text-[#64748B]">{entry.serviceName} • {entry.staffName || 'Staff'}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      entry.status === 'completed'
                        ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {entry.status}
                    </span>
                    {entry.cancellationReason && (
                      <p className="text-[10px] text-[#94A3B8]">{entry.cancellationReason}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Cancel Walk-In Reason Modal */}
      {cancelModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-clean-lg border border-[#E2E8F0] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#111827]">Remove from Queue</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Removing {cancelModalEntry.customerName}. Please specify a cancellation reason:
              </p>
            </div>

            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            >
              <option value="Customer left / No show">Customer left / No show</option>
              <option value="Wait time too long">Wait time too long</option>
              <option value="Booked advance appointment instead">Booked advance appointment instead</option>
              <option value="Stylist unavailable">Stylist unavailable</option>
              <option value="Other">Other</option>
            </select>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setCancelModalEntry(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm"
              >
                Remove Entry
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
