import React from 'react';
import { Search, Compass, Calendar, ArrowRight, Star, Sparkles, MapPin } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';

export default function HowItWorks({ onNavigate }) {
  const [sectionRef, sectionVisible] = useScrollReveal();

  const handleCTA = (e) => {
    if (onNavigate) {
      onNavigate(e, '/signup', 'Get Started');
    }
  };

  return (
    <section id="how-it-works" className="py-24 sm:py-28 lg:py-32 bg-[#FAFDFE] relative overflow-hidden">

      {/* Background Soft Pastel Ambient Haze (matching screenshot glow) */}
      <div className="absolute top-1/4 left-1/12 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-amber-200/30 via-orange-100/25 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[300px] rounded-full bg-gradient-to-r from-purple-200/25 via-pink-100/25 to-sky-100/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/12 w-[350px] h-[350px] rounded-full bg-gradient-to-bl from-pink-200/25 via-cyan-100/25 to-transparent blur-3xl pointer-events-none" />

      {/* Dotted Flow Connector Trail behind cards */}
      <div className="hidden lg:block absolute top-[58%] left-8 right-8 pointer-events-none z-0">
        <svg className="w-full h-24" viewBox="0 0 1200 100" fill="none" preserveAspectRatio="none">
          <path
            d="M 50 60 Q 300 20, 600 50 T 1150 40"
            stroke="#BAE6FD"
            strokeWidth="1.8"
            strokeDasharray="6 6"
            strokeOpacity="0.8"
          />
        </svg>
      </div>

      <div
        ref={sectionRef}
        className={`max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 ${
          sectionVisible ? 'reveal-visible' : 'reveal-hidden'
        }`}
      >
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#0284C7]">
            HOW IT WORKS
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111827]">
            Getting started is simple.
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] font-normal pt-1">
            Discover. Book. Look Good. A seamless grooming journey in three steps.
          </p>
        </div>

        {/* 3 Step Cards Grid with Connecting Arrows */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-10 items-stretch">

          {/* Purely visual flow arrows between cards on desktop */}
          <div className="hidden lg:flex absolute left-[32.2%] top-1/2 -translate-y-1/2 z-20 text-[#94A3B8] items-center justify-center pointer-events-none">
            <ArrowRight size={22} strokeWidth={1.75} />
          </div>
          <div className="hidden lg:flex absolute left-[65.5%] top-1/2 -translate-y-1/2 z-20 text-[#94A3B8] items-center justify-center pointer-events-none">
            <ArrowRight size={22} strokeWidth={1.75} />
          </div>

          {/* ======================================================== */}
          {/* CARD 1: FIND */}
          {/* ======================================================== */}
          <div className="reveal-child group bg-white/95 backdrop-blur-sm border border-[#E2E8F0]/90 rounded-[28px] p-6 sm:p-7 shadow-[0_15px_35px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_45px_rgba(14,165,233,0.12)] hover:border-[#BAE6FD] transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
            
            {/* Subtle inside wave accent */}
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-gradient-to-tr from-[#E0F2FE]/50 to-transparent pointer-events-none" />
            <Sparkles size={16} className="absolute top-6 right-8 text-[#38BDF8] opacity-70" />
            <Sparkles size={12} className="absolute bottom-12 left-6 text-[#38BDF8] opacity-60" />

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center relative z-10 h-full">
              
              {/* Left Info: Icon, Title, Description */}
              <div className="sm:col-span-5 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center border border-[#BAE6FD]/60 shadow-sm">
                  <Search size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#111827] tracking-tight">Find</h3>
                  <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
                    Discover salons around you.
                  </p>
                </div>
              </div>

              {/* Right Mini App Preview: Map + Salon list + Explore Step */}
              <div className="sm:col-span-7 flex justify-center sm:justify-end">
                <div className="w-[178px] bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 space-y-2 relative transition-transform duration-300 group-hover:scale-[1.02]">
                  
                  {/* Map Mockup */}
                  <div className="h-20 w-full bg-[#EBF3F8] rounded-xl relative overflow-hidden border border-slate-100 flex items-center justify-center">
                    {/* Road grid lines */}
                    <div className="absolute inset-0 opacity-40">
                      <div className="absolute top-4 left-0 right-0 h-[3px] bg-white" />
                      <div className="absolute top-12 left-0 right-0 h-[4px] bg-white" />
                      <div className="absolute top-0 bottom-0 left-8 w-[3px] bg-white" />
                      <div className="absolute top-0 bottom-0 left-24 w-[4px] bg-white" />
                      <div className="absolute top-0 bottom-0 right-6 w-[2px] bg-white" />
                    </div>

                    {/* Map Pins */}
                    <div className="absolute top-2 left-6 w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-sm">
                      <MapPin size={9} />
                    </div>
                    <div className="absolute top-3 right-8 w-4 h-4 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-sm">
                      <MapPin size={9} />
                    </div>
                    <div className="absolute bottom-3 left-10 w-3.5 h-3.5 rounded-full bg-sky-400 text-white flex items-center justify-center shadow-sm">
                      <MapPin size={8} />
                    </div>

                    {/* UPLOOKZ center featured marker */}
                    <div className="w-6 h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center shadow-md font-bold text-[10px] border border-white z-10">
                      U
                    </div>
                  </div>

                  {/* Mini Salon List */}
                  <div className="space-y-1.5 pt-0.5">
                    {/* Salon 1 */}
                    <div className="flex items-center justify-between bg-slate-50/70 p-1.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <img
                          src="/images/hero-1.jpg"
                          alt="The Modern Barber"
                          className="w-6 h-6 rounded-md object-cover"
                        />
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-[#111827] leading-tight truncate w-20">
                            The Modern Barber
                          </p>
                          <p className="text-[8px] text-[#64748B] leading-none">Salon · Salon</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-[9px] font-bold text-[#111827]">
                        <Star size={8} className="fill-amber-400 text-amber-400" />
                        <span>4.8</span>
                      </div>
                    </div>

                    {/* Salon 2 */}
                    <div className="flex items-center justify-between bg-slate-50/70 p-1.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <img
                          src="/images/hero-2.jpg"
                          alt="Gent's Co."
                          className="w-6 h-6 rounded-md object-cover"
                        />
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-[#111827] leading-tight truncate w-20">
                            Gent's Co.
                          </p>
                          <p className="text-[8px] text-[#64748B] leading-none">Salon · Salon</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-[9px] font-bold text-[#111827]">
                        <Star size={8} className="fill-amber-400 text-amber-400" />
                        <span>4.5</span>
                      </div>
                    </div>
                  </div>

                  {/* Explore Step Button with Cursor */}
                  <div className="relative pt-1">
                    <button className="w-full bg-[#0284C7] hover:bg-[#0369A1] text-white text-[11px] font-semibold py-1.5 px-3 rounded-lg shadow-sm transition-colors text-center block">
                      Explore Step
                    </button>
                    {/* White clicking cursor */}
                    <div className="absolute right-3 bottom-0 translate-y-2 pointer-events-none drop-shadow">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="#111827" strokeWidth="1.5">
                        <path d="M4 4l7 17 2.5-6.5L20 12 4 4z" />
                      </svg>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* CARD 2: CHOOSE */}
          {/* ======================================================== */}
          <div className="reveal-child group bg-white/95 backdrop-blur-sm border border-[#E2E8F0]/90 rounded-[28px] p-6 sm:p-7 shadow-[0_15px_35px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_45px_rgba(14,165,233,0.12)] hover:border-[#BAE6FD] transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
            
            {/* Subtle inside wave accent */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-tl from-[#E0F2FE]/50 to-transparent pointer-events-none" />

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center relative z-10 h-full">
              
              {/* Left Info: Icon, Title, Description */}
              <div className="sm:col-span-5 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center border border-[#BAE6FD]/60 shadow-sm">
                  <Compass size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#111827] tracking-tight">Choose</h3>
                  <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
                    Explore services and find what suits you.
                  </p>
                </div>
              </div>

              {/* Right Mini App Preview: Categories + Service List + Choose Services */}
              <div className="sm:col-span-7 flex justify-center sm:justify-end">
                <div className="w-[178px] bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 space-y-2 relative transition-transform duration-300 group-hover:scale-[1.02]">
                  
                  {/* Category Pills */}
                  <div className="flex items-center gap-1 overflow-hidden pb-1 border-b border-slate-100 text-[8px] font-semibold">
                    <span className="bg-[#0284C7] text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                      Categories
                    </span>
                    <span className="text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      Beard Trims
                    </span>
                    <span className="text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      Facial
                    </span>
                  </div>

                  {/* Services List */}
                  <div className="space-y-1.5 text-left">
                    {/* Item 1 */}
                    <div>
                      <p className="text-[7px] font-bold tracking-wider text-[#64748B] uppercase">HAIRCUTS</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-[#111827] leading-tight">Haircuts</p>
                          <p className="text-[7.5px] text-[#94A3B8]">Service Service</p>
                          <p className="text-[9px] font-bold text-[#0284C7] mt-0.5">₹350</p>
                        </div>
                        <img
                          src="/images/hero-2.jpg"
                          alt="Haircut service"
                          className="w-7 h-7 rounded-md object-cover border border-slate-100"
                        />
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="pt-0.5 border-t border-slate-100">
                      <p className="text-[7px] font-bold tracking-wider text-[#64748B] uppercase">BEARD TRIMS</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-[#111827] leading-tight">Beard Trims</p>
                          <p className="text-[7.5px] text-[#94A3B8]">Service Service</p>
                          <p className="text-[9px] font-bold text-[#0284C7] mt-0.5">₹350</p>
                        </div>
                        <img
                          src="/images/hero-1.jpg"
                          alt="Beard trim service"
                          className="w-7 h-7 rounded-md object-cover border border-slate-100"
                        />
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="pt-0.5 border-t border-slate-100">
                      <p className="text-[7px] font-bold tracking-wider text-[#64748B] uppercase">FACIALS</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-[#111827] leading-tight">Facials</p>
                          <p className="text-[7.5px] text-[#94A3B8]">Service Service</p>
                        </div>
                        <img
                          src="/images/hero-3.jpg"
                          alt="Facial service"
                          className="w-7 h-7 rounded-md object-cover border border-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Choose Services Button */}
                  <div className="pt-1">
                    <button className="w-full bg-[#0284C7] hover:bg-[#0369A1] text-white text-[11px] font-semibold py-1.5 px-3 rounded-lg shadow-sm transition-colors text-center block">
                      Choose Services
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* CARD 3: VISIT */}
          {/* ======================================================== */}
          <div className="reveal-child group bg-white/95 backdrop-blur-sm border border-[#E2E8F0]/90 rounded-[28px] p-6 sm:p-7 shadow-[0_15px_35px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_45px_rgba(14,165,233,0.12)] hover:border-[#BAE6FD] transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
            
            {/* Subtle inside wave accent */}
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-gradient-to-tr from-[#E0F2FE]/50 to-transparent pointer-events-none" />

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center relative z-10 h-full">
              
              {/* Left Info: Icon, Title, Description */}
              <div className="sm:col-span-5 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center border border-[#BAE6FD]/60 shadow-sm">
                  <Calendar size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#111827] tracking-tight">Visit</h3>
                  <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
                    Plan your visit and enjoy your grooming experience.
                  </p>
                </div>
              </div>

              {/* Right Mini App Preview: Appointment confirmation */}
              <div className="sm:col-span-7 flex justify-center sm:justify-end">
                <div className="w-[178px] bg-white rounded-2xl shadow-xl border border-slate-100 p-3 space-y-2.5 text-center relative transition-transform duration-300 group-hover:scale-[1.02]">
                  
                  {/* Calendar Top Icon Badge */}
                  <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mx-auto shadow-sm">
                    <Calendar size={16} />
                  </div>

                  {/* Confirmation Title */}
                  <div>
                    <h4 className="text-[11px] font-bold text-[#111827] leading-tight">
                      Appointment confirmation
                    </h4>
                  </div>

                  {/* Customer Row */}
                  <div className="flex items-center justify-center gap-2 pt-0.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
                      <img
                        src="/images/hero-1.jpg"
                        alt="Ankit Sharma"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-[#111827] leading-none">Ankit Sharma</p>
                      <p className="text-[8px] text-[#64748B] mt-0.5">Customer</p>
                    </div>
                  </div>

                  {/* Date & Time Boxes */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-100 text-left">
                      <p className="text-[7.5px] text-[#64748B] leading-none">Date</p>
                      <p className="text-[9.5px] font-bold text-[#111827] mt-0.5">Aug 28, 2024</p>
                    </div>
                    <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-100 text-left">
                      <p className="text-[7.5px] text-[#64748B] leading-none">Time</p>
                      <p className="text-[9.5px] font-bold text-[#111827] mt-0.5">3:00 PM</p>
                    </div>
                  </div>

                  {/* View Details Outlined Button */}
                  <div className="pt-1">
                    <button className="w-full bg-white hover:bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD] text-[10px] font-semibold py-1.5 px-3 rounded-lg shadow-sm transition-colors text-center block">
                      View Details
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Centered CTA Button and Footnote */}
        <div className="mt-14 sm:mt-16 text-center">
          <a
            href="/signup"
            onClick={handleCTA}
            className="inline-flex items-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-sm sm:text-[15px] px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </a>

          <p className="text-xs text-[#94A3B8] font-normal mt-3.5">
            Exciting microactions for booking fee.
          </p>
        </div>

      </div>
    </section>
  );
}