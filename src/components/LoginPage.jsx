import React, { useState } from 'react';
import LoginModal from './LoginModal';

/**
 * Modern UPLOOKZ Login experience
 * Implements the centered modal login popup over a subtle backdrop.
 */
export default function LoginPage({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate('/');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FBFF] relative">
      <LoginModal
        isOpen={isOpen}
        onClose={handleClose}
        onNavigate={onNavigate}
      />
    </div>
  );
}
