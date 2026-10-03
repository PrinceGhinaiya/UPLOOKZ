import React from 'react';
import { Clock, Compass, CheckCircle2, Sparkles } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';

export default function WhyUplookz() {
  const [sectionRef, sectionVisible] = useScrollReveal();

  const benefits = [
    { title: 'Save Time', description: 'Plan visits and skip the wait.', icon: Clock },
    { title: 'Discover Salons', description: 'Find trusted salons near you.', icon: Compass },
    { title: 'Easy Experience', description: 'Clear services, transparent options.', icon: CheckCircle2 },
    { title: 'Better Grooming', description: 'Connect with verified professionals.', icon: Sparkles },
  ];

  return (
    <section id="why-uplookz" className="py-24 sm:py-32 md:py-36 bg-[#EFF8FF] border-t border-[#E2E8F0]">
      <div
        ref={sectionRef}
        className={`max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 ${sectionVisible ? 'reveal-visible' : 'reveal-hidden'}`}
      >
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20 space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#0EA5E9]">Why UPLOOKZ</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111827]">
            Your grooming, made simpler.
          </h2>
        </div>

        {/* 4 Benefit Cards with Generous Whitespace */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-8">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="reveal-child group bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center mb-7 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#E0F2FE]">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-[#111827] tracking-tight mb-2.5">
                    {b.title}
                  </h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}