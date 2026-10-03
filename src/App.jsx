import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustStrip from './components/TrustStrip';
import HowItWorks from './components/HowItWorks';
import WhyUplookz from './components/WhyUplookz';
import ForSalons from './components/ForSalons';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import CustomerHome from './components/CustomerHome';
import SalonDashboard from './components/SalonDashboard';
import CustomerSignup from './components/CustomerSignup';
import SalonRegister from './components/SalonRegister';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [toast, setToast] = useState(null);
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
      setCurrentPath(path.split('?')[0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigate = (e, path, label) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (path.startsWith('#')) {
      if (currentPath !== '/' && currentPath !== '/index.html') {
        navigate('/');
        setTimeout(() => {
          const el = document.querySelector(path);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.querySelector(path);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const normalized = path.split('?')[0];
    const knownRoutes = ['/', '/login', '/signup', '/salon/register', '/customer/home', '/customer/dashboard', '/salon/dashboard'];

    if (knownRoutes.includes(normalized)) {
      navigate(path);
    } else {
      console.log(`[UPLOOKZ Routing] Navigate to: ${path} (${label})`);
      setToast({ label: label || path, path });
      setTimeout(() => {
        setToast((prev) => (prev?.path === path ? null : prev));
      }, 4000);
    }
  };

  // Route: Login Page
  if (currentPath === '/login') {
    return <LoginPage onNavigate={navigate} />;
  }

  // Route: Customer Home / Dashboard
  if (currentPath === '/customer/home' || currentPath === '/customer/dashboard') {
    return <CustomerHome onNavigate={navigate} />;
  }

  // Route: Salon Owner Dashboard
  if (currentPath === '/salon/dashboard') {
    return <SalonDashboard onNavigate={navigate} />;
  }

  // Route: Customer Sign Up
  if (currentPath === '/signup') {
    return <CustomerSignup onNavigate={navigate} />;
  }

  // Route: Salon Registration
  if (currentPath === '/salon/register') {
    return <SalonRegister onNavigate={navigate} />;
  }

  // Default Route: Existing Landing Page (Exact untouched structure, navbar, sections, colors & text)
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