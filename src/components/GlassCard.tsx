import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/40 backdrop-blur-md border border-gold/30 shadow-[0_8px_32px_0_rgba(212,175,55,0.15)] rounded-2xl p-8 sm:p-12 ${className}`}>
      {children}
    </div>
  );
};
