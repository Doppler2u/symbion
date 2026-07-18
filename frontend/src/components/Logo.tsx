import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-6 h-6 text-arc-green" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2L3 6V18L12 22L21 18V6L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
      <path d="M12 2V22" stroke="currentColor" strokeWidth="2" />
      <path d="M3 6L12 12L21 6" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
      <path d="M3 18L12 12L21 18" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
      <circle cx="12" cy="12" r="3" fill="currentColor" className="animate-pulse" />
    </svg>
  );
}
