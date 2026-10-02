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
    <section id="how-it-works" className="py-20 md:py-24 bg-[#F7FBFF]">
      <div ref={sectionRef}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${sectionVisible ? 'reveal-visible' : 'reveal-hidden'}`}>
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2.5">
          <p className="text-xs uppercase tracking-wider font-semibold text-[#0EA5E9]">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111827]">Getting started is simple.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number}
                className="reveal-child card-lift bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] rounded-xl p-7">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold text-[#0284C7] bg-[#F0F9FF] px-2.5 py-1 rounded-md border border-[#BAE6FD]/60">
                    Step {step.number}
                  </span>
                  <div className="icon-box w-10 h-10 rounded-lg bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center">
                    <Icon size={19} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-2">{step.title}</h3>
                <p className="text-[15px] text-[#64748B] leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}