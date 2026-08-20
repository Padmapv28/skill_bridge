import React from 'react';
import { motion } from 'framer-motion';

/**
 * Hyper-attractive Live Animated IT Company Background
 * Renders an active, illuminated tech headquarters environment with moving data pulses,
 * server rack telemetry lights, isometric grid architecture, and floating tech particles.
 */
export const LiveITCompanyBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Deep Obsidian & Cyber Navy Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#040711] via-[#070D1F] to-[#040711]" />

      {/* Volumetric Radial Glows */}
      <div className="absolute top-[-10%] left-[20%] w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[700px] h-[700px] bg-brand-blue/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Cyber Isometric Grid Mesh */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-35"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="itFloorGrid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#172554" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="2" fill="#00F0FF" opacity="0.6" />
            <circle cx="80" cy="80" r="1.5" fill="#0066FF" opacity="0.4" />
          </pattern>
          <linearGradient id="cyberFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#0066FF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#040711" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#itFloorGrid)" />
        <rect width="100%" height="100%" fill="url(#cyberFade)" />
      </svg>

      {/* Flowing Laser Data Beams (Active Office Network Traffic) */}
      <div className="absolute inset-0">
        {[
          { x1: '10%', y1: '0%', x2: '10%', y2: '100%', delay: 0, duration: 8 },
          { x1: '35%', y1: '0%', x2: '35%', y2: '100%', delay: 2.5, duration: 10 },
          { x1: '65%', y1: '0%', x2: '65%', y2: '100%', delay: 1, duration: 9 },
          { x1: '90%', y1: '0%', x2: '90%', y2: '100%', delay: 4, duration: 11 },
        ].map((beam, i) => (
          <motion.div
            key={i}
            style={{ left: beam.x1 }}
            animate={{
              y: ['-100%', '200%'],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: beam.duration,
              delay: beam.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute top-0 w-[1.5px] h-48 bg-gradient-to-b from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00F0FF]"
          />
        ))}
      </div>

      {/* Floating Floating Tech Nodes / Particles */}
      <div className="absolute inset-0">
        {[
          { text: '<React.js />', top: '18%', left: '8%', color: '#00F0FF', delay: 0, duration: 14 },
          { text: 'pgvector :: 1536d', top: '28%', left: '82%', color: '#38BDF8', delay: 2, duration: 16 },
          { text: 'def train_llm():', top: '68%', left: '12%', color: '#10B981', delay: 4, duration: 18 },
          { text: 'kubectl scale --replicas=24', top: '78%', left: '78%', color: '#818CF8', delay: 1.5, duration: 15 },
          { text: 'ATS_SCORE = 96.8%', top: '48%', left: '88%', color: '#F59E0B', delay: 3, duration: 17 },
        ].map((node, idx) => (
          <motion.div
            key={idx}
            style={{ top: node.top, left: node.left, color: node.color }}
            animate={{
              y: [0, -25, 0],
              x: [0, 15, 0],
              opacity: [0.3, 0.75, 0.3],
            }}
            transition={{
              duration: node.duration,
              delay: node.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-navy-950/80 border border-navy-800 text-[11px] font-mono shadow-lg backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: node.color }} />
            <span>{node.text}</span>
          </motion.div>
        ))}
      </div>

      {/* Active Datacenter Rack Telemetry in Corners */}
      <div className="absolute top-16 right-8 hidden lg:flex flex-col gap-2 p-3.5 rounded-2xl bg-navy-950/80 border border-cyan-500/30 backdrop-blur-md shadow-glow-cyan-sm">
        <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-cyan-400">
          <span className="font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            RACK-ALPHA // SF-HQ
          </span>
          <span className="text-slate-400">99.99% UP</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5 pt-1">
          {[...Array(12)].map((_, idx) => (
            <motion.span
              key={idx}
              animate={{
                opacity: [0.3, 1, 0.4],
              }}
              transition={{
                duration: 1.2 + (idx % 4) * 0.4,
                repeat: Infinity,
                delay: idx * 0.1,
              }}
              className={`w-2 h-2 rounded-sm ${
                idx % 3 === 0 ? 'bg-emerald-400' : idx % 3 === 1 ? 'bg-cyan-400' : 'bg-brand-blue'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveITCompanyBackground;
