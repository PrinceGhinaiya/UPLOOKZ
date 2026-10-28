import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Percent,
  Scissors,
  Star,
  CreditCard,
  ArrowUpRight
} from 'lucide-react';

export default function SalonAnalyticsTab({ analytics = {} }) {
  const [timeframe, setTimeframe] = useState('month'); // 'day' | 'week' | 'month'

  const {
    todayRevenue = 0,
    weekRevenue = 0,
    monthRevenue = 0,
    totalRevenue = 0,
    totalAppointments = 0,
    completedAppointments = 0,
    cancelledAppointments = 0,
    completionRate = 0,
    returnRate = 0,
    popularServices = [],
    staffMetrics = [],
    revenueTrends = [],
    transactions = []
  } = analytics;

  // Selected revenue according to timeframe
  const displayRevenue =
    timeframe === 'day' ? todayRevenue : timeframe === 'week' ? weekRevenue : monthRevenue;

  // Max value for SVG bar scaling
  const maxTrendRevenue = Math.max(...revenueTrends.map((t) => t.revenue), 1000);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Revenue & Business Analytics
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Calculated strictly from completed transactions and verified booking records.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="inline-flex p-1 bg-white border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#64748B] shadow-sm">
          <button
            onClick={() => setTimeframe('day')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeframe === 'day' ? 'bg-[#0EA5E9] text-white shadow-sm' : 'hover:text-[#111827]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeframe === 'week' ? 'bg-[#0EA5E9] text-white shadow-sm' : 'hover:text-[#111827]'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeframe === 'month' ? 'bg-[#0EA5E9] text-white shadow-sm' : 'hover:text-[#111827]'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">
              {timeframe === 'day' ? "Today's Revenue" : timeframe === 'week' ? '7-Day Revenue' : 'Monthly Revenue'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">₹{displayRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-[#059669] font-medium flex items-center gap-1">
            <TrendingUp size={12} /> Real verified transactions
          </p>
        </div>

        {/* Card 2: Completed Bookings */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Completed Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{completedAppointments}</p>
          <p className="text-[11px] text-[#64748B]">
            {completionRate}% completion rate ({cancelledAppointments} cancelled)
          </p>
        </div>

        {/* Card 3: Returning Client Rate */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Customer Return Rate</span>
            <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
              <Percent size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#16A34A]">{returnRate}%</p>
          <p className="text-[11px] text-[#64748B]">Repeat grooming visits</p>
        </div>

        {/* Card 4: Total Lifetime Revenue */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Total Lifetime Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-[#64748B]">Across all completed services</p>
        </div>

      </div>

      {/* Revenue Trend Visualizer (Daily Bar Chart) */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Daily Revenue Trend (Last 7 Days)</h3>
            <p className="text-xs text-[#64748B]">Daily earnings from fulfilled appointments and walk-ins.</p>
          </div>
          <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full">
            Live Database Sync
          </span>
        </div>

        {/* Bar Chart Representation */}
        <div className="pt-6">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-[#E2E8F0] pb-2">
            {revenueTrends.map((t, idx) => {
              const heightPct = Math.round((t.revenue / maxTrendRevenue) * 100);

              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full gap-2 group">
                  <span className="text-[10px] font-bold text-[#0EA5E9] opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{t.revenue}
                  </span>

                  <div
                    className="w-full max-w-[42px] bg-[#E0F2FE] group-hover:bg-[#0EA5E9] rounded-t-lg transition-all duration-300 relative"
                    style={{ height: `${Math.max(heightPct, 6)}%` }}
                  >
                    {t.revenue > 0 && (
                      <div className="w-full h-1 bg-[#0284C7] rounded-t-lg" />
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] font-bold text-[#111827]">{t.day}</p>
                    <p className="text-[9px] text-[#94A3B8]">{t.date.slice(5)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Popular Services & Staff Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Popular Services */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Most Popular Services</h3>
              <p className="text-xs text-[#64748B]">Ranked by total client bookings</p>
            </div>
            <Scissors size={18} className="text-[#0EA5E9]" />
          </div>

          <div className="space-y-3">
            {popularServices.length === 0 ? (
              <p className="text-xs text-[#94A3B8] py-8 text-center">No service data recorded yet.</p>
            ) : (
              popularServices.map((srv, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-[#111827]">{srv.name}</p>
                      <p className="text-[11px] text-[#64748B]">{srv.bookings} total bookings</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#111827]">₹{srv.revenue.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Staff Performance Metrics */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Staff Performance</h3>
              <p className="text-xs text-[#64748B]">Appointments fulfilled & revenue generated</p>
            </div>
            <Users size={18} className="text-[#16A34A]" />
          </div>

          <div className="space-y-3">
            {staffMetrics.length === 0 ? (
              <p className="text-xs text-[#94A3B8] py-8 text-center">No staff metrics recorded yet.</p>
            ) : (
              staffMetrics.map((st) => (
                <div key={st.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] font-bold text-xs flex items-center justify-center">
                      {st.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-[#111827]">{st.name}</p>
                      <p className="text-[11px] text-[#64748B]">{st.appointmentsHandled} completed • {st.rating} ★</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#059669]">₹{st.revenueGenerated.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Transaction Log Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-clean overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-bold text-[#111827]">Recent Recorded Transactions</h3>
          <p className="text-xs text-[#64748B]">Valid receipts from completed appointments and walk-in chairs.</p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#94A3B8]">
            No recorded transactions in this timeframe.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="py-3 px-6">Transaction ID</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-6 font-mono text-[11px] text-[#0284C7]">{tx.id}</td>
                    <td className="py-3 px-4 font-semibold text-[#111827]">{tx.customerName}</td>
                    <td className="py-3 px-4 text-[#64748B]">{tx.paymentMethod}</td>
                    <td className="py-3 px-4 text-[#64748B]">{tx.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-bold text-[#111827]">
                      ₹{tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
