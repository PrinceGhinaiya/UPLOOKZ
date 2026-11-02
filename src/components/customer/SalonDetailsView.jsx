import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  User,
  Scissors,
  CheckCircle2,
  X,
  Heart,
  MessageSquare,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { salonClient } from '../../services/salonClient';

export default function SalonDetailsView({
  salonId,
  onBack,
  onBookSalon,
  onBookService,
  onJoinQueue,
  isFavorite,
  onToggleFavorite
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('services'); // 'services' | 'gallery' | 'stylists' | 'reviews' | 'about'
  const [serviceCategory, setServiceCategory] = useState('All');
  const [serviceSearch, setServiceSearch] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (!salonId) return;
    let isMounted = true;
    setLoading(true);
    setError('');

    async function loadData() {
      try {
        const data = await salonClient.fetchCustomerSalonDetails(salonId);
        if (isMounted) {
          if (data && data.salon) {
            setDetails(data);
            // Record view
            salonClient.recordRecentlyViewed(salonId).catch(() => {});
          } else {
            setError('Salon details could not be retrieved.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching salon details:', err);
          setError('Failed to load salon profile.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [salonId]);

  if (loading) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 shadow-clean">
        <div className="w-10 h-10 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-[#64748B]">Loading salon storefront & verified services...</p>
      </div>
    );
  }

  if (error || !details?.salon) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 shadow-clean">
        <p className="text-sm font-bold text-red-600">{error || 'Salon not found.'}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0EA5E9] text-white text-xs font-semibold"
        >
          <ArrowLeft size={14} /> Back to Salons
        </button>
      </div>
    );
  }

  const salon = details.salon;
  const services = details.services || [];
  const staff = details.staff || [];
  const reviews = details.reviews || [];
  const queueStatus = details.queueStatus || { waitingCount: 0, estimatedWaitMinutes: 0 };

  const gallery = Array.isArray(salon.gallery) ? salon.gallery : (salon.gallery ? [salon.gallery] : []);
  const coverImage = gallery[0] || salon.logo || '';
  const displayRating = salon.rating ? Number(salon.rating).toFixed(1) : '5.0';
  const reviewCount = reviews.length > 0 ? reviews.length : (salon.reviewCount || 0);

  // Categories of services
  const categories = ['All', ...new Set(services.map((s) => s.category || 'General'))];
  const filteredServices = services.filter((s) => {
    const matchCat = serviceCategory === 'All' || (s.category || 'General').toLowerCase() === serviceCategory.toLowerCase();
    const matchSearch = !serviceSearch.trim() ||
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(serviceSearch.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Navigation Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-semibold text-[#334155] shadow-sm transition-all group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Salons</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(salon.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isFavorite
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-white hover:bg-[#F8FAFC] text-[#475569] border-[#CBD5E1]'
            }`}
          >
            <Heart size={14} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
            <span>{isFavorite ? 'Saved to Favorites' : 'Save Salon'}</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Cover Banner & Salon Identity Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-clean">
        <div className="relative h-64 sm:h-80 w-full bg-[#1E293B]">
          {coverImage ? (
            <img
              src={coverImage}
              alt={salon.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white/50">
              <span className="text-lg font-bold">{salon.name}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Floating actions & gallery count on cover */}
          {gallery.length > 0 && (
            <button
              onClick={() => {
                setActiveTab('gallery');
                setLightboxImage(gallery[0]);
              }}
              className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md transition-all"
            >
              <Sparkles size={13} className="text-[#38BDF8]" />
              <span>View Gallery ({gallery.length} photos)</span>
            </button>
          )}

          {/* Salon Details Overlay in Hero */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto text-white space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#10B981] text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Verified Salon Partner
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white text-[#111827]">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                {displayRating} ({reviewCount} reviews)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
              {salon.name}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 drop-shadow-sm flex items-center gap-1.5">
              <MapPin size={14} className="shrink-0 text-[#38BDF8]" />
              <span>{salon.address ? `${salon.address}, ${salon.city}` : salon.city}</span>
            </p>
          </div>
        </div>

        {/* Quick Information Strip below hero */}
        <div className="p-5 sm:p-6 bg-white border-t border-[#F1F5F9] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-[11px] text-[#64748B] font-medium">Operating Hours</p>
              <p className="font-bold text-[#111827]">{salon.openingTime || '09:00 AM'} – {salon.closingTime || '09:00 PM'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
              <Phone size={16} />
            </div>
            <div>
              <p className="text-[11px] text-[#64748B] font-medium">Contact Phone</p>
              <p className="font-bold text-[#111827]">{salon.phone || '+91 98765 01234'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-amber-700 flex items-center justify-center shrink-0">
              <Scissors size={16} />
            </div>
            <div>
              <p className="text-[11px] text-[#64748B] font-medium">Services Available</p>
              <p className="font-bold text-[#111827]">{services.length} Grooming Services</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onBookSalon(salon)}
              className="btn-lift w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Calendar size={14} />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E2E8F0] overflow-x-auto pb-px">
        {[
          { id: 'services', label: `Services (${services.length})` },
          { id: 'gallery', label: `Photo Gallery (${gallery.length})` },
          { id: 'stylists', label: `Master Stylists (${staff.length})` },
          { id: 'reviews', label: `Reviews (${reviews.length})` },
          { id: 'about', label: 'About & Amenities' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'border-[#0EA5E9] text-[#0EA5E9]'
                : 'border-transparent text-[#64748B] hover:text-[#111827]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tab Content: SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-5">
          {/* Service Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setServiceCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    serviceCategory === cat
                      ? 'bg-[#0EA5E9] text-white shadow-sm'
                      : 'bg-white hover:bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              placeholder="Search services..."
              className="px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9] bg-white sm:w-60"
            />
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center text-[#64748B] text-xs">
              No services found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl p-5 shadow-clean hover:shadow-clean-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F1F5F9] text-[#475569]">
                        {srv.category || 'General'}
                      </span>
                      <span className="text-xs font-medium text-[#64748B]">
                        {srv.durationMinutes || 30} mins
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#111827]">{srv.name}</h4>
                    <p className="text-xs text-[#64748B] line-clamp-2">
                      {srv.description || 'Premium grooming treatment using top-tier products.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Price</span>
                      <span className="text-base font-extrabold text-[#111827]">₹{srv.price}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onBookService(salon, srv)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                    >
                      <Calendar size={13} />
                      <span>Book Service</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Tab Content: PHOTO GALLERY */}
      {activeTab === 'gallery' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <h3 className="text-base font-bold text-[#111827]">Salon Ambiance & Work Portfolio</h3>
          {gallery.length === 0 ? (
            <p className="text-xs text-[#64748B] italic">No photos uploaded by this salon yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((photoUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxImage(photoUrl)}
                  className="relative h-44 rounded-xl overflow-hidden cursor-pointer group bg-[#F1F5F9] border border-[#E2E8F0]"
                >
                  <img
                    src={photoUrl}
                    alt={`Salon photo ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                    Click to Enlarge
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Tab Content: MASTER STYLISTS */}
      {activeTab === 'stylists' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <h3 className="text-base font-bold text-[#111827]">Master Stylists & Grooming Specialists</h3>
          {staff.length === 0 ? (
            <p className="text-xs text-[#64748B] italic">No specific stylists listed. Appointments are served by certified in-house stylists.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((st) => (
                <div
                  key={st.id}
                  className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284C7] font-bold text-sm flex items-center justify-center shrink-0">
                    {st.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'ST'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#111827]">{st.name}</h5>
                    <p className="text-[11px] text-[#64748B]">{st.role || 'Certified Stylist'}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#16A34A] font-semibold mt-1">
                      <CheckCircle2 size={11} /> Available for booking
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Tab Content: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-base font-bold text-[#111827]">Customer Reviews</h3>
              <p className="text-xs text-[#64748B]">All reviews are verified from completed customer visits.</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-[#111827]">{displayRating}</span>
              <span className="text-xs text-[#64748B]"> / 5.0 ({reviewCount} reviews)</span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="text-xs text-[#64748B] py-6 text-center italic">No customer reviews yet. Be the first to review after your visit!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-xs">
                        {rev.customerName?.[0] || 'C'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#111827]">{rev.customerName}</span>
                        {rev.verifiedVisit && (
                          <span className="ml-2 text-[10px] font-semibold text-[#16A34A]">✓ Verified Visit</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#334155]">{rev.comment}</p>

                  {rev.ownerReply && (
                    <div className="mt-2 p-3 bg-white border-l-2 border-[#0EA5E9] rounded-r-lg text-xs space-y-1">
                      <p className="font-semibold text-[#0284C7] text-[11px]">Salon Owner Response</p>
                      <p className="text-[#475569]">{rev.ownerReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. Tab Content: ABOUT & AMENITIES */}
      {activeTab === 'about' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-6">
          {/* About Text */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#111827]">About {salon.name}</h3>
            <p className="text-xs leading-relaxed text-[#475569]">
              {salon.description || 'Welcome to our studio. We pride ourselves on exceptional customer care, master styling skills, and hygienic services.'}
            </p>
          </div>

          {/* Amenities Badges */}
          <div className="space-y-2 pt-4 border-t border-[#F1F5F9]">
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Amenities & Facilities</h4>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(salon.amenities)
                ? salon.amenities
                : (typeof salon.amenities === 'string' && salon.amenities.trim() ? salon.amenities.trim().split(/\s{2,}|\n/) : ['Air Conditioning', 'High-Speed Wi-Fi', 'UPI & Card Accepted', 'UV-Sanitized Tools'])
              ).map((amenity, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#334155]"
                >
                  <CheckCircle2 size={13} className="text-[#0EA5E9]" />
                  <span>{amenity}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Policies */}
          <div className="space-y-3 pt-4 border-t border-[#F1F5F9]">
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Salon Policies</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]">
                <p className="font-semibold text-[#111827] mb-1">Cancellation Policy</p>
                <p className="text-[#64748B]">
                  {salon.policies?.cancellationPolicy || 'Free cancellation up to 2 hours before the scheduled appointment.'}
                </p>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]">
                <p className="font-semibold text-[#111827] mb-1">Grace Period</p>
                <p className="text-[#64748B]">
                  {salon.policies?.lateArrivalPolicy || 'Grace period of 15 minutes applies. Please arrive 5 minutes early.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-all"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxImage}
            alt="Enlarged salon photo"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
