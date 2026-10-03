import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'For Salons', href: '#for-salons' },
    { label: 'About', href: '#about' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm py-3.5'
          : 'bg-black/20 backdrop-blur-sm border-b border-white/10 py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#0EA5E9] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <span className="font-bold text-base tracking-tight">U</span>
          </div>
          <span className={`text-xl font-bold tracking-tight transition-colors duration-200 ${
            scrolled ? 'text-[#111827]' : 'text-white'
          }`}>
            UPLOOKZ<span className="text-[#0EA5E9]">.</span>
          </span>
        </a>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-9 text-[15px] font-medium">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`transition-colors duration-200 ${
                scrolled
                  ? 'text-[#64748B] hover:text-[#111827]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA / Auth */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="/login"
            onClick={(e) => onNavigate(e, '/login', 'Login page')}
            className={`text-[14px] font-medium px-4 py-2 rounded-lg transition-colors duration-200 ${
              scrolled
                ? 'text-[#111827] hover:text-[#0EA5E9]'
                : 'text-white/90 hover:text-white'
            }`}
          >
            Login
          </a>
          <a
            href="/signup"
            onClick={(e) => onNavigate(e, '/signup', 'Signup / Get Started flow')}
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-5 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight size={15} />
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-2 rounded-lg border transition-colors ${
            scrolled
              ? 'text-[#64748B] hover:text-[#111827] border-[#E2E8F0] hover:bg-[#F7FBFF]'
              : 'text-white/80 hover:text-white border-white/20 hover:bg-white/10'
          }`}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-5 py-5 space-y-4 shadow-xl">
          <div className="flex flex-col space-y-2 pb-3 border-b border-[#E2E8F0]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#64748B] hover:text-[#111827] font-medium py-2 text-[15px] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-1 flex flex-col gap-2.5">
            <a
              href="/login"
              onClick={(e) => { setMobileMenuOpen(false); onNavigate(e, '/login', 'Login page'); }}
              className="w-full text-center py-2.5 text-[14px] font-medium text-[#111827] bg-[#F7FBFF] border border-[#E2E8F0] rounded-lg hover:bg-[#EFF8FF] transition-colors"
            >
              Login
            </a>
            <a
              href="/signup"
              onClick={(e) => { setMobileMenuOpen(false); onNavigate(e, '/signup', 'Signup / Get Started flow'); }}
              className="w-full text-center py-2.5 text-[14px] font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}