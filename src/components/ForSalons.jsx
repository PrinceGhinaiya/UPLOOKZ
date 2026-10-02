import React from 'react';
import { ArrowRight, Store, Check, Star } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';

export default function ForSalons({ onNavigate }) {
  const [sectionRef, sectionVisible] = useScrollReveal();

  return (
    <section id="for-salons" className="py-20 md:py-24 bg-[#F0F9FF] border-t border-[#E0F2FE]">
      <div ref={sectionRef}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${sectionVisible ? 'reveal-visible' : 'reveal-hidden'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Text & CTA */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#BAE6FD] text-xs font-semibold text-[#0284C7]">
              <Store size={14} className="text-[#0EA5E9]" />
              <span>For Salon Partners</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111827] leading-tight">
              Grow your salon with UPLOOKZ.
            </h2>
            <p className="text-base text-[#64748B] leading-relaxed max-w-lg">
              Bring your salon online and connect with customers through a simple digital experience.
            </p>
            <div className="space-y-2.5">
              {['Reach clients looking for quality grooming', 'Present unisex services with transparent menus', 'Offer clients a modern and predictable visit'].map((t) => (
                <div key={t} className="flex items-center gap-3 text-sm text-[#111827]">
                  <div className="w-5 h-5 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <a href="/salon/register" onClick={(e) => onNavigate(e, '/salon/register', 'Salon Registration')}
              className="btn-lift inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-medium text-[15px] shadow-sm">
              <span>Join as a Salon</span>
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Right: Salon preview — continuous gentle float */}
          <div className="reveal-child max-w-md mx-auto lg:ml-auto">
            <div className="salon-float bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-clean-lg space-y-5">

              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold">U</div>
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">Apex Studio & Grooming</h4>
                    <p className="text-xs text-[#64748B]">Verified Partner</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F7FBFF] border border-[#E2E8F0] rounded-lg p-3">
                  <p className="text-xs text-[#64748B] mb-0.5">Rating</p>
                  <div className="flex items-center gap-1 font-bold text-[#111827]">
                    4.9 <Star size={13} className="fill-amber-400 text-amber-400" />
                  </div>
                </div>
                <div className="bg-[#F7FBFF] border border-[#E2E8F0] rounded-lg p-3">
                  <p className="text-xs text-[#64748B] mb-0.5">Status</p>
                  <p className="font-bold text-[#111827]">Online</p>
                </div>
              </div>

              <div className="bg-[#F7FBFF] border border-[#E2E8F0] rounded-lg p-3 space-y-2">
                {['Haircut & Styling', 'Beard Grooming', 'Hair Spa'].map((s) => (
                  <div key={s} className="flex items-center justify-between text-xs">
                    <span className="text-[#111827] font-medium">{s}</span>
                    <span className="text-[#0284C7] font-medium">Available</span>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-[#F0F9FF] rounded-lg border border-[#BAE6FD] flex items-center justify-between text-xs">
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