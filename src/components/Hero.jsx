import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const HERO_IMAGES = [
  {
    src: '/images/hero-1.jpg',
    alt: 'Premium grooming beard styling',
    position: 'object-[85%_25%]',
  },
  {
    src: '/images/hero-2.jpg',
    alt: 'Executive fade haircut and beard styling',
    position: 'object-[80%_25%]',
  },
  {
    src: '/images/hero-3.jpg',
    alt: 'Modern textured hair styling',
    position: 'object-[75%_20%]',
  },
];

export default function Hero({ onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 lg:min-h-[88vh] bg-[#070B12] overflow-hidden flex items-center">

      {/* FULL-BLEED EDITORIAL HERO BACKGROUND (EDGE TO EDGE) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
        {/* Safety baseline layer */}
        <img
          src={HERO_IMAGES[0].src}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover ${HERO_IMAGES[0].position}`}
          style={{
            zIndex: 0,
            imageRendering: 'high-quality',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />

        {/* 3 Uploaded Grooming Photos in Smooth Automatic Crossfade Rotation (High Quality Rendering) */}
        {HERO_IMAGES.map((img, idx) => (
          <div
            key={img.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentIndex === idx ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ zIndex: idx + 1 }}
          >
            <img
              src={img.src}
              alt={img.alt}
              className={`w-full h-full object-cover ${img.position} transition-transform duration-[7000ms] ease-out`}
              style={{
                transform: currentIndex === idx ? 'scale(1.02) translateZ(0)' : 'scale(1) translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                imageRendering: 'high-quality',
                willChange: 'opacity, transform',
              }}
              loading="eager"
              fetchPriority={idx === 0 ? 'high' : 'auto'}
              decoding="async"
            />
          </div>
        ))}

        {/* CINEMATIC EDITORIAL GRADIENT OVERLAYS */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 via-42% md:via-50% to-black/25"
          style={{ zIndex: 10 }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#070B12] via-transparent via-20% to-black/40"
          style={{ zIndex: 11 }}
        />
      </div>

      {/* EXISTING UPLOOKZ HERO CONTENT (EXACT TEXT & BUTTONS UNTOUCHED) */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-8">

          {/* Headline */}
          <h1 className="hero-fade-up-1 text-4xl sm:text-5xl lg:text-[3.6rem] font-bold tracking-tight text-white leading-[1.12]">
            Upgrade Your Look.<br />
            <span className="text-[#0EA5E9]">Without Waiting.</span>
          </h1>

          {/* Description */}
          <p className="hero-fade-up-2 text-lg sm:text-xl text-slate-200/90 leading-relaxed font-normal max-w-lg">
            Find salons, explore services, and plan your grooming visit with ease.
          </p>

          {/* Buttons */}
          <div className="hero-fade-up-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <a
              href="/salons"
              onClick={(e) => onNavigate(e, '/salons', 'Find a Salon')}
              className="btn-lift inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-[15px] shadow-lg shadow-[#0EA5E9]/25 transition-all duration-300"
            >
              <span>Find a Salon</span>
              <ArrowRight size={17} />
            </a>

            <a
              href="/signup"
              onClick={(e) => onNavigate(e, '/signup', 'Signup / Get Started flow')}
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[15px] border border-white/25 backdrop-blur-md transition-all duration-300"
            >
              Get Started
            </a>
          </div>

        </div>
      </div>

    </section>
  );
}