import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated Ambient IT Office Background Canvas / SVG
 * Creates a subtle, atmospheric living tech office background with illuminated workstations,
 * glass architecture, data pulses, and server rack lights.
 */
export const LiveOfficeBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-40">
      {/* Deep Cyber Navy Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-[#070D1F] to-navy-950" />

      {/* Ambient Office Floor Isometric Grid */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="officeGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1E294B" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="1.5" fill="#0066FF" opacity="0.4" />
          </pattern>
          <linearGradient id="gridGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0066FF" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#00D2FF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#officeGrid)" />
        <rect width="100%" height="100%" fill="url(#gridGlow)" />
      </svg>

      {/* Floating Data Pulses traversing the office network */}
      <div className="absolute inset-0">
        {[
          { top: '15%', left: '10%', duration: 18, delay: 0 },
          { top: '35%', left: '70%', duration: 22, delay: 3 },
          { top: '65%', left: '25%', duration: 16, delay: 6 },
          { top: '80%', left: '85%', duration: 20, delay: 2 },
          { top: '50%', left: '50%', duration: 24, delay: 5 },
        ].map((pulse, idx) => (
          <motion.div
            key={idx}
            style={{ top: pulse.top, left: pulse.left }}
            animate={{
              x: [0, 80, -60, 0],
              y: [0, -40, 50, 0],
              opacity: [0.2, 0.7, 0.3, 0.2],
              scale: [0.8, 1.2, 0.9, 0.8],
            }}
            transition={{
              duration: pulse.duration,
              delay: pulse.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-32 h-32 rounded-full bg-brand-blue/10 blur-2xl"
          />
        ))}
      </div>

      {/* Server Rack Blinking Indicator Lights in Far Background */}
      <div className="absolute top-12 right-12 hidden lg:flex flex-col gap-2 p-3 rounded-xl bg-navy-950/60 border border-navy-800/40 opacity-30">
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </div>
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-[8px] font-mono text-slate-500">DC-SF-RACK-04</span>
      </div>
    </div>
  );
};

export default LiveOfficeBackground;
