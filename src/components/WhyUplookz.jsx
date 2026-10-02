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
    <section id="why-uplookz" className="py-20 md:py-24 bg-[#EFF8FF] border-t border-[#E2E8F0]">
      <div ref={sectionRef}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${sectionVisible ? 'reveal-visible' : 'reveal-hidden'}`}>
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2.5">
          <p className="text-xs uppercase tracking-wider font-semibold text-[#0EA5E9]">Why UPLOOKZ</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111827]">Your grooming, made simpler.</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title}
                className="reveal-child card-lift bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] rounded-xl p-6">
                <div className="icon-box w-10 h-10 rounded-lg bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center mb-5">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-[#111827] mb-1.5">{b.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{b.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}