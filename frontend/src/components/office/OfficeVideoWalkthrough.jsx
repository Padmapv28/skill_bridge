import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Building2, 
  Users, 
  Monitor, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Layers,
  Award,
  Video,
  Volume2,
  VolumeX,
  FastForward
} from 'lucide-react';

const CHAPTERS = [
  {
    id: 'ch_1',
    time: '08:30 AM',
    title: 'Daily Architecture Standup // Engineering Bay',
    location: 'Floor 4 - Main Dev Area',
    description: 'Engineering team reviews the daily sprint. Senior developers discuss type-safe microservices and real-time streaming interfaces.',
    participants: 'Elena (Architect), Marcus (Backend Lead), 8 Software Engineers',
    highlight: 'Alex Chen’s profile flagged as direct match for open senior full-stack req.',
    soundwave: [40, 75, 90, 60, 45, 80, 95, 65, 50, 85, 70, 40]
  },
  {
    id: 'ch_2',
    time: '11:15 AM',
    title: 'GenAI Vector Similarity Optimization // AI Lab',
    location: 'Floor 4 - Neural Compute Lab',
    description: 'Dr. Aris Thorne benchmarks vector search latency across Pinecone and pgvector clusters. RAG retrieval precision hits 94.2%.',
    participants: 'Dr. Aris (Research Lead), Maya Lin (Interface Eng)',
    highlight: 'Candidate’s LangChain & vector gaps mapped directly to Phase 1 & 2 roadmap modules.',
    soundwave: [60, 85, 45, 90, 70, 50, 95, 80, 65, 90, 75, 55]
  },
  {
    id: 'ch_3',
    time: '02:45 PM',
    title: 'Talent Acquisition Candidate Audit // Hiring Command',
    location: 'Floor 5 - Executive Talent Suite',
    description: 'VP Sarah Jenkins inspects the parsed resume. ATS score passes at 92%, fast-tracking candidate to final technical panel.',
    participants: 'Sarah Jenkins (VP Talent), Hiring Committee',
    highlight: 'Calculated 94% fit for AI Application Engineer with $210k target base compensation.',
    soundwave: [50, 65, 80, 95, 70, 60, 85, 90, 55, 75, 80, 60]
  },
  {
    id: 'ch_4',
    time: '04:30 PM',
    title: 'Offer Letter Generation & Executive Sign-off',
    location: 'Floor 6 - Executive Boardroom',
    description: 'Final offer package structured: $210,000 Base + $120,000 Equity + $25,000 Sign-on Bonus. Automated dispatch sent.',
    participants: 'Chief Technology Officer, VP of Engineering',
    highlight: 'Candidate officially placed into senior career acceleration pipeline.',
    soundwave: [80, 95, 85, 90, 100, 95, 90, 85, 95, 100, 90, 70]
  }
];

export const OfficeVideoWalkthrough = () => {
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Auto-progress chapters
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveChapterIdx((prev) => (prev + 1) % CHAPTERS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const ch = CHAPTERS[activeChapterIdx];

  return (
    <div className="w-full rounded-3xl bg-navy-950 border border-navy-750 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Video Animatic Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-blue-light shadow-glow-blue">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Full-Day Tech Company Scenario Walkthrough
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono">
                Animatic Video Player
              </span>
            </div>
            <p className="text-xs text-slate-400">
              A Day in the Life of a High-Growth AI & Cloud Tech Company
            </p>
          </div>
        </div>

        {/* Video Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3.5 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-850 text-slate-200 border border-navy-750 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors focus-visible:ring-1"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-brand-gold" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveChapterIdx(0)}
            className="p-1.5 rounded-xl bg-navy-900 hover:bg-navy-850 text-slate-400 hover:text-white border border-navy-750 transition-colors"
            title="Restart Video"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chapter Navigation Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {CHAPTERS.map((chapter, idx) => {
          const isActive = activeChapterIdx === idx;
          const isPast = activeChapterIdx > idx;

          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => {
                setActiveChapterIdx(idx);
                setIsPlaying(false);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-navy-900 border-brand-blue shadow-glow-blue text-white scale-[1.02]'
                  : isPast
                  ? 'bg-navy-950 border-status-success/35 text-slate-300'
                  : 'bg-navy-950/60 border-navy-800 text-slate-500 hover:text-slate-400'
              }`}
            >
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue-light"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4.5, ease: 'linear' }}
                />
              )}
              <div className="flex items-center justify-between mb-1 text-[11px] font-mono font-bold">
                <span className={isActive ? 'text-brand-blue-light' : 'text-slate-400'}>
                  {chapter.time}
                </span>
                {isPast ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                ) : isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                ) : null}
              </div>
              <p className="font-heading font-semibold text-xs line-clamp-1">
                {chapter.title.split(' // ')[0]}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Video Frame & Animated Visual */}
      <AnimatePresence mode="wait">
        <motion.div
          key={ch.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#070D1F] via-navy-900 to-navy-950 border border-brand-blue/30 shadow-card-dark"
        >
          {/* Left 5 Cols: Visual Simulation Frame */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-navy-950/90 border border-navy-800 space-y-4 relative overflow-hidden">
              {/* Simulated Ambient Soundwave Bars */}
              <div className="flex items-center justify-between pb-3 border-b border-navy-850">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Office Audio Telemetry
                </span>
                <div className="flex items-end gap-1 h-5">
                  {ch.soundwave.map((val, idx) => (
                    <motion.div
                      key={idx}
                      className="w-1 bg-brand-blue-light rounded-full"
                      animate={{ height: isPlaying ? [`${val * 0.4}%`, `${val}%`, `${val * 0.5}%`] : `${val * 0.4}%` }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: idx * 0.05 }}
                    />
                  ))}
                </div>
              </div>

              {/* Location Badge */}
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Location // Zone
                </p>
                <p className="font-heading font-bold text-sm text-white mt-0.5">
                  {ch.location}
                </p>
              </div>

              {/* Participants */}
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Live Personnel Involved
                </p>
                <p className="text-xs text-slate-300 font-sans mt-0.5">
                  {ch.participants}
                </p>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Narrative & Key Breakthroughs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/30 text-brand-blue-light text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chapter {activeChapterIdx + 1} of 4 • {ch.time}</span>
            </div>

            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {ch.title}
            </h3>

            <p className="text-slate-300 text-sm leading-relaxed font-sans">
              {ch.description}
            </p>

            <div className="p-4 rounded-xl bg-navy-950 border border-status-success/30 text-xs font-mono text-slate-200 flex items-start gap-2">
              <span className="text-status-success font-bold flex-shrink-0">&gt; OUTCOME:</span>
              <span className="leading-relaxed">{ch.highlight}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OfficeVideoWalkthrough;
