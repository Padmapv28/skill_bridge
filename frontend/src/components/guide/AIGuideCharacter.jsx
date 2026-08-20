import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, RotateCcw, Sparkles, ShieldCheck, Zap, Terminal, Box } from 'lucide-react';
import KirmadaHologram3D from '../three/KirmadaHologram3D';

export const AIGuideCharacter = ({ 
  stepTitle,
  speechText, 
  isSpeaking, 
  isMuted, 
  onToggleMute, 
  onReplaySpeech 
}) => {
  return (
    <div className="w-full rounded-3xl bg-gradient-to-b from-[#09132E]/95 via-navy-950 to-navy-950 border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.18)] relative overflow-hidden backdrop-blur-2xl">
      {/* High-tech volumetric glowing energy rings */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-brand-blue/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Cyber Corner HUD brackets */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-6 sm:gap-8">
        {/* Left Column: 3D Holographic AI Character Stage */}
        <div className="w-full lg:w-72 flex flex-col items-center text-center flex-shrink-0">
          <div className="relative w-full flex flex-col items-center">
            {/* 3D WebGL Hologram Scene */}
            <div className="w-full rounded-2xl bg-gradient-to-b from-navy-900/60 to-navy-950/90 border border-cyan-500/30 overflow-hidden shadow-inner relative">
              <KirmadaHologram3D isSpeaking={isSpeaking} />

              {/* 3D Hologram Badge Indicator */}
              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-navy-950/80 border border-cyan-400/50 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                <Box className="w-3 h-3 text-cyan-400" />
                <span>3D HOLOGRAM</span>
              </div>
            </div>

            {/* Speaking Status Pill Badge */}
            <div className="mt-3 px-4 py-1 rounded-full bg-navy-900 border border-cyan-400 text-[11px] font-mono font-bold text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-2">
              {isSpeaking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400">Kirmada Speaking...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kirmada Ready • Drag 3D</span>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="font-heading font-extrabold text-lg text-white flex items-center justify-center gap-1.5">
              <span>Kirmada</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </h3>
            <p className="text-[11px] font-mono text-cyan-300/80 font-semibold">
              Principal AI Career Architect
            </p>
          </div>

          {/* Real-time Voice Audio Visualizer Frequency Bars */}
          <div className="flex items-center gap-1 h-5 mt-2.5">
            {[40, 85, 100, 70, 95, 100, 80, 50, 90, 65].map((val, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-brand-blue to-cyan-400 shadow-[0_0_6px_#00F0FF]"
                animate={{
                  height: isSpeaking ? [`${val * 0.3}%`, `${val}%`, `${val * 0.4}%`] : '20%',
                }}
                transition={{
                  duration: 0.45,
                  repeat: Infinity,
                  delay: i * 0.04,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Kirmada's Spoken Speech & Interactive Controls */}
        <div className="flex-1 space-y-4 text-left w-full">
          {/* Top Bar with Step Title & Audio Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-navy-800">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 text-xs font-mono font-bold">
                {stepTitle || 'Executive Directive'}
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                • Spoken English Narration
              </span>
            </div>

            {/* Audio Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReplaySpeech}
                className="px-3.5 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-850 text-slate-200 hover:text-white border border-navy-750 text-xs font-mono flex items-center gap-1.5 transition-colors focus-visible:ring-1 shadow-md"
                title="Replay Kirmada's Voice"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Replay Voice</span>
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors focus-visible:ring-1 shadow-md ${
                  isMuted
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
                    : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/25 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                }`}
                title={isMuted ? 'Unmute Kirmada' : 'Mute Kirmada'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Voice ON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Kirmada's Dialogue Transcript Box */}
          <div className="p-5 sm:p-6 rounded-2xl bg-navy-950/90 border border-cyan-500/30 relative shadow-xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold mb-2">
              <Terminal className="w-3.5 h-3.5 text-brand-blue-light" />
              <span>Kirmada's Executive Directives:</span>
            </div>

            <p className="text-slate-100 font-sans text-base sm:text-lg leading-relaxed font-normal">
              "{speechText}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGuideCharacter;
