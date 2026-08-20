import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Building2, 
  Sparkles, 
  Compass, 
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

const SCENES = [
  {
    id: 'scene_1',
    time: 'Month 0',
    title: 'Baseline Audit & Latent Potential',
    subtitle: 'Full-Stack Developer earning $125k with strong React/Node experience but unmapped AI skills.',
    readiness: 48,
    salary: '$125,000',
    skillsActive: ['React.js', 'Node.js', 'TypeScript', 'PostgreSQL'],
    skillsMissing: ['LangChain', 'Vector DBs', 'RAG Architectures', 'LLM Evaluations'],
    highlight: 'Resume AI identifies top target role: AI Application Engineer with 94% fit potential.',
    quote: '"I had no idea my frontend and API experience put me 75% of the way to an AI Engineer role."'
  },
  {
    id: 'scene_2',
    time: 'Month 2 (Phase 1 & 2 Completed)',
    title: 'Roadmap Execution & Skill Mastery',
    subtitle: 'Completed Python AI scripting, embeddings, and vector similarity indexing courses.',
    readiness: 76,
    salary: '$165,000 (Market Valuation)',
    skillsActive: ['React.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'Python AI', 'Pinecone Vector DB', 'OpenAI APIs'],
    skillsMissing: ['Advanced RAG Multi-Agent', 'CI LLM Guardrails'],
    highlight: 'Built first production-ready semantic search agent with streaming React UI.',
    quote: '"Following the 3-phase curriculum kept me hyper-focused on only high-leverage concepts."'
  },
  {
    id: 'scene_3',
    time: 'Month 4 (Phase 3 & Capstone Complete)',
    title: 'Top 5% Candidate Readiness',
    subtitle: 'Engineered multi-agent RAG system with automated DeepEval test harnesses.',
    readiness: 96,
    salary: '$210,000 (Median Offer Band)',
    skillsActive: ['React.js', 'Node.js', 'TypeScript', 'Python AI', 'Vector DBs', 'LangChain', 'RAG Architecture', 'DeepEval Guardrails'],
    skillsMissing: [],
    highlight: 'Profile submitted to 3 Tier-1 enterprise AI teams with automated skill verification badge.',
    quote: '"Passed the technical architect panel in the first round with zero hesitation."'
  },
  {
    id: 'scene_4',
    time: 'Month 5 (Offer Negotiation)',
    title: 'Multiple Tier-1 Offers Dispatched',
    subtitle: 'Received 3 competitive offers from OpenAI, Stripe, and Google Cloud platform teams.',
    readiness: 100,
    salary: '$235,000 + $120,000 Equity',
    skillsActive: ['Full AI & Cloud Architecture Mastery'],
    skillsMissing: [],
    highlight: 'Accepted Staff AI Engineering role with $355,000 total compensation package (+184% growth).',
    quote: '"Resume AI turned what felt like a 2-year pivot into a 16-week execution sprint."'
  }
];

export const CandidateCareerJourneyScenario = () => {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-progress scenario scenes
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setActiveSceneIndex((prev) => (prev + 1) % SCENES.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const scene = SCENES[activeSceneIndex];

  return (
    <div className="w-full rounded-3xl bg-navy-950 border border-navy-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Video-Style Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Live Scenario Walkthrough
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-blue/20 text-brand-blue-light text-[10px] font-mono">
                Case Study #104
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Candidate Career Progression: Alex Chen (Mid-Level → Staff AI Engineer)
            </p>
          </div>
        </div>

        {/* Video Scrubber Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-850 text-slate-200 border border-navy-750 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors focus-visible:ring-1"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-brand-gold" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Play Live</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSceneIndex(0)}
            className="p-1.5 rounded-xl bg-navy-900 hover:bg-navy-850 text-slate-400 hover:text-white border border-navy-750 transition-colors"
            title="Restart Journey"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline Scene Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {SCENES.map((sc, idx) => {
          const isActive = activeSceneIndex === idx;
          const isPast = activeSceneIndex > idx;

          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => {
                setActiveSceneIndex(idx);
                setIsPlaying(false);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                isActive
                  ? 'bg-navy-900 border-brand-blue shadow-glow-blue text-white scale-[1.02]'
                  : isPast
                  ? 'bg-navy-950 border-status-success/40 text-slate-300'
                  : 'bg-navy-950/60 border-navy-850 text-slate-500 hover:text-slate-400'
              }`}
            >
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue-light"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4.2, ease: 'linear' }}
                />
              )}

              <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                <span className={isActive ? 'text-brand-blue-light' : 'text-slate-400'}>
                  {sc.time}
                </span>
                {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />}
              </div>
              <p className="font-heading font-semibold text-xs line-clamp-1">
                {sc.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Video-Style Dynamic Content Player Frame */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-900/90 to-navy-950 border border-brand-blue/30 shadow-card-dark"
        >
          {/* Left Column: Progress & Compensation Growth Meter */}
          <div className="lg:col-span-5 space-y-5">
            {/* Readiness Ring & Status */}
            <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Market Role Readiness
                </p>
                <p className="font-heading font-extrabold text-2xl text-white mt-0.5">
                  {scene.readiness}% Target Score
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-brand-blue/15 border border-brand-blue/40 flex items-center justify-center font-mono font-bold text-base text-brand-blue-light shadow-glow-blue">
                {scene.readiness}%
              </div>
            </div>

            {/* Compensation Uplift Meter */}
            <div className="p-4 rounded-xl bg-navy-950/80 border border-status-success/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Valuation & Compensation Band</span>
                <span className="text-status-success font-bold">{scene.salary}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-navy-900 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-gold to-emerald-400 rounded-full"
                  initial={{ width: '30%' }}
                  animate={{ width: `${Math.min(scene.readiness, 100)}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            {/* Verified Active Skills Cloud */}
            <div className="space-y-2">
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Active Verified Skills ({scene.skillsActive.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {scene.skillsActive.map((sk, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-navy-900 border border-status-success/30 text-status-success text-xs font-mono flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Scenario Narrative & Quotes */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>{scene.time} Milestone Breakthrough</span>
            </div>

            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {scene.title}
            </h3>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
              {scene.subtitle}
            </p>

            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-xs font-sans text-slate-300 space-y-1">
              <p className="font-mono text-brand-gold font-bold text-[11px]">
                KEY OUTCOME:
              </p>
              <p>{scene.highlight}</p>
            </div>

            {/* Candidate Testimonial Quote */}
            <blockquote className="italic text-xs text-slate-400 border-l-2 border-brand-blue pl-3 py-0.5 font-sans">
              {scene.quote}
            </blockquote>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CandidateCareerJourneyScenario;
