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
    <footer className="bg-white border-t border-[#E2E8F0] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#E2E8F0]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0EA5E9] text-white flex items-center justify-center font-bold text-sm">U</div>
              <span className="text-xl font-bold tracking-tight text-[#111827]">UPLOOKZ<span className="text-[#0EA5E9]">.</span></span>
            </div>
            <p className="text-sm text-[#64748B] font-medium">Upgrade Your Look.</p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#64748B]">
            {footerLinks.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-[#111827] transition-colors">{link.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-5 text-sm font-medium text-[#64748B]">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0EA5E9] transition-colors">Instagram</a>
            <span className="text-[#CBD5E1]">•</span>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0EA5E9] transition-colors">LinkedIn</a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#94A3B8]">
          <p>© {currentYear} UPLOOKZ. All rights reserved.</p>
          <p>Modern salon and grooming platform for both men and women.</p>
        </div>
      </div>
    </footer>
  );
}