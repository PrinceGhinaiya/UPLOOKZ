import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Sparkles,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { salonClient } from '../../services/salonClient';

export default function SalonProfileTab({ salon, onUpdateSalonProfile, onRefresh }) {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('21:00');
  const [workingDays, setWorkingDays] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [cancellationHours, setCancellationHours] = useState('2');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [lateArrivalMinutes, setLateArrivalMinutes] = useState('15');
  const [lateArrivalPolicy, setLateArrivalPolicy] = useState('');
  const [walkInPolicy, setWalkInPolicy] = useState('');
  const [logo, setLogo] = useState('');
  const [gallery, setGallery] = useState([]);

  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (salon) {
      setName(salon.name || '');
      setTagline(salon.tagline || '');
      setDescription(salon.description || '');
      setPhone(salon.phone || '');
      setEmail(salon.email || '');
      setAddress(salon.address || '');
      setCity(salon.city || '');
      setState(salon.state || '');
      setPincode(salon.pincode || '');
      setOpeningTime(salon.openingTime || '09:00');
      setClosingTime(salon.closingTime || '21:00');
      setWorkingDays(salon.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
      setAmenities(salon.amenities || []);
      setSpecialties(salon.specialties || []);
      setCancellationHours(String(salon.policies?.cancellationHours || '2'));
      setCancellationPolicy(salon.policies?.cancellationPolicy || '');
      setLateArrivalMinutes(String(salon.policies?.lateArrivalMinutes || '15'));
      setLateArrivalPolicy(salon.policies?.lateArrivalPolicy || '');
      setWalkInPolicy(salon.policies?.walkInPolicy || '');
      setLogo(salon.logo || '');
      setGallery(salon.gallery || []);
    }
  }, [salon]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const allAmenitiesList = [
    'Air Conditioning',
    'High-Speed Wi-Fi',
    'Free Dedicated Parking',
    'Complimentary Espresso & Infused Water',
    'UPI & Card Accepted',
    'UV-Sanitized Tools',
    'Unisex Waiting Lounge',
    'Wheelchair Accessible',
    'Kids Friendly',
    'VIP Grooming Suite'
  ];

  const handleToggleDay = (day) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleToggleAmenity = (amenity) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddSpecialty = (e) => {
    e.preventDefault();
    if (newSpecialtyInput.trim() && !specialties.includes(newSpecialtyInput.trim())) {
      setSpecialties([...specialties, newSpecialtyInput.trim()]);
      setNewSpecialtyInput('');
    }
  };

  const handleRemoveSpecialty = (item) => {
    setSpecialties(specialties.filter((s) => s !== item));
  };

  // Image Upload Handler
  const handleImageUpload = async (e, type = 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await salonClient.uploadImage(reader.result, file.name);
        if (res.success && res.url) {
          if (type === 'logo') {
            setLogo(res.url);
          } else {
            setGallery((prev) => [...prev, res.url]);
          }
        }
      } catch (err) {
        alert(err.message || 'Image upload failed.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Salon name is required.');
      return;
    }

    setSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      await onUpdateSalonProfile({
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        openingTime,
        closingTime,
        workingDays,
        amenities,
        specialties,
        policies: {
          cancellationHours: parseInt(cancellationHours, 10),
          cancellationPolicy: cancellationPolicy.trim(),
          lateArrivalMinutes: parseInt(lateArrivalMinutes, 10),
          lateArrivalPolicy: lateArrivalPolicy.trim(),
          walkInPolicy: walkInPolicy.trim()
        },
        logo,
        gallery
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to update salon profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Salon Profile & Storefront
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage your salon identity, gallery, address, working hours, amenities, and booking policies.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn-lift inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all shrink-0 disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} />
          <span>Salon profile updated successfully! All changes are live for client bookings.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Basic Brand Identity */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Store size={16} className="text-[#0EA5E9]" />
            Basic Business Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Salon / Studio Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Studio & Grooming"
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Tagline / Motto</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Premium Unisex Styling & Executive Grooming"
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] text-xs mb-1">About the Salon / Story</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your studio ambiance, team experience, and customer promise..."
              className="w-full px-3.5 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>
        </div>

        {/* Section 2: Contact & Location */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <MapPin size={16} className="text-[#0EA5E9]" />
            Contact & Location Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Business Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 01234"
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Business Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="salon@example.com"
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-[#334155] mb-1">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Plot 42, Linking Road, Near Bandra Station"
              className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">City / Neighborhood</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai, Bandra West"
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="400050"
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Operating Hours & Working Days */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Clock size={16} className="text-[#0EA5E9]" />
            Opening Hours & Weekly Schedule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Opening Time</label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">Closing Time</label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-[#334155] mb-2">Weekly Working Days</label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleToggleDay(day)}
                  className={`px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                    workingDays.includes(day)
                      ? 'bg-[#0EA5E9] text-white border-[#0EA5E9] shadow-sm'
                      : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Amenities & Facilities */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Sparkles size={16} className="text-[#0EA5E9]" />
            Amenities & Salon Facilities
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {allAmenitiesList.map((amenity) => (
              <label
                key={amenity}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={amenities.includes(amenity)}
                  onChange={() => handleToggleAmenity(amenity)}
                  className="rounded text-[#0EA5E9] focus:ring-[#0EA5E9]"
                />
                <span className="font-medium text-[#334155]">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 5: Specialties & Categories */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Sparkles size={16} className="text-[#0EA5E9]" />
            Specialties & Signature Services
          </h3>

          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialty(s)}
                  className="hover:text-red-600"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newSpecialtyInput}
              onChange={(e) => setNewSpecialtyInput(e.target.value)}
              placeholder="e.g. Keratin Smoothing, HydraFacial..."
              className="flex-1 px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
            <button
              type="button"
              onClick={handleAddSpecialty}
              className="px-3 py-1.5 rounded-lg bg-[#0EA5E9] text-white text-xs font-semibold hover:bg-[#0284C7]"
            >
              Add
            </button>
          </div>
        </div>

        {/* Section 6: Policies (Cancellation, Late Arrival, Walk-In) */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#0EA5E9]" />
            Booking & Cancellation Policies
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">
                Free Cancellation Window (Hours prior to appointment)
              </label>
              <input
                type="number"
                min="0"
                value={cancellationHours}
                onChange={(e) => setCancellationHours(e.target.value)}
                placeholder="2"
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#334155] mb-1">
                Late Arrival Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="0"
                value={lateArrivalMinutes}
                onChange={(e) => setLateArrivalMinutes(e.target.value)}
                placeholder="15"
                className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-[#334155] mb-1">Cancellation Policy Statement</label>
            <input
              type="text"
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
              placeholder="e.g. Free cancellation up to 2 hours prior to scheduled appointment time."
              className="w-full px-3.5 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-[#334155] mb-1">Late Arrival Policy Statement</label>
            <input
              type="text"
              value={lateArrivalPolicy}
              onChange={(e) => setLateArrivalPolicy(e.target.value)}
              placeholder="e.g. Please arrive 5 minutes early. Appointments may be adjusted if arrival exceeds 15 minutes."
              className="w-full px-3.5 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>
        </div>

        {/* Section 7: Gallery & Image Upload */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-clean space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <ImageIcon size={16} className="text-[#0EA5E9]" />
            Salon Storefront Photos & Gallery
          </h3>

          <div className="flex flex-wrap gap-4 items-center">
            {gallery.map((imgUrl, idx) => (
              <div key={idx} className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#E2E8F0] group">
                <img src={imgUrl} alt="Salon preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setGallery(gallery.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            <label className="w-28 h-28 rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#0EA5E9] flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors text-xs text-[#64748B]">
              <Upload size={18} className="text-[#0EA5E9] mb-1" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'gallery')}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-lift inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <CheckCircle2 size={17} />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
