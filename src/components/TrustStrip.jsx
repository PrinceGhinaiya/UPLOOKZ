import React from 'react';
import { Check, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function TrustStrip() {
  const items = [
    { label: 'Trusted salons', icon: Check },
    { label: 'Save your time', icon: Clock },
    { label: 'Men & Women', icon: Sparkles },
    { label: 'Simple experience', icon: CheckCircle2 },
  ];

  return (
    <section className="bg-white border-y border-[#E2E8F0] py-6 sm:py-7">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 items-center justify-center">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-center gap-3 text-[14px] font-medium text-[#111827] group">
                <div className="w-6 h-6 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                  <Icon size={13} strokeWidth={2.5} />
                </div>
                <span className="tracking-wide">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}