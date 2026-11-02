import React from 'react';
import { Star, MapPin, Clock, Calendar, Heart, ShieldCheck, ArrowRight, Store } from 'lucide-react';

export default function SalonCard({
  salon,
  isFavorite,
  onToggleFavorite,
  onViewSalon,
  onBookAppointment
}) {
  const coverImage = (Array.isArray(salon.gallery) && salon.gallery.length > 0)
    ? salon.gallery[0]
    : salon.logo;

  const displayRating = salon.rating ? Number(salon.rating).toFixed(1) : '5.0';
  const reviewCount = salon.reviewCount || 0;
  const startingPrice = salon.startingPrice > 0 ? salon.startingPrice : null;
  const isOpen = salon.isOpen ?? true;

  return (
    <div
      onClick={() => onViewSalon(salon.id)}
      className="group bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] rounded-2xl overflow-hidden shadow-clean hover:shadow-clean-lg transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* 1. Cover Image Section */}
      <div className="relative h-48 w-full bg-[#F1F5F9] overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={salon.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] text-[#94A3B8] p-4 text-center">
            <Store size={32} className="text-[#CBD5E1] mb-1.5" />
            <span className="text-xs font-semibold text-[#64748B]">{salon.name}</span>
            <span className="text-[11px] text-[#94A3B8]">Verified Partner Studio</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Open / Closed Status */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md ${
              isOpen
                ? 'bg-[#10B981]/90 text-white'
                : 'bg-[#64748B]/90 text-white'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-white animate-pulse' : 'bg-white/60'}`} />
            {isOpen ? 'Open Now' : 'Closed'}
          </span>

          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(salon.id);
            }}
            className={`pointer-events-auto p-2 rounded-full backdrop-blur-md shadow-sm transition-transform active:scale-90 ${
              isFavorite
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-white/85 text-[#64748B] hover:text-red-500 hover:bg-white'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={15} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
          </button>
        </div>

        {/* Rating Floating Pill */}
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/95 backdrop-blur-sm text-[#111827] shadow-sm">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span>{displayRating}</span>
            <span className="text-[#64748B] font-normal text-[11px]">({reviewCount})</span>
          </span>
        </div>
      </div>

      {/* 2. Salon Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#111827] group-hover:text-[#0284C7] transition-colors flex items-center gap-1.5">
                <span>{salon.name}</span>
                {salon.verified && (
                  <ShieldCheck size={16} className="text-[#0EA5E9] shrink-0" title="Verified Salon" />
                )}
              </h3>
              <p className="text-xs text-[#64748B] flex items-center gap-1 mt-1 truncate">
                <MapPin size={13} className="text-[#94A3B8] shrink-0" />
                <span>{salon.city || salon.address || 'Mumbai'}</span>
              </p>
            </div>

            {startingPrice && (
              <div className="text-right shrink-0">
                <span className="text-[10px] text-[#64748B] block">Starts from</span>
                <span className="text-sm font-extrabold text-[#111827]">₹{startingPrice}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-[#64748B] line-clamp-2 mt-2.5">
            {salon.tagline || salon.description || 'Premium grooming and styling services by expert stylists.'}
          </p>

          {/* Specialties / Service Categories Chips */}
          {salon.serviceCategories && salon.serviceCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {salon.serviceCategories.slice(0, 3).map((cat, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F1F5F9] text-[#475569]"
                >
                  {cat}
                </span>
              ))}
              {salon.serviceCategories.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-[#94A3B8]">
                  +{salon.serviceCategories.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3. Card Footer with Action Buttons */}
        <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
          <div className="text-xs text-[#64748B] flex items-center gap-1.5">
            <Clock size={12} className="text-[#94A3B8]" />
            <span>
              Queue: <strong className="text-[#111827]">{salon.liveQueue?.waitingCount || 0} waiting</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewSalon(salon.id);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0284C7] bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] transition-all"
            >
              View Salon
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBookAppointment(salon);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] shadow-sm transition-all flex items-center gap-1"
            >
              <Calendar size={13} />
              <span>Book</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
