import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  DollarSign, 
  Award, 
  Activity, 
  FileCheck,
  TrendingUp,
  Brain,
  MessageSquareQuote,
  ShieldCheck,
  Zap
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'openai',
    company: 'OpenAI',
    role: 'AI Application Engineer',
    team: 'Applied GenAI Product Team',
    recruiter: 'Sarah Jenkins (VP of Engineering Recruiting)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    candidate: 'Alex Chen',
    baseSalary: '$190,000 - $225,000',
    equity: '$120,000 / yr',
    steps: [
      {
        stage: '01. Raw Intake & Parsing',
        status: 'Complete',
        detail: '18 core competencies identified. TypeScript, React.js, and Node.js verified with 5+ yrs tenure.',
        score: 82,
        log: 'Extracted high-density project highlights from TechFlow Systems & Nexus Labs.'
      },
      {
        stage: '02. Neural Role Alignment',
        status: 'Complete',
        detail: 'Semantic embedding matches OpenAI Applied Engineering matrix at 94.2% compatibility.',
        score: 91,
        log: 'Calculated 94% fit for GenAI Interface & Streaming Agent engineering.'
      },
      {
        stage: '03. Gap Audit & Verification',
        status: 'Calibrating',
        detail: 'LangChain & Vector DB ramp-up needed; transferable architecture concepts verified.',
        score: 94,
        log: 'Identified 3 growth gaps (LlamaIndex, RAG, pgvector) with high ramp-up velocity.'
      },
      {
        stage: '04. Offer & Interview Signal',
        status: 'Fast-Track Triggered',
        detail: 'Automated referral fast-track generated. Initial technical screen bypassed.',
        score: 96,
        log: 'Dispatched direct fast-track interview invitation with $210k median target.'
      }
    ],
    feedback: [
      { author: 'Sarah (Recruiter)', text: 'Candidate’s React + Node distributed background allows immediate contribution to our streaming canvas UI.', time: 'Just now' },
      { author: 'Marcus (Tech Lead)', text: 'Strong architectural fundamentals. With the 3-phase roadmap, they will master our LLM eval stack within 4 weeks.', time: '2s ago' }
    ]
  },
  {
    id: 'google',
    company: 'Google Cloud / DeepMind',
    role: 'Staff Full-Stack Cloud Architect',
    team: 'Core Platform Engineering',
    recruiter: 'David Martinez (Director of Tech Talent)',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    candidate: 'Alex Chen',
    baseSalary: '$210,000 - $250,000',
    equity: '$150,000 / yr',
    steps: [
      {
        stage: '01. System Architecture Audit',
        status: 'Complete',
        detail: 'Docker, PostgreSQL, and AWS cloud patterns validated against L6 benchmark.',
        score: 85,
        log: 'High concurrency REST & microservice metrics verified at 2,000+ RPS.'
      },
      {
        stage: '02. Distributed Design Scoring',
        status: 'Complete',
        detail: 'Micro-frontend and WebSocket streaming experience aligns with GCP Cloud Console standards.',
        score: 89,
        log: 'Scored 89% on enterprise frontend scaling & page speed optimization.'
      },
      {
        stage: '03. Kubernetes & Infra Bridge',
        status: 'Ramp-up Tracked',
        detail: 'Kubernetes orchestration tracked in Phase 2 roadmap milestone.',
        score: 92,
        log: 'Identified K8s and Terraform as targeted learning modules.'
      },
      {
        stage: '04. Executive Review Dispatch',
        status: 'Panel Approved',
        detail: 'Candidate profile forwarded directly to Hiring Committee with Tier 1 recommendation.',
        score: 95,
        log: 'Profile approved for L6 Staff Architecture interviews.'
      }
    ],
    feedback: [
      { author: 'David (Talent Director)', text: 'Excellent system architecture metrics. Top 5% percentile candidate for Q3 Cloud expansions.', time: 'Just now' },
      { author: 'Elena (Principal Eng)', text: 'Clear evidence of mentorship and TypeScript scale. Strong match for our distributed console team.', time: '1s ago' }
    ]
  },
  {
    id: 'stripe',
    company: 'Stripe',
    role: 'Senior Platform Infrastructure Engineer',
    team: 'Global Payments & Latency Engine',
    recruiter: 'Chloe Zhang (Principal Tech Recruiter)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    candidate: 'Alex Chen',
    baseSalary: '$195,000 - $235,000',
    equity: '$110,000 / yr',
    steps: [
      {
        stage: '01. High-Throughput Verification',
        status: 'Complete',
        detail: 'Stripe API integration experience and 0-downtime database migrations verified.',
        score: 88,
        log: 'Confirmed hands-on billing infrastructure and payment webhook handling.'
      },
      {
        stage: '02. Latency & Reliability Scoring',
        status: 'Complete',
        detail: '42% load time reduction at TechFlow directly maps to Stripe latency SLAs.',
        score: 92,
        log: 'Scored in 92nd percentile for client-side and API latency optimizations.'
      },
      {
        stage: '03. Event Streaming Alignment',
        status: 'Roadmap Connected',
        detail: 'Kafka and distributed pub-sub modules integrated into customized study track.',
        score: 94,
        log: 'Automated study plan synchronizes with Stripe infrastructure needs.'
      },
      {
        stage: '04. Fast-Track Offer Match',
        status: 'Invitation Ready',
        detail: 'Full compensation package modeled with $215k median base + equity.',
        score: 96,
        log: 'Dispatched technical deep-dive scheduling invitation.'
      }
    ],
    feedback: [
      { author: 'Chloe (Lead Recruiter)', text: 'Direct payment experience + latency obsession is exactly what Stripe looks for.', time: 'Just now' },
      { author: 'Devin (Staff Infra)', text: 'Verified code modularity and testing discipline make this a rapid ramp-up hire.', time: '2s ago' }
    ]
  }
];

export const LiveHiringSimulation = () => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const scenario = SCENARIOS[selectedScenarioIndex];

  // Auto-step through simulation stages
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % scenario.steps.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [isPlaying, scenario.steps.length]);

  // Reset step index on scenario change
  const handleScenarioSelect = (index) => {
    setSelectedScenarioIndex(index);
    setActiveStepIndex(0);
  };

  const currentStep = scenario.steps[activeStepIndex];

  return (
    <div className="w-full rounded-3xl bg-gradient-to-b from-navy-900/90 via-navy-950 to-navy-950 border border-navy-750 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Background Animated Energy Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,102,255,0.12),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.06),transparent_60%)] pointer-events-none" />

      {/* Top Controls & Scenario Selector */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 mb-8 border-b border-navy-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/30 text-brand-blue-light text-xs font-mono mb-2">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Interactive Live Simulation Sandbox</span>
          </div>
          <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How Companies Evaluate You in Real Time
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simulate how enterprise hiring algorithms and engineering leaders audit candidate profiles.
          </p>
        </div>

        {/* Company Scenario Pills */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleScenarioSelect(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
                selectedScenarioIndex === idx
                  ? 'bg-brand-blue text-white shadow-glow-blue border border-brand-blue-light/50'
                  : 'bg-navy-900 text-slate-400 hover:text-white hover:bg-navy-850 border border-navy-750'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{sc.company}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation Viewport (Video-Style Live Console) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Decision Telemetry */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Info Banner */}
          <div className="p-5 rounded-2xl bg-navy-950/80 border border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-glow-blue flex-shrink-0">
                {scenario.company.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-white text-base sm:text-lg">
                    {scenario.role}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-status-success/20 text-status-success text-[10px] font-mono font-bold">
                    Active Req
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {scenario.company} • {scenario.team}
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right">
              <p className="text-[10px] font-mono text-slate-400 uppercase">Target Band</p>
              <p className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-0.5 justify-end">
                <DollarSign className="w-3.5 h-3.5" />
                {scenario.baseSalary}
              </p>
            </div>
          </div>

          {/* Stepper Progress Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {scenario.steps.map((st, sIdx) => {
              const isActive = activeStepIndex === sIdx;
              const isPast = activeStepIndex > sIdx;

              return (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    setActiveStepIndex(sIdx);
                    setIsPlaying(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                    isActive
                      ? 'bg-navy-900 border-brand-blue shadow-glow-blue text-white'
                      : isPast
                      ? 'bg-navy-950 border-status-success/30 text-slate-300'
                      : 'bg-navy-950/60 border-navy-800/80 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {/* Active Step Progress Bar Indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue-light"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3.8, ease: 'linear' }}
                    />
                  )}

                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold">
                      0{sIdx + 1}
                    </span>
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                    ) : isActive ? (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    ) : null}
                  </div>
                  <p className="text-[11px] font-heading font-semibold line-clamp-1">
                    {st.stage.split('. ')[1] || st.stage}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Stage Real-Time Insight Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${scenario.id}-${activeStepIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-6 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-900/90 to-navy-950 border border-brand-blue/30 shadow-card-dark space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-brand-blue-light" />
                  Stage 0{activeStepIndex + 1}: {currentStep.stage}
                </span>
                <span className="px-3 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/40 text-brand-blue-light text-xs font-mono font-bold">
                  {currentStep.score}% Match Factor
                </span>
              </div>

              <h4 className="font-heading font-bold text-lg text-slate-100 leading-snug">
                {currentStep.detail}
              </h4>

              <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-850 text-xs font-mono text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 font-bold flex-shrink-0">&gt; telemetry:</span>
                <span className="leading-relaxed">{currentStep.log}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Interactive Playback Toolbar */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3.5 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-850 text-slate-200 border border-navy-750 flex items-center gap-1.5 transition-colors focus-visible:ring-1"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Pause Live Stream</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Resume Auto-Play</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveStepIndex(0)}
                className="p-1.5 rounded-xl bg-navy-900 hover:bg-navy-850 text-slate-400 hover:text-white border border-navy-750 transition-colors"
                title="Restart Scenario"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="font-mono text-[11px] text-slate-500">
              Auto-cycling every 3.8s • Click steps to jump
            </span>
          </div>
        </div>

        {/* Right Column: Hiring Team & Employee Radar Live Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-navy-950/80 border border-navy-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800/80">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                <Users className="w-4 h-4 text-brand-gold" />
                <span>Hiring Team Evaluation</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-status-success animate-ping" />
            </div>

            {/* Recruiter Profile Header */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-900/60 border border-navy-850">
              <img
                src={scenario.avatar}
                alt={scenario.recruiter}
                className="w-10 h-10 rounded-xl object-cover border border-navy-700"
              />
              <div>
                <p className="font-heading font-semibold text-xs text-white">
                  {scenario.recruiter}
                </p>
                <p className="text-[11px] text-slate-400">
                  {scenario.company} Talent Advisory
                </p>
              </div>
            </div>

            {/* Live Feedback Feed */}
            <div className="space-y-3">
              {scenario.feedback.map((fb, fIdx) => (
                <motion.div
                  key={fIdx}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: fIdx * 0.15 }}
                  className="p-3.5 rounded-xl bg-navy-900/90 border border-navy-750 text-xs space-y-1 relative"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-brand-blue-light font-semibold">
                    <span className="flex items-center gap-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      {fb.author}
                    </span>
                    <span className="text-slate-500">{fb.time}</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    "{fb.text}"
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Candidate Offer Projection Callout */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-status-success/10 to-brand-blue/10 border border-status-success/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-status-success uppercase">
                  Projected Total Compensation
                </span>
                <span className="text-xs font-mono font-extrabold text-white">
                  $330,000 / yr
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Base + Equity estimated based on verified skill profile and market data points.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveHiringSimulation;
