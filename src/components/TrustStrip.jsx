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
    <section className="bg-[#EFF8FF] border-y border-[#E2E8F0] py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center justify-center">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-center gap-2 text-[14px] font-medium text-[#111827]">
                <div className="w-5 h-5 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                  <Icon size={12} strokeWidth={2.5} />
                </div>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}