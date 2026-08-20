import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Monitor, 
  Cpu, 
  Terminal, 
  Video, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Coffee, 
  Server, 
  ShieldCheck, 
  Zap, 
  Layers, 
  DollarSign, 
  Radio,
  Eye,
  Maximize2,
  Minimize2
} from 'lucide-react';

const OFFICE_ZONES = [
  {
    id: 'zone_eng',
    camId: 'CAM-01 // DEV-BAY',
    name: 'Full-Stack Engineering Bay',
    floor: 'Floor 4 - North Wing',
    status: 'High Velocity • 14 Active PRs',
    themeColor: '#0066FF',
    description: 'Core software engineering teams building distributed cloud applications and high-concurrency user interfaces.',
    employees: [
      {
        id: 'emp_1',
        name: 'Elena Rostova',
        role: 'Principal Frontend Architect',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
        action: 'Reviewing React Server Components & Micro-Frontend bundle size',
        stack: ['React 18', 'TypeScript', 'Next.js', 'Web Vitals'],
        status: '● Live Coding'
      },
      {
        id: 'emp_2',
        name: 'Marcus Vance',
        role: 'Senior Backend Engineer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        action: 'Optimizing PostgreSQL query plans and distributed Redis lock queues',
        stack: ['Node.js', 'PostgreSQL', 'Redis', 'Docker'],
        status: '● PR Review'
      }
    ],
    liveLogs: [
      'Elena committed: "feat(ui): streaming chunk parser with fallback" (2s ago)',
      'Marcus merged: "perf(db): composite indexing for user telemetry" (14s ago)',
      'CI/CD Pipeline: 42 test suites passed in 1.4s (Green)'
    ]
  },
  {
    id: 'zone_ai',
    camId: 'CAM-02 // AI-LAB',
    name: 'GenAI & Neural Research Lab',
    floor: 'Floor 4 - Lab 4B',
    status: 'GPU Cluster Active • 98.4% Load',
    themeColor: '#00D2FF',
    description: 'Specialized team developing LLM agent frameworks, vector similarity indexing, and automated prompt evaluations.',
    employees: [
      {
        id: 'emp_3',
        name: 'Dr. Aris Thorne',
        role: 'Lead GenAI Systems Researcher',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80',
        action: 'Fine-tuning RAG hybrid search pipeline on 500k role embedding pairs',
        stack: ['Python', 'LangChain', 'Pinecone', 'LlamaIndex', 'DeepEval'],
        status: '● Model Training'
      },
      {
        id: 'emp_4',
        name: 'Maya Lin',
        role: 'AI Interface & Agent Engineer',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
        action: 'Integrating multi-agent tool calling with real-time SSE streaming',
        stack: ['TypeScript', 'OpenAI API', 'Vector DBs', 'FastAPI'],
        status: '● Evals Testing'
      }
    ],
    liveLogs: [
      'GPU Node 04: Vector similarity score converged at 0.942 (3s ago)',
      'Embedding pipeline: Ingested 1,200 tech role skill matrices (20s ago)',
      'Agent benchmark: Hallucination rate reduced to <0.8% (1m ago)'
    ]
  },
  {
    id: 'zone_talent',
    camId: 'CAM-03 // TALENT-HQ',
    name: 'Executive Talent & Hiring Suite',
    floor: 'Floor 5 - Talent Center',
    status: 'Scanning Resumes • 3 Offers Ready',
    themeColor: '#F59E0B',
    description: 'Hiring directors and tech recruiters actively matching candidates to open $180k-$250k engineering positions.',
    employees: [
      {
        id: 'emp_5',
        name: 'Sarah Jenkins',
        role: 'VP of Engineering Talent',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&auto=format&fit=crop&q=80',
        action: 'Auditing Alex Chen’s verified resume: 94% fit for AI Application Engineer',
        stack: ['ATS Scoring', 'Salary Banding', 'Interview Fast-Track'],
        status: '● Candidate Screening'
      }
    ],
    liveLogs: [
      'Resume Parser: Scanned candidate profile with 18 verified hard skills (Just now)',
      'Hiring Matrix: AI Application Engineer matched at 94% compatibility (8s ago)',
      'Offer Generator: Dispatched $210,000 package recommendation (45s ago)'
    ]
  },
  {
    id: 'zone_infra',
    camId: 'CAM-04 // CLOUD-DEV',
    name: 'Cloud DevOps & Server Farm',
    floor: 'Sub-Level 1 - Core Datacenter',
    status: '99.99% Uptime • 18 Microservices',
    themeColor: '#10B981',
    description: 'Infrastructure engineers orchestrating Kubernetes clusters, zero-downtime deployment pipelines, and global CDN caching.',
    employees: [
      {
        id: 'emp_6',
        name: 'Devin Kester',
        role: 'Staff SRE & Cloud Architect',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        action: 'Monitoring global Edge latency across US-East, EU-West, and AP-South',
        stack: ['Kubernetes', 'Terraform', 'AWS', 'Prometheus'],
        status: '● Cluster Health 100%'
      }
    ],
    liveLogs: [
      'Kubernetes: Autoscaled 12 pods for surge API traffic (4s ago)',
      'Edge CDN: Global TTFB latency clocked at 18ms (30s ago)',
      'Security Audit: Zero vulnerabilities detected across 42 containers (2m ago)'
    ]
  }
];

export const InteractiveOfficeFloor = () => {
  const [selectedZoneIdx, setSelectedZoneIdx] = useState(0);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [timeString, setTimeString] = useState('');
  const [isLiveActive, setIsLiveActive] = useState(true);

  const zone = OFFICE_ZONES[selectedZoneIdx];

  // Update simulated real-time office clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-cycle through camera feeds if live is active
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      setSelectedZoneIdx((prev) => (prev + 1) % OFFICE_ZONES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isLiveActive]);

  return (
    <div className="w-full rounded-3xl bg-navy-950/90 border border-navy-750 p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Top CCTV Surveillance Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-8 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 block animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 block absolute top-0.5 left-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                LIVE IT COMPANY OFFICE SCENARIO STREAM
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                FEED ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Silicon Valley HQ • Tech Operations & Candidate Hiring Hub
            </p>
          </div>
        </div>

        {/* Timestamp & Camera Feed Switcher Pills */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-750 font-mono text-xs text-cyan-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-brand-blue-light" />
            <span>{timeString || '18:24:00 UTC'}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsLiveActive(!isLiveActive)}
            className="px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-850 text-slate-300 hover:text-white border border-navy-750 font-mono text-xs transition-colors flex items-center gap-1.5"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{isLiveActive ? 'Auto-Cycle ON' : 'Manual Camera'}</span>
          </button>
        </div>
      </div>

      {/* Camera Selection Tab Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
        {OFFICE_ZONES.map((oz, idx) => {
          const isSelected = selectedZoneIdx === idx;
          return (
            <button
              key={oz.id}
              type="button"
              onClick={() => {
                setSelectedZoneIdx(idx);
                setIsLiveActive(false);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-navy-900 border-brand-blue shadow-glow-blue text-white scale-[1.02]'
                  : 'bg-navy-950/80 border-navy-800 text-slate-400 hover:text-slate-200 hover:bg-navy-900/50'
              }`}
            >
              {isSelected && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue-light"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5.5, ease: 'linear' }}
                />
              )}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold" style={{ color: oz.themeColor }}>
                  {oz.camId}
                </span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
              </div>
              <p className="font-heading font-bold text-xs sm:text-sm text-slate-100 line-clamp-1">
                {oz.name}
              </p>
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                {oz.floor}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Real-World Office Scenario Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Video Animatic Office Feed */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative rounded-2xl bg-gradient-to-b from-[#091124] to-navy-950 border border-navy-700/80 p-6 sm:p-8 shadow-2xl overflow-hidden min-h-[360px] flex flex-col justify-between">
            {/* Surveillance HUD Overlay Lines */}
            <div className="absolute top-3 left-3 text-[10px] font-mono text-cyan-400/70 pointer-events-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>LIVE FEED: {zone.camId}</span>
            </div>
            <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-400 pointer-events-none">
              60 FPS // HD 1080p
            </div>

            {/* Corner crosshairs */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/40 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/40 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/40 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/40 pointer-events-none" />

            {/* Center Animated Office Illustration */}
            <div className="my-auto py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Zone Name & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-heading font-extrabold text-2xl text-white tracking-tight">
                        {zone.name}
                      </h4>
                      <p className="text-xs text-slate-300 font-sans mt-0.5">
                        {zone.description}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-navy-900 border border-navy-700 text-xs font-mono text-emerald-400 self-start sm:self-auto flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {zone.status}
                    </span>
                  </div>

                  {/* Animated Workstation Desks / Employee Avatars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {zone.employees.map((emp) => (
                      <motion.div
                        key={emp.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setActiveEmployee(emp)}
                        className="p-4 rounded-xl bg-navy-900/85 border border-navy-750 hover:border-brand-blue/60 transition-all cursor-pointer space-y-3 relative group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-11 h-11 rounded-xl object-cover border border-navy-700 shadow-md flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-heading font-bold text-sm text-white truncate">
                              {emp.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {emp.role}
                            </p>
                            <span className="text-[10px] font-mono text-emerald-400 font-semibold block mt-0.5">
                              {emp.status}
                            </span>
                          </div>
                        </div>

                        {/* Current Real-World Action */}
                        <div className="p-2.5 rounded-lg bg-navy-950/80 border border-navy-850 text-xs text-slate-300 font-sans leading-snug">
                          <span className="text-cyan-400 font-mono text-[10px] uppercase font-bold block mb-0.5">
                            Active Task:
                          </span>
                          {emp.action}
                        </div>

                        {/* Tech Stack Pills */}
                        <div className="flex flex-wrap gap-1">
                          {emp.stack.map((st, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-navy-950 border border-navy-800 text-[10px] font-mono text-slate-300"
                            >
                              {st}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Feed Status Strip */}
            <div className="pt-4 border-t border-navy-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-brand-blue-light" />
                Workstations Connected: 24/24
              </span>
              <span className="text-cyan-400">
                Click any employee desk to inspect
              </span>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Real-Time Office Event Ticker & Candidate Synergy Feed */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Office Console Log Box */}
          <div className="p-5 rounded-2xl bg-navy-950 border border-navy-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-brand-gold" />
                <span>Live Office Telemetry Logs</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">STREAMING</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {zone.liveLogs.map((log, lIdx) => (
                <motion.div
                  key={lIdx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: lIdx * 0.1 }}
                  className="p-3 rounded-xl bg-navy-900/80 border border-navy-800 text-slate-300 leading-snug flex items-start gap-2"
                >
                  <span className="text-cyan-400 font-bold flex-shrink-0">&gt;</span>
                  <span>{log}</span>
                </motion.div>
              ))}
            </div>

            {/* Candidate Impact Callout */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-brand-blue/15 via-cyan-500/10 to-transparent border border-brand-blue/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">
                  Candidate Mapping Synergy
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  94.8% Match
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Your React, TypeScript, and Node.js proficiencies match the exact workflow requirements in this engineering bay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveOfficeFloor;
