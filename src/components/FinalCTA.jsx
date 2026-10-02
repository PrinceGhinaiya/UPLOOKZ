import React from 'react';
import { ArrowRight } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';

export default function FinalCTA({ onNavigate }) {
  const [sectionRef, sectionVisible] = useScrollReveal();

  return (
    <section className="py-20 md:py-24 border-t border-[#E2E8F0]/60 relative overflow-hidden cta-shimmer"
      style={{ background: 'linear-gradient(135deg, #EFF8FF 0%, #F7FBFF 40%, #EFF8FF 70%, #F7FBFF 100%)' }}>
      {/* Floating orbs */}
      <div className="float-a absolute top-8 right-1/4 w-32 h-32 rounded-full bg-[#E0F2FE] opacity-40 blur-2xl pointer-events-none" />
      <div className="float-b absolute bottom-10 left-1/4 w-28 h-28 rounded-full bg-[#BAE6FD] opacity-30 blur-2xl pointer-events-none" />

      <div ref={sectionRef}
        className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 relative z-10 ${sectionVisible ? 'reveal-visible' : 'reveal-hidden'}`}>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111827]">
          Your time matters.<br />
          <span className="text-[#0EA5E9]">Your look matters.</span>
        </h2>
        <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto">
          Upgrade your grooming experience with UPLOOKZ.
        </p>
        <div className="pt-3">
          <a href="/signup" onClick={(e) => onNavigate(e, '/signup', 'Signup / Get Started flow')}
            className="btn-lift inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-medium text-base shadow-sm">
            <span>Get Started</span>
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}