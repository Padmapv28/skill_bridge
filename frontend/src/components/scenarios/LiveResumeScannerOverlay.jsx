import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, CheckCircle2, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';

const LOG_LINES = [
  'Initializing neural parsing pipeline (v2.4)...',
  'Sanitizing document buffer in secure memory...',
  'Extracting typography, structural headers, and dates...',
  'Identifying technical proficiencies & language matrix...',
  'Detected: TypeScript, React.js, Node.js, Next.js...',
  'Detected: PostgreSQL, Docker, AWS S3/EC2, CI/CD...',
  'Evaluating 5-year career velocity and project metrics...',
  'Calculating ATS compliance score: 92% (High Synergy)...',
  'Synthesizing career timeline ready for prediction.'
];

export const LiveResumeScannerOverlay = ({ onComplete }) => {
  const [currentLineIdx, setCurrentLineIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLineIdx((prev) => {
        if (prev < LOG_LINES.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        onComplete?.();
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="relative w-full rounded-3xl bg-navy-950 border border-brand-blue/40 p-8 sm:p-12 shadow-glow-blue-lg overflow-hidden text-left">
      {/* Animated Laser Scanning Beam */}
      <motion.div
        animate={{ y: ['0%', '340%', '0%'] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00D2FF] pointer-events-none z-20"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Holographic Document Preview */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-navy-900/80 border border-navy-800 relative overflow-hidden">
          <div className="w-full space-y-3 opacity-75">
            {/* Header Skeleton */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/30 animate-pulse" />
              <div className="space-y-1 flex-1">
                <div className="w-3/4 h-3 rounded bg-slate-700 animate-pulse" />
                <div className="w-1/2 h-2 rounded bg-slate-800" />
              </div>
            </div>

            {/* Content Lines Skeleton */}
            <div className="space-y-2 pt-4">
              <div className="w-full h-2 rounded bg-slate-800" />
              <div className="w-5/6 h-2 rounded bg-slate-800" />
              <div className="w-4/5 h-2 rounded bg-slate-800" />
            </div>

            {/* Extracted Floating Badges */}
            <div className="flex flex-wrap gap-1.5 pt-4">
              {['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'].map((sk, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.3 }}
                  className="px-2 py-0.5 rounded bg-brand-blue/20 border border-brand-blue/40 text-brand-blue-light font-mono text-[10px]"
                >
                  +{sk}
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Terminal Stream */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
                Live Holographic Extraction
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              {Math.round(((currentLineIdx + 1) / LOG_LINES.length) * 100)}% Complete
            </span>
          </div>

          {/* Terminal Console Box */}
          <div className="p-4 rounded-xl bg-black/70 border border-navy-800 font-mono text-xs text-slate-300 space-y-1.5 h-48 overflow-y-auto">
            {LOG_LINES.slice(0, currentLineIdx + 1).map((line, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <span className="text-brand-blue-light">&gt;</span>
                <span className={idx === currentLineIdx ? 'text-white font-semibold' : 'text-slate-400'}>
                  {line}
                </span>
              </motion.div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 font-sans">
            Synthesizing 500+ role benchmarks in-memory. Zero persistent resume tracking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveResumeScannerOverlay;
