import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  Terminal, 
  Cpu, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Radio, 
  Video, 
  Maximize2, 
  ShieldCheck, 
  Zap, 
  DollarSign, 
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HERO_CAMS = [
  {
    id: 'cam_dev',
    label: 'CAM-01 // ENGINEERING BAY',
    dept: 'Full-Stack Distributed Systems',
    status: '14 Active PRs • Live Coding',
    color: '#0066FF',
    primaryChar: {
      name: 'Elena Rostova',
      role: 'Principal Frontend Architect',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      screenCode: 'const match = await resumeAI.alignRole(candidateProfile);',
      bubble: 'Reviewing streaming UI and React micro-frontends'
    },
    secondaryChar: {
      name: 'Marcus Vance',
      role: 'Senior Backend Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      screenCode: 'SELECT * FROM role_vectors WHERE similarity > 0.92;',
      bubble: 'Optimizing Redis distributed cache latency (12ms)'
    },
    liveTelemetry: 'Elena pushed commit "feat(rag): streaming agent pipeline" • 2s ago'
  },
  {
    id: 'cam_ai',
    label: 'CAM-02 // AI RESEARCH LAB',
    dept: 'GenAI & Neural Embeddings',
    status: 'GPU Cluster 98% • Epoch 48/50',
    color: '#00D2FF',
    primaryChar: {
      name: 'Dr. Aris Thorne',
      role: 'Lead GenAI Researcher',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
      screenCode: 'embeddings.vector_search(query_vec, top_k=5, metric="cosine")',
      bubble: 'Fine-tuning vector similarity on 500k tech roles'
    },
    secondaryChar: {
      name: 'Maya Lin',
      role: 'AI Interface Engineer',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      screenCode: 'const evalScore = await deepEval.benchmark(agent);',
      bubble: 'Agent evaluation benchmark: 94.2% precision'
    },
    liveTelemetry: 'GPU Node 04: Vector similarity converged at 0.942 • 4s ago'
  },
  {
    id: 'cam_talent',
    label: 'CAM-03 // TALENT HQ',
    dept: 'Executive Talent & Hiring Suite',
    status: 'Scanning Resumes • 3 Offers Ready',
    color: '#F59E0B',
    primaryChar: {
      name: 'Sarah Jenkins',
      role: 'VP of Engineering Talent',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80',
      screenCode: 'ATS_COMPLIANCE = 92%; FIT_SCORE = 94%; BAND = "$210k";',
      bubble: 'Auditing Alex Chen: 94% fit for AI Application Engineer'
    },
    secondaryChar: {
      name: 'Hiring Committee',
      role: 'Executive Review Board',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      screenCode: 'DISPATCH_OFFER_LETTER({ base: 210000, equity: 120000 });',
      bubble: 'Approved fast-track interview invitation dispatch'
    },
    liveTelemetry: 'Resume Parser: Alex Chen scored 94% fit • Fast-Track dispatched'
  },
  {
    id: 'cam_cloud',
    label: 'CAM-04 // CLOUD DEVOPS',
    dept: 'Server Farm & Global Infrastructure',
    status: '99.99% Uptime • 18 Microservices',
    color: '#10B981',
    primaryChar: {
      name: 'Devin Kester',
      role: 'Staff SRE & Cloud Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      screenCode: 'kubectl scale deployment/resume-api --replicas=18',
      bubble: 'Monitoring global Edge latency (18ms across all regions)'
    },
    secondaryChar: {
      name: 'Security Bot',
      role: 'Zero-Trust Scanner',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
      screenCode: 'SECURITY_AUDIT_PASS: 0 vulnerabilities across 42 containers',
      bubble: 'Zero-trust verification active on document buffer'
    },
    liveTelemetry: 'Kubernetes: Auto-scaled 18 pods for live resume traffic • 1s ago'
  }
];

export const HeroLiveOfficeScene = () => {
  const [activeCamIdx, setActiveCamIdx] = useState(0);
  const [isAutoCycle, setIsAutoCycle] = useState(true);
  const [clockTime, setClockTime] = useState('');

  const cam = HERO_CAMS[activeCamIdx];

  // Update clock every second
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setClockTime(d.toTimeString().split(' ')[0] + ' UTC');
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-cycle through camera feeds
  useEffect(() => {
    if (!isAutoCycle) return;
    const interval = setInterval(() => {
      setActiveCamIdx((prev) => (prev + 1) % HERO_CAMS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoCycle]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#091226] via-navy-950 to-navy-950 border border-navy-700 shadow-2xl backdrop-blur-md">
      {/* Top CCTV Surveillance HUD Bar */}
      <div className="p-4 sm:p-5 bg-navy-900/90 border-b border-navy-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="w-3 h-3 rounded-full bg-rose-500 block animate-ping" />
            <span className="w-2 h-2 rounded-full bg-rose-600 block absolute top-0.5 left-0.5" />
          </div>
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            LIVE IT COMPANY CCTV // {cam.label}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold hidden sm:inline-block">
            60 FPS HD
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-400 bg-navy-950 px-2.5 py-1 rounded-lg border border-navy-800">
            {clockTime || '18:30:00 UTC'}
          </span>
          <button
            type="button"
            onClick={() => setIsAutoCycle(!isAutoCycle)}
            className="px-2.5 py-1 rounded-lg bg-navy-950 hover:bg-navy-800 text-slate-300 text-[11px] font-mono border border-navy-800 flex items-center gap-1.5 transition-colors"
          >
            <Radio className={`w-3 h-3 ${isAutoCycle ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{isAutoCycle ? 'Auto' : 'Manual'}</span>
          </button>
        </div>
      </div>

      {/* Camera Feed Selector Tabs */}
      <div className="grid grid-cols-4 border-b border-navy-800/80 bg-navy-950/60">
        {HERO_CAMS.map((c, idx) => {
          const isSelected = activeCamIdx === idx;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCamIdx(idx);
                setIsAutoCycle(false);
              }}
              className={`py-2.5 px-2 sm:px-4 text-center transition-all border-b-2 font-mono text-[10px] sm:text-xs font-semibold relative ${
                isSelected
                  ? 'border-brand-blue-light text-white bg-brand-blue/10 shadow-glow-blue'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-navy-900/40'
              }`}
            >
              {isSelected && (
                <motion.div
                  className="absolute top-0 left-0 right-0 h-0.5 bg-brand-blue-light"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4.5, ease: 'linear' }}
                />
              )}
              <span className="block truncate">{c.id.replace('cam_', 'CAM 0')}</span>
              <span className="text-[9px] text-slate-500 block truncate hidden sm:block">
                {c.dept.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Office Viewport */}
      <div className="p-5 sm:p-7 space-y-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={cam.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg sm:text-xl text-white">
                  {cam.dept}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Department Status: <span className="text-emerald-400 font-semibold">{cam.status}</span>
                </p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            </div>

            {/* 2 Animated Workstation Desks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Workstation */}
              <div className="p-4 rounded-2xl bg-navy-900/90 border border-navy-750 space-y-3 relative overflow-hidden group hover:border-brand-blue/60 transition-all">
                {/* Screen Glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blue/15 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={cam.primaryChar.avatar}
                      alt={cam.primaryChar.name}
                      className="w-11 h-11 rounded-xl object-cover border border-navy-700 shadow-md"
                    />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-navy-900 absolute -bottom-1 -right-1" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-xs sm:text-sm text-white">
                      {cam.primaryChar.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {cam.primaryChar.role}
                    </p>
                  </div>
                </div>

                {/* Animated Screen Code Terminal */}
                <div className="p-2.5 rounded-xl bg-black/80 border border-navy-850 font-mono text-[10px] sm:text-[11px] text-cyan-300 overflow-x-hidden truncate">
                  <span className="text-brand-gold mr-1">&gt;</span>
                  {cam.primaryChar.screenCode}
                </div>

                {/* Speech Bubble */}
                <p className="text-[11px] text-slate-300 font-sans italic bg-navy-950/70 p-2 rounded-lg border border-navy-850">
                  "{cam.primaryChar.bubble}"
                </p>
              </div>

              {/* Secondary Workstation */}
              <div className="p-4 rounded-2xl bg-navy-900/90 border border-navy-750 space-y-3 relative overflow-hidden group hover:border-cyan-500/60 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/15 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={cam.secondaryChar.avatar}
                      alt={cam.secondaryChar.name}
                      className="w-11 h-11 rounded-xl object-cover border border-navy-700 shadow-md"
                    />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-navy-900 absolute -bottom-1 -right-1" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-xs sm:text-sm text-white">
                      {cam.secondaryChar.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {cam.secondaryChar.role}
                    </p>
                  </div>
                </div>

                {/* Animated Screen Code Terminal */}
                <div className="p-2.5 rounded-xl bg-black/80 border border-navy-850 font-mono text-[10px] sm:text-[11px] text-emerald-300 overflow-x-hidden truncate">
                  <span className="text-brand-gold mr-1">&gt;</span>
                  {cam.secondaryChar.screenCode}
                </div>

                {/* Speech Bubble */}
                <p className="text-[11px] text-slate-300 font-sans italic bg-navy-950/70 p-2 rounded-lg border border-navy-850">
                  "{cam.secondaryChar.bubble}"
                </p>
              </div>
            </div>

            {/* Real-Time Telemetry Bar */}
            <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 font-mono text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span className="text-emerald-400 font-bold flex-shrink-0">&gt; live stream:</span>
                <span className="truncate">{cam.liveTelemetry}</span>
              </div>
              <span className="text-[10px] text-brand-blue-light font-bold flex-shrink-0 ml-2">
                ● SYNCED
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Action Footer inside Hero Scene */}
      <div className="p-4 bg-navy-900/70 border-t border-navy-800 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-brand-blue-light" />
          Active Workplaces Connected
        </span>
        <Link
          to="/upload"
          className="text-brand-blue-light hover:text-white font-semibold font-mono text-[11px] flex items-center gap-1 transition-colors"
        >
          <span>Scan My Resume in This Office</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

export default HeroLiveOfficeScene;
