import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Zap, 
  ChevronUp, 
  ChevronDown, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { useVoiceAssistant } from '../../context/VoiceContext';

export const KirmadaVoiceHUD = () => {
  const { isSpeaking, isMuted, currentSpeech, toggleMute, replay } = useVoiceAssistant();
  const [isMinimized, setIsMinimized] = useState(false);

  // If there hasn't been any speech yet, don't show the floating HUD until first action
  if (!currentSpeech) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full px-3 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl bg-gradient-to-r from-navy-950/95 via-navy-900/95 to-navy-950/95 border border-cyan-500/40 p-3.5 shadow-[0_0_30px_rgba(0,240,255,0.25)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Avatar & Speaking Telemetry */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-brand-blue flex items-center justify-center text-white shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-navy-950 animate-ping" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-xs text-white tracking-wide">
                  Kirmada
                </span>
                <span className="text-[10px] font-mono text-cyan-300">
                  AI Advisor
                </span>
              </div>

              {/* Soundwave frequency bars */}
              <div className="flex items-center gap-0.5 h-3 mt-0.5">
                {[50, 90, 100, 75, 95, 60].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#00F0FF]"
                    animate={{
                      height: isSpeaking ? [`${h * 0.25}%`, `${h}%`, `${h * 0.3}%`] : '20%',
                    }}
                    transition={{
                      duration: 0.4,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Replay Button */}
            <button
              type="button"
              onClick={replay}
              title="Replay Voice Guidance"
              className="p-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-slate-300 hover:text-cyan-300 border border-navy-750 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Mute/Unmute Button */}
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? 'Unmute Voice Assistant' : 'Mute Voice Assistant'}
              className={`p-1.5 rounded-lg border transition-colors ${
                isMuted
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Minimize / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-slate-400 hover:text-slate-200 border border-navy-750 transition-colors"
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expandable Subtitle Transcript */}
        <AnimatePresence>
          {!isMinimized && currentSpeech && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2.5 pt-2 border-t border-navy-800/80 text-[11px] font-sans text-slate-300 leading-snug line-clamp-3 italic"
            >
              "{currentSpeech}"
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default KirmadaVoiceHUD;
