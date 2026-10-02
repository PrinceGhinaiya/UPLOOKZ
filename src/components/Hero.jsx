import React from 'react';
import { ArrowRight } from 'lucide-react';

const IMG_A = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80';
const IMG_B = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80';
const IMG_C = 'https://images.unsplash.com/photo-1521590832167-7228f02e64ea?auto=format&fit=crop&w=900&q=80';

export default function Hero({ onNavigate }) {
  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8FCFF] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT */}
          <div className="space-y-7 max-w-xl">
            <h1 className="hero-fade-up-1 text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight text-[#111827] leading-[1.13]">
              Upgrade Your Look.<br />
              <span className="text-[#0EA5E9]">Without Waiting.</span>
            </h1>
            <p className="hero-fade-up-2 text-lg text-[#64748B] leading-relaxed max-w-md">
              Find salons, explore services, and plan your grooming visit with ease.
            </p>
            <div className="hero-fade-up-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a href="/salons" onClick={(e) => onNavigate(e, '/salons', 'Find a Salon')}
                className="btn-lift inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-medium text-[15px] shadow-sm">
                <span>Find a Salon</span>
                <ArrowRight size={16} />
              </a>
              <a href="/signup" onClick={(e) => onNavigate(e, '/signup', 'Signup / Get Started flow')}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white hover:bg-[#F7FBFF] text-[#111827] font-medium text-[15px] border border-[#E2E8F0] transition-colors">
                Get Started
              </a>
            </div>
          </div>

          {/* RIGHT — Continuous Ken Burns + Crossfade */}
          <div className="hero-slide-right relative w-full">
            {/* Soft glow */}
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-[#E0F2FE]/60 via-[#BAE6FD]/30 to-transparent blur-2xl pointer-events-none" />

            {/* Floating orbs */}
            <div className="float-a absolute -top-5 -right-3 w-20 h-20 rounded-full bg-[#E0F2FE] opacity-50 blur-xl pointer-events-none" />
            <div className="float-b absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-[#BAE6FD] opacity-40 blur-xl pointer-events-none" />

            {/* Visual container — fixed aspect prevents layout shift */}
            <div className="relative rounded-2xl overflow-hidden shadow-clean-lg border border-[#E2E8F0] aspect-[4/3] max-w-lg mx-auto lg:ml-auto bg-[#EFF8FF]">

              {/* LAYER 0 — Static safety poster. Always present at the very bottom.
                   Only visible if ALL animated layers somehow fail. */}
              <img
                src={IMG_A}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ zIndex: 0 }}
                loading="eager"
                fetchPriority="high"
              />

              {/* LAYER 1–3: Each image has TWO independent animations running simultaneously:
                   1) kb-* : Ken Burns pan+zoom that NEVER stops (unique timing per image)
                   2) xf-* : Crossfade opacity cycle (synchronized 18s cycle)
                   Because kb-* runs continuously at its own pace, the image is ALWAYS
                   in motion when it becomes visible — no static frames ever. */}

              <img src={IMG_A} alt="Women salon styling"
                className="absolute inset-0 w-full h-full object-cover kb-a xf-a"
                style={{ zIndex: 1 }}
                loading="eager"
              />
              <img src={IMG_B} alt="Men grooming and barber styling"
                className="absolute inset-0 w-full h-full object-cover kb-b xf-b"
                style={{ zIndex: 2 }}
                loading="eager"
              />
              <img src={IMG_C} alt="Premium salon interior"
                className="absolute inset-0 w-full h-full object-cover kb-c xf-c"
                style={{ zIndex: 3 }}
                loading="eager"
              />

              {/* Soft gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#F7FBFF]/20 via-transparent to-transparent pointer-events-none" style={{ zIndex: 10 }} />

              {/* Corner brand */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-[#0EA5E9] px-3 py-1.5 rounded-lg shadow-sm border border-[#E2E8F0]" style={{ zIndex: 15 }}>
                <span className="text-xs font-bold tracking-tight">UPLOOKZ<span className="text-[#0EA5E9]">.</span></span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}