import React from 'react';
import { Search, Compass, CalendarCheck } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';

export default function HowItWorks() {
  const [sectionRef, sectionVisible] = useScrollReveal();

  const steps = [
    { number: '01', title: 'Find', description: 'Discover salons around you.', icon: Search },
    { number: '02', title: 'Choose', description: 'Explore services and find what suits you.', icon: Compass },
    { number: '03', title: 'Visit', description: 'Plan your visit and enjoy your grooming experience.', icon: CalendarCheck },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 md:py-36 bg-[#F7FBFF]">
      <div
        ref={sectionRef}
        className={`max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 ${sectionVisible ? 'reveal-visible' : 'reveal-hidden'}`}
      >
        {/* Section Header with Refined Typography Hierarchy */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20 space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#0EA5E9]">How It Works</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111827]">
            Getting started is simple.
          </h2>
        </div>

        {/* 3 Editorial Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="reveal-child group bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] rounded-2xl p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-bold font-mono tracking-widest text-[#0284C7] bg-[#F0F9FF] px-3 py-1.5 rounded-md border border-[#BAE6FD]/60">
                      STEP {step.number}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#E0F2FE]">
                      <Icon size={22} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-[#111827] tracking-tight mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[15px] text-[#64748B] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="pt-8 mt-6 border-t border-[#F1F5F9] flex items-center text-xs font-semibold tracking-wider text-[#0EA5E9] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Explore Step</span>
                  <span className="ml-1">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}