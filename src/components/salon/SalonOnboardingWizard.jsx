import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Clock,
  Scissors,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { salonClient } from '../../services/salonClient';

export default function SalonOnboardingWizard({ currentUser, onComplete }) {
  const [step, setStep] = useState(1);
  const [salonName, setSalonName] = useState(currentUser?.salonName || '');
  const [tagline, setTagline] = useState('Premium Unisex Grooming & Styling');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 ');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(currentUser?.city || 'Mumbai');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('21:00');
  const [amenities, setAmenities] = useState([
    'Air Conditioning',
    'High-Speed Wi-Fi',
    'UPI & Card Accepted',
    'UV-Sanitized Tools'
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggleAmenity = (item) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleFinalSubmit = async () => {
    if (!salonName.trim()) {
      setError('Please provide your salon name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await salonClient.createSalon({
        name: salonName.trim(),
        tagline: tagline.trim(),
        description: description.trim() || 'Modern professional unisex grooming salon.',
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim() || 'Main High Street',
        city: city.trim(),
        openingTime,
        closingTime,
        amenities,
        ownerName: currentUser?.name || 'Salon Partner'
      });
      if (res.salon) {
        onComplete(res.salon);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete salon setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FBFF] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-clean-lg max-w-xl w-full p-6 sm:p-10 space-y-6">
        
        {/* Step Indicator */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
            <Store size={14} className="text-[#0EA5E9]" />
            <span>Salon Partner Onboarding • Step {step} of 3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
            {step === 1 && 'Welcome! Name Your Salon'}
            {step === 2 && 'Location & Contact Details'}
            {step === 3 && 'Operating Hours & Amenities'}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            {step === 1 && 'Set up your business identity for clients to discover on UPLOOKZ.'}
            {step === 2 && 'Provide where clients can find your salon and reach out.'}
            {step === 3 && 'Choose your working hours and available in-salon comforts.'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Step 1: Business Identity */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Salon / Studio Name *</label>
              <input
                type="text"
                required
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                placeholder="e.g. Apex Studio & Grooming"
                className="w-full px-4 py-2.5 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Tagline or Catchphrase</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Premium Unisex Styling & Executive Grooming"
                className="w-full px-4 py-2.5 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">About Your Salon</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share your grooming philosophy, services offered, and team experience..."
                className="w-full px-4 py-2.5 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!salonName.trim()) {
                    setError('Please enter your salon name to continue.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className="btn-lift w-full py-3 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Location</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location & Contact */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 01234"
                  className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Business Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="salon@example.com"
                  className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">City / Area *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai, Bandra West"
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot 42, Linking Road, Near Bandra Station"
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC] text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!phone.trim() || !city.trim()) {
                    setError('Please provide phone number and city.');
                    return;
                  }
                  setError('');
                  setStep(3);
                }}
                className="btn-lift flex-1 py-3 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Operating Hours</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Hours & Amenities */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Opening Time</label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Closing Time</label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-2">Available Amenities</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Air Conditioning',
                  'High-Speed Wi-Fi',
                  'Free Dedicated Parking',
                  'Complimentary Espresso & Drinks',
                  'UPI & Card Accepted',
                  'UV-Sanitized Tools'
                ].map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => handleToggleAmenity(item)}
                    className={`p-2 rounded-xl text-left border text-xs font-medium transition-all ${
                      amenities.includes(item)
                        ? 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]'
                        : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {amenities.includes(item) ? '✓ ' : '+ '} {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC] text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleFinalSubmit}
                className="btn-lift flex-1 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={17} />
                <span>{loading ? 'Launching Storefront...' : 'Launch My Salon Dashboard'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
