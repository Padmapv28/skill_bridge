import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Activity,
  Search,
  FileCheck2,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import InteractiveGuidedFlow from '../components/guide/InteractiveGuidedFlow';
import { useResume } from '../context/ResumeContext';
import { useVoiceAssistant } from '../context/VoiceContext';
import { sampleParsedResume } from '../api/mockData';

const COMMON_ROLES = [
  { id: 'ai-eng', title: 'AI Application Engineer', salary: '$190k - $225k', tags: ['Python', 'LLMs', 'RAG'] },
  { id: 'cloud-arch', title: 'Staff Full-Stack Cloud Architect', salary: '$210k - $250k', tags: ['AWS', 'K8s', 'Distributed'] },
  { id: 'platform-lead', title: 'Senior Platform Infrastructure Lead', salary: '$195k - $235k', tags: ['Go', 'Docker', 'CI/CD'] },
  { id: 'ml-eng', title: 'Machine Learning Engineer', salary: '$180k - $215k', tags: ['PyTorch', 'MLOps', 'Transformers'] },
  { id: 'fullstack-dev', title: 'Senior Full-Stack Developer', salary: '$160k - $195k', tags: ['React', 'Node.js', 'PostgreSQL'] },
  { id: 'devops-lead', title: 'DevOps / SRE Lead', salary: '$175k - $210k', tags: ['Terraform', 'Kubernetes', 'Linux'] },
  { id: 'data-scientist', title: 'Principal Data Scientist', salary: '$185k - $220k', tags: ['Statistics', 'Python', 'SQL'] },
  { id: 'cyber-sec', title: 'Cloud Security Architect', salary: '$190k - $230k', tags: ['IAM', 'Zero-Trust', 'SOC2'] },
  { id: 'frontend-lead', title: 'Lead Frontend Architect', salary: '$165k - $200k', tags: ['React 18', 'TypeScript', 'WebGL'] },
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const { setResume, setSelectedRole } = useResume();
  const { speak } = useVoiceAssistant();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Filter common roles based on search input
  const filteredRoles = COMMON_ROLES.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setIsDropdownOpen(false);
    speak(`Target role selected: ${role.title}. Let's audit your skill gaps and market alignment.`);
    navigate('/skill-gap', { state: { role, roleTitle: role.title } });
  };

  const handleQuickDemo = () => {
    setResume(sampleParsedResume);
    speak("Loading interactive live demo profile with senior benchmarks.");
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
      {/* Hero Section with Kirmada & Search Bar */}
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
            with AI Precision
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-sans">
            Consult directly with Kirmada, your AI Career Architect. Search target job roles, upload your resume, evaluate ATS compatibility, and follow your customized 3-phase execution roadmap.
          </p>

          {/* Quick Trust Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-400">
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

        {/* Task 1: Prominent Job Role Search Bar + Dual Entry Points */}
        <div className="max-w-2xl mx-auto mb-12 space-y-4">
          <div ref={searchContainerRef} className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-cyan-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="Search target roles (e.g., AI Application Engineer, Cloud Architect, DevOps)..."
                className="w-full pl-12 pr-28 py-4 rounded-2xl bg-navy-900/90 border border-cyan-500/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder-slate-400 text-sm shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (filteredRoles.length > 0) handleSelectRole(filteredRoles[0]);
                }}
                className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 text-white font-mono text-xs font-bold shadow-md hover:brightness-110 transition-all"
              >
                Search
              </button>
            </div>

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-navy-950/95 border border-cyan-500/30 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden divide-y divide-navy-800/80 max-h-72 overflow-y-auto"
                >
                  {filteredRoles.length > 0 ? (
                    filteredRoles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleSelectRole(role)}
                        className="w-full p-3.5 px-4 text-left hover:bg-navy-900/80 transition-colors flex items-center justify-between group"
                      >
                        <div className="space-y-0.5">
                          <div className="font-heading font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                            {role.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-emerald-400">{role.salary}</span>
                            <span className="text-[10px] text-slate-500">•</span>
                            <span className="text-[10px] font-mono text-slate-400">{role.tags.join(', ')}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs font-mono text-slate-400">
                      No matching roles found. Try "AI", "Cloud", or "Full Stack".
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Dual Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/upload"
              onClick={() => speak("Navigating to Resume Upload. Let's parse your credentials.")}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-heading font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Resume (Start Pipeline)</span>
            </Link>

            <Link
              to="/ats-score"
              onClick={() => speak("Opening the ATS Evaluator. Compare your resume against any real-world job description.")}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-navy-900 hover:bg-navy-850 text-cyan-300 border border-cyan-500/40 font-heading font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              <span>Check ATS Score & Paste JD</span>
            </Link>
          </div>
        </div>

        {/* The Central Interactive Kirmada Guided Workflow */}
        <InteractiveGuidedFlow />
      </section>

      {/* Task 1: Dedicated "Check ATS Score" Showcase Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-navy-900 via-[#07132B] to-navy-900 border border-cyan-500/30 shadow-[0_0_35px_rgba(0,240,255,0.15)] relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pre-Application Diagnostic</span>
              </div>

              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                Wondering How Your Resume Scores with Company ATS Systems?
              </h2>

              <p className="text-sm sm:text-base text-slate-300 font-sans max-w-2xl leading-relaxed">
                Before submitting to job boards, paste the exact job description and test your resume. Our hybrid Sentence-Transformer + LLM engine provides matched keywords, missing requirements, and specific phrasing fixes.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Semantic Embeddings
                </span>
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <CheckCircle2 className="w-4 h-4" /> Sub-Score Breakdown
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <CheckCircle2 className="w-4 h-4" /> Actionable Fixes
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center">
              <Link
                to="/ats-score"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-blue to-cyan-500 hover:from-brand-blue-hover hover:to-cyan-400 text-white font-heading font-bold text-sm shadow-glow-cyan transition-all flex items-center justify-center gap-2"
              >
                <span>Launch ATS Checker</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-2">
            Engineered For Modern Tech Careers
          </h2>
          <h3 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
            From Raw Resume to Structured Mastery
          </h3>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Every step eliminates ambiguity and provides direct, actionable telemetry for your growth.
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
      <section className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
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
