import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Upload, 
  Compass, 
  Target, 
  Map, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Cpu, 
  ShieldCheck, 
  Zap,
  Volume2,
  Terminal,
  Activity
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import InteractiveGuidedFlow from '../components/guide/InteractiveGuidedFlow';
import { sampleParsedResume } from '../api/mockData';

export const LandingPage = () => {
  const navigate = useNavigate();

  const handleQuickDemo = () => {
    navigate('/results', {
      state: {
        resumeData: sampleParsedResume,
        isSample: true
      }
    });
  };

  const features = [
    {
      icon: Cpu,
      title: 'Contextual Resume Intelligence',
      description: 'Deep semantic parsing extracts hard skills, project impact, leadership signals, and domain mastery from PDF and DOCX resumes.',
      badge: 'In-Memory Parsing',
      color: 'border-cyan-500/40 text-cyan-400'
    },
    {
      icon: Compass,
      title: 'Predictive Role Matching',
      description: 'Calculates multidimensional fit-scores against 500+ tech career specializations with explainable AI justifications and salary telemetry.',
      badge: 'Top 5 Predictions',
      color: 'border-brand-blue/40 text-brand-blue-light'
    },
    {
      icon: Target,
      title: 'Surgical Skill Gap Analysis',
      description: 'Classifies competencies into matched, partial growth areas, and high-impact missing capabilities with visual match percentage rings.',
      badge: 'Tri-Tier Classification',
      color: 'border-amber-400/40 text-amber-400'
    },
    {
      icon: Map,
      title: 'Personalized 3-Phase Roadmap',
      description: 'Transforms identified gaps into structured, time-sequenced milestones (Foundation, Intermediate, Advanced) backed by curated courses.',
      badge: 'Milestone Execution',
      color: 'border-emerald-400/40 text-emerald-400'
    },
  ];

  return (
    <PageWrapper className="pb-20">
      {/* Hero Section with Kirmada */}
      <section className="relative pt-8 pb-14 md:pt-14 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-brand-blue/15 rounded-full blur-[130px] pointer-events-none -z-10" />

        {/* Hero Title & Subheading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-900/90 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.2)] backdrop-blur-md">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-cyan-300">
              Meet Kirmada • Principal AI Career Architect
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Predict Your Next{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-brand-blue-light to-white bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(0,240,255,0.4)]">
              Career Leap
            </span>{' '}
            with Kirmada
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-sans">
            Consult directly with Kirmada, your AI Career Architect. Experience spoken English guidance, high-precision role fit predictions, skill gap audits, and personalized learning roadmaps.
          </p>

          {/* Quick Trust Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              96.8% Prediction Accuracy
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              500+ Tech Benchmarks
            </span>
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-brand-blue-light" />
              Spoken English Consultation
            </span>
          </div>
        </div>

        {/* The Central Interactive Kirmada Guided Workflow */}
        <InteractiveGuidedFlow />
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-2">
            Engineered For Modern Tech Careers
          </h2>
          <h3 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
            From Raw Resume to Structured Mastery
          </h3>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Every step is designed to eliminate career ambiguity and provide direct, actionable telemetry for your growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between border border-navy-750"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-navy-900 border border-navy-800 flex items-center justify-center shadow-md">
                      <Icon className={`w-6 h-6 ${f.color.split(' ')[1]}`} />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-navy-900 text-slate-300 border border-navy-700">
                      {f.badge}
                    </span>
                  </div>

                  <h4 className="font-heading font-bold text-lg text-slate-100 mb-2">
                    {f.title}
                  </h4>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
                    {f.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-navy-800/80 flex items-center gap-2 text-xs font-medium text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-time calibration</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Final Interactive CTA Banner */}
      <section className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="rounded-3xl bg-gradient-to-r from-navy-900 via-cyan-500/15 to-navy-900 border border-cyan-500/30 p-10 sm:p-16 shadow-[0_0_40px_rgba(0,240,255,0.2)] relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-xs font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>Instant Analysis • Guided by Kirmada</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
              Ready to Discover Your High-Value Career Path?
            </h2>

            <p className="text-slate-300 text-sm sm:text-base">
              Upload your resume or let Kirmada guide your personalized learning roadmap in seconds.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/upload"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-base shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
              >
                Upload Resume Now
              </Link>
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 border border-navy-700 font-medium text-base transition-colors"
              >
                Explore Live Demo
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};

export default LandingPage;
