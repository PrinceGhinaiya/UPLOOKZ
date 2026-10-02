import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustStrip from './components/TrustStrip';
import HowItWorks from './components/HowItWorks';
import WhyUplookz from './components/WhyUplookz';
import ForSalons from './components/ForSalons';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [toast, setToast] = useState(null);

  const handleNavigate = (e, path, label) => {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      console.log(`[UPLOOKZ Routing] Navigate to: ${path} (${label})`);
      setToast({ label, path });
      setTimeout(() => {
        setToast((prev) => (prev?.path === path ? null : prev));
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FBFF] text-[#111827] selection:bg-[#0EA5E9] selection:text-white">
      <Navbar onNavigate={handleNavigate} />
      <main>
        <Hero onNavigate={handleNavigate} />
        <TrustStrip />
        <HowItWorks />
        <div id="about"><WhyUplookz /></div>
        <ForSalons onNavigate={handleNavigate} />
        <FinalCTA onNavigate={handleNavigate} />
      </main>
      <Footer onNavigate={handleNavigate} />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-[#E2E8F0] text-[#111827] p-4 rounded-xl shadow-clean-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center shrink-0 border border-[#BAE6FD]">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#111827]">{toast.label}</p>
                <p className="text-[11px] text-[#64748B]">
                  Route: <code className="text-[#0284C7] bg-[#F0F9FF] px-1 py-0.5 rounded">{toast.path}</code>
                </p>
              </div>
            </div>
            <button onClick={() => setToast(null)} className="text-[#94A3B8] hover:text-[#111827] p-1 shrink-0" aria-label="Close">
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}