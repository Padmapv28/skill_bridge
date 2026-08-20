import React from 'react';

/**
 * Lightweight CSS-only Orbiting Nodes Spinner.
 * Echoes the signature 3D hero skill orbit motif without any WebGL overhead.
 */
export const OrbitingSpinner = ({ 
  size = 'md', 
  label = 'Analyzing with Resume AI...', 
  subtext = null,
  className = '' 
}) => {
  const sizeMap = {
    sm: { container: 'w-16 h-16', center: 'w-4 h-4', orbit1: 20, orbit2: 28, node1: 'w-2 h-2', node2: 'w-1.5 h-1.5' },
    md: { container: 'w-24 h-24', center: 'w-6 h-6', orbit1: 32, orbit2: 44, node1: 'w-2.5 h-2.5', node2: 'w-2 h-2' },
    lg: { container: 'w-36 h-36', center: 'w-9 h-9', orbit1: 48, orbit2: 64, node1: 'w-3.5 h-3.5', node2: 'w-3 h-3' },
  };

  const s = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`} role="status" aria-live="polite">
      <div className={`relative ${s.container} flex items-center justify-center`}>
        {/* Outer Orbit Ring */}
        <div 
          className="absolute inset-0 rounded-full border border-brand-blue/25 animate-spin-slow"
          style={{ animationDuration: '8s' }}
        >
          {/* Matched Skill Node (Emerald) */}
          <div 
            className={`absolute -top-1.5 left-1/2 -translate-x-1/2 ${s.node1} rounded-full bg-status-success shadow-glow-success`}
            title="Matched Skill Node"
          />
          {/* Gap Skill Node (Gold) */}
          <div 
            className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 ${s.node2} rounded-full bg-brand-gold shadow-glow-gold`}
            title="Growth Skill Node"
          />
        </div>

        {/* Middle Orbit Ring (Reversed) */}
        <div 
          className="absolute inset-2 rounded-full border border-dashed border-cyan-500/20 animate-spin-reverse"
          style={{ animationDuration: '6s' }}
        >
          {/* Electric Blue Skill Node */}
          <div 
            className={`absolute top-1/2 -right-1.5 -translate-y-1/2 ${s.node2} rounded-full bg-brand-blue-light shadow-glow-blue`}
          />
          {/* Missing Skill Node (Rose) */}
          <div 
            className={`absolute top-1/2 -left-1.5 -translate-y-1/2 ${s.node1} rounded-full bg-status-danger shadow-glow-danger`}
          />
        </div>

        {/* Inner Target Role Core */}
        <div className={`relative ${s.center} rounded-full bg-gradient-to-tr from-brand-blue to-cyan-400 flex items-center justify-center shadow-glow-blue animate-pulse-glow`}>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        </div>
      </div>

      {label && (
        <p className="mt-4 font-heading font-semibold text-slate-200 tracking-wide text-sm md:text-base">
          {label}
        </p>
      )}
      {subtext && (
        <p className="mt-1 text-xs text-slate-400 max-w-xs font-sans">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default OrbitingSpinner;
