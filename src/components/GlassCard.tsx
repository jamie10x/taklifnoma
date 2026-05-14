import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-b from-white/55 via-white/40 to-white/30 backdrop-blur-2xl shadow-[0_22px_70px_-24px_rgba(91,64,15,0.35)] ring-1 ring-white/40 p-6 sm:p-12 ${className}`}>
      {children}
    </div>
  );
};
