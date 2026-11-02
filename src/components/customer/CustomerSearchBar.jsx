import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Sparkles, Scissors, Store, Clock, ArrowRight } from 'lucide-react';
import { salonClient } from '../../services/salonClient';

export default function CustomerSearchBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedLocation,
  onLocationChange,
  availableLocations = [],
  onSelectSalon,
  onSelectCategory,
  onSelectService
}) {
  const [suggestions, setSuggestions] = useState({ salons: [], services: [], categories: [], locations: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('uplookz_recent_searches') || '[]');
    } catch {
      return [];
    }
  });
  const containerRef = useRef(null);

  // Fetch live suggestions on debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions({ salons: [], services: [], categories: [], locations: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await salonClient.fetchSearchSuggestions(searchQuery.trim());
        if (res && res.success) {
          setSuggestions({
            salons: res.salons || [],
            services: res.services || [],
            categories: res.categories || [],
            locations: res.locations || []
          });
        }
      } catch (err) {
        console.error('Failed to load search suggestions:', err);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener to close suggestion dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem('uplookz_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
    }
    setShowDropdown(false);
    if (onSearchSubmit) onSearchSubmit(searchQuery);
  };

  const handleClear = () => {
    onSearchChange('');
    setSuggestions({ salons: [], services: [], categories: [], locations: [] });
    if (onSearchSubmit) onSearchSubmit('');
  };

  const hasSuggestions =
    suggestions.salons.length > 0 ||
    suggestions.services.length > 0 ||
    suggestions.categories.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={handleFormSubmit}
        className="flex flex-col sm:flex-row items-stretch bg-white border border-[#CBD5E1] rounded-2xl shadow-clean transition-all focus-within:border-[#0EA5E9] focus-within:ring-2 focus-within:ring-[#0EA5E9]/15"
      >
        {/* 1. Location Selector Pill */}
        <div className="flex items-center gap-2 px-4 py-3 sm:py-3.5 border-b sm:border-b-0 sm:border-r border-[#F1F5F9] sm:w-56 shrink-0 bg-[#F8FAFC]/50 rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl">
          <MapPin size={16} className="text-[#0EA5E9] shrink-0" />
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-[#111827] focus:outline-none cursor-pointer truncate"
          >
            <option value="All Locations">All Locations</option>
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Main Search Input */}
        <div className="flex-1 flex items-center px-4 py-2 sm:py-0 relative">
          <Search size={18} className="text-[#94A3B8] shrink-0 mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search salons, services or locations..."
            className="w-full text-sm text-[#111827] placeholder-[#94A3B8] focus:outline-none bg-transparent py-2.5"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-[#94A3B8] hover:text-[#334155] hover:bg-[#F1F5F9] transition-all ml-1"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}

          <button
            type="submit"
            className="ml-3 px-4 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-sm transition-all shrink-0 hidden sm:inline-flex items-center gap-1.5"
          >
            <span>Search</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </form>

      {/* 3. Interactive Suggestion Dropdown */}
      {showDropdown && (hasSuggestions || (recentSearches.length > 0 && !searchQuery)) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2E8F0] rounded-2xl shadow-clean-lg z-50 overflow-hidden divide-y divide-[#F1F5F9] max-h-[460px] overflow-y-auto">
          {/* Recent Searches (shown when search box is empty or focused) */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-[#94A3B8]" /> Recent Searches
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRecentSearches([]);
                    try {
                      localStorage.removeItem('uplookz_recent_searches');
                    } catch {}
                  }}
                  className="hover:text-[#0EA5E9] transition-colors"
                >
                  Clear History
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSearchChange(term);
                      saveRecentSearch(term);
                      setShowDropdown(false);
                      if (onSearchSubmit) onSearchSubmit(term);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#E0F2FE] hover:text-[#0284C7] border border-[#E2E8F0] text-xs font-medium text-[#334155] transition-all"
                  >
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group 1: Matching Salons */}
          {suggestions.salons.length > 0 && (
            <div className="p-3">
              <p className="px-2 pb-1.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Store size={12} className="text-[#0EA5E9]" /> Salons
              </p>
              <div className="space-y-1">
                {suggestions.salons.map((salon) => (
                  <button
                    key={salon.id}
                    type="button"
                    onClick={() => {
                      saveRecentSearch(salon.name);
                      setShowDropdown(false);
                      if (onSelectSalon) onSelectSalon(salon.id);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#F0F9FF] text-left transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] overflow-hidden shrink-0 border border-[#E2E8F0]">
                      {salon.cover || salon.logo ? (
                        <img
                          src={salon.cover || salon.logo}
                          alt={salon.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                          <Store size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#111827] group-hover:text-[#0284C7] truncate">
                        {salon.name}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate flex items-center gap-1">
                        <MapPin size={10} /> {salon.city || 'Mumbai'}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#0EA5E9] font-medium shrink-0 group-hover:translate-x-0.5 transition-transform">
                      View Salon →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group 2: Matching Services */}
          {suggestions.services.length > 0 && (
            <div className="p-3">
              <p className="px-2 pb-1.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Scissors size={12} className="text-[#0EA5E9]" /> Services
              </p>
              <div className="space-y-1">
                {suggestions.services.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      saveRecentSearch(srv.name);
                      setShowDropdown(false);
                      if (onSelectService) {
                        onSelectService(srv);
                      } else if (onSelectSalon) {
                        onSelectSalon(srv.salonId);
                      }
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F0F9FF] text-left transition-all group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                        <Scissors size={13} />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-[#111827] group-hover:text-[#0284C7] truncate">
                          {srv.name}
                        </p>
                        <p className="text-[11px] text-[#64748B] truncate">
                          Available at <strong className="text-[#334155]">{srv.salonName}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className="text-xs font-bold text-[#111827]">₹{srv.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group 3: Popular Categories Match */}
          {suggestions.categories.length > 0 && (
            <div className="p-3 bg-[#F8FAFC]/50">
              <p className="px-2 pb-1.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#0EA5E9]" /> Category Suggestions
              </p>
              <div className="flex flex-wrap gap-1.5 px-2">
                {suggestions.categories.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      saveRecentSearch(cat);
                      setShowDropdown(false);
                      if (onSelectCategory) onSelectCategory(cat);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white hover:bg-[#0EA5E9] hover:text-white border border-[#CBD5E1] text-xs font-semibold text-[#334155] transition-all"
                  >
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
