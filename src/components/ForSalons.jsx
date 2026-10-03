import React from 'react';
import { ArrowRight, Store, Check, Star } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';

export default function ForSalons({ onNavigate }) {
  const [sectionRef, sectionVisible] = useScrollReveal();

  return (
    <section id="for-salons" className="py-24 sm:py-32 md:py-36 bg-[#F0F9FF] border-t border-[#E0F2FE]">
      <div
        ref={sectionRef}
        className={`max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 ${sectionVisible ? 'reveal-visible' : 'reveal-hidden'}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Left Column: Text & CTA */}
          <div className="space-y-8 reveal-child">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#BAE6FD] text-xs font-semibold text-[#0284C7] shadow-sm">
              <Store size={14} className="text-[#0EA5E9]" />
              <span className="tracking-wide">For Salon Partners</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#111827] leading-[1.15]">
              Grow your salon with UPLOOKZ.
            </h2>

            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-lg">
              Bring your salon online and connect with customers through a simple digital experience.
            </p>

            <div className="space-y-3.5 pt-1">
              {[
                'Reach clients looking for quality grooming',
                'Present unisex services with transparent menus',
                'Offer clients a modern and predictable visit',
              ].map((t) => (
                <div key={t} className="flex items-center gap-3.5 text-[15px] text-[#111827]">
                  <div className="w-5 h-5 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="font-normal">{t}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <a
                href="/salon/register"
                onClick={(e) => onNavigate(e, '/salon/register', 'Salon Registration')}
                className="btn-lift inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-[15px] shadow-lg shadow-[#0EA5E9]/20 transition-all duration-300"
              >
                <span>Join as a Salon</span>
                <ArrowRight size={17} />
              </a>
            </div>
          </div>

          {/* Right Column: Clean Salon Storefront Preview Card */}
          <div className="reveal-child max-w-md mx-auto lg:ml-auto w-full">
            <div className="salon-float bg-white rounded-2xl border border-[#BAE6FD] p-7 shadow-xl shadow-[#0EA5E9]/5 space-y-6">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-lg shadow-sm">
                    U
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#111827]">Apex Studio & Grooming</h4>
                    <p className="text-xs text-[#64748B]">Verified Partner</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  Active
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-3.5">
                  <p className="text-xs text-[#64748B] mb-0.5">Rating</p>
                  <div className="flex items-center gap-1 font-bold text-base text-[#111827]">
                    4.9 <Star size={14} className="fill-amber-400 text-amber-400" />
                  </div>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-3.5">
                  <p className="text-xs text-[#64748B] mb-0.5">Status</p>
                  <p className="font-bold text-base text-[#111827]">Online</p>
                </div>
              </div>

              {/* Services */}
              <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-4 space-y-2.5">
                {['Haircut & Styling', 'Beard Grooming', 'Hair Spa'].map((s) => (
                  <div key={s} className="flex items-center justify-between text-xs sm:text-[13px]">
                    <span className="text-[#111827] font-medium">{s}</span>
                    <span className="text-[#0284C7] font-semibold">Available</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-3 bg-[#F0F9FF] rounded-xl border border-[#BAE6FD] flex items-center justify-between text-xs">
                <span className="text-[#0284C7] font-medium">Digital Salon Storefront</span>
                <span className="text-[#64748B]">Powered by UPLOOKZ</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}