import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Filter,
  CornerDownRight,
  Send,
  AlertCircle
} from 'lucide-react';
import { salonClient } from '../../services/salonClient';

export default function SalonReviewsTab({
  reviewsData = {},
  onRefresh
}) {
  const {
    averageRating = 4.9,
    totalReviews = 0,
    ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews = []
  } = reviewsData;

  const [ratingFilter, setRatingFilter] = useState('all');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter !== 'all' && r.rating !== parseInt(ratingFilter, 10)) return false;
    return true;
  });

  const handleOpenReply = (review) => {
    setActiveReplyId(review.id);
    setReplyText(review.ownerReply || '');
  };

  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      await salonClient.replyToReview(reviewId, replyText.trim());
      setActiveReplyId(null);
      setReplyText('');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to submit reply.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
          Customer Ratings & Reviews
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B]">
          Verified feedback from clients who booked and visited your salon. Respond to reviews to build loyalty.
        </p>
      </div>

      {/* Aggregate Rating Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-clean grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Left: Big Score */}
        <div className="text-center md:text-left space-y-1.5 md:border-r border-[#E2E8F0] md:pr-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Overall Salon Rating</p>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-4xl sm:text-5xl font-black text-[#111827]">{averageRating}</span>
            <div className="space-y-0.5">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <p className="text-xs text-[#64748B]">Based on {totalReviews} verified reviews</p>
            </div>
          </div>
        </div>

        {/* Middle: Rating Distribution Bar Chart */}
        <div className="md:col-span-2 space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingDistribution[stars] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-10 font-bold text-[#475569] shrink-0 flex items-center gap-1">
                  {stars} <Star size={11} className="fill-amber-400 text-amber-400" />
                </span>

                <div className="flex-1 h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="w-12 text-right text-[#64748B] font-semibold shrink-0">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-clean text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#475569]">Filter by Rating:</span>
          {['all', '5', '4', '3'].map((f) => (
            <button
              key={f}
              onClick={() => setRatingFilter(f)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                ratingFilter === f
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#111827]'
              }`}
            >
              {f === 'all' ? 'All Reviews' : `${f} Stars`}
            </button>
          ))}
        </div>

        <span className="text-[#94A3B8]">
          Showing {filteredReviews.length} reviews
        </span>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center text-xs text-[#94A3B8]">
            No reviews match the selected filter.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-clean space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {rev.customerName?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#111827]">{rev.customerName}</h4>
                      {rev.verifiedVisit && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                          <CheckCircle2 size={11} />
                          Verified Client
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                      <div className="flex items-center text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span>• {rev.date}</span>
                      {rev.serviceUsed && <span>• {rev.serviceUsed}</span>}
                    </div>
                  </div>
                </div>

                {!rev.ownerReply && activeReplyId !== rev.id && (
                  <button
                    onClick={() => handleOpenReply(rev)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0EA5E9] hover:bg-[#F0F9FF] px-2.5 py-1 rounded-lg border border-[#BAE6FD]"
                  >
                    <MessageSquare size={13} />
                    <span>Reply</span>
                  </button>
                )}
              </div>

              {/* Review Comment */}
              <p className="text-xs text-[#334155] leading-relaxed">
                "{rev.comment}"
              </p>

              {/* Owner Reply Display */}
              {rev.ownerReply && (
                <div className="p-3.5 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#0284C7] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CornerDownRight size={13} />
                      Response from Salon Owner
                    </span>
                    {activeReplyId !== rev.id && (
                      <button
                        onClick={() => handleOpenReply(rev)}
                        className="text-[11px] underline hover:text-[#0369A1]"
                      >
                        Edit Reply
                      </button>
                    )}
                  </div>
                  <p className="text-[#334155] pl-4">{rev.ownerReply}</p>
                </div>
              )}

              {/* Inline Reply Form */}
              {activeReplyId === rev.id && (
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl space-y-2">
                  <label className="block text-xs font-semibold text-[#334155]">
                    Public Response to {rev.customerName}:
                  </label>
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Thank the client, address feedback, or invite them back..."
                    className="w-full p-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveReplyId(null)}
                      className="px-3 py-1 rounded-lg text-xs text-[#64748B] hover:bg-[#E2E8F0]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSubmitReply(rev.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-sm"
                    >
                      <Send size={12} />
                      <span>{loading ? 'Submitting...' : 'Post Reply'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}
