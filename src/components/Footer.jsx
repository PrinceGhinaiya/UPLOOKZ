import React from 'react';

export default function Footer({ onNavigate }) {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'About', href: '#about' },
    { label: 'For Salons', href: '#for-salons' },
    { label: 'Contact', href: '#contact' },
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Terms', href: '#terms' },
  ];

  return (
    <footer className="bg-white border-t border-[#E2E8F0] py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-[#E2E8F0]">

          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0EA5E9] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                U
              </div>
              <span className="text-2xl font-bold tracking-tight text-[#111827]">
                UPLOOKZ<span className="text-[#0EA5E9]">.</span>
              </span>
            </div>
            <p className="text-sm text-[#64748B] font-medium tracking-wide">
              Upgrade Your Look.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium text-[#64748B]">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-[#0EA5E9] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5 text-sm font-semibold text-[#64748B]">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0EA5E9] transition-colors duration-200"
            >
              Instagram
            </a>
            <span className="text-[#CBD5E1]">•</span>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0EA5E9] transition-colors duration-200"
            >
              LinkedIn
            </a>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <p>© {currentYear} UPLOOKZ. All rights reserved.</p>
          <p className="font-normal text-center sm:text-right">
            Modern salon and grooming platform for both men and women.
          </p>
        </div>
      </div>
    </footer>
  );
}