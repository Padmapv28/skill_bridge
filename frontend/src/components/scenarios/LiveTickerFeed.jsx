import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Building2, CheckCircle2, DollarSign } from 'lucide-react';

const LIVE_EVENTS = [
  { company: 'OpenAI', role: 'AI Applications Engineer', salary: '$210,000', location: 'San Francisco', match: '96%', time: 'Just now' },
  { company: 'Google DeepMind', role: 'Staff Full-Stack Architect', salary: '$245,000', location: 'Mountain View', match: '93%', time: '12s ago' },
  { company: 'Stripe', role: 'Senior Platform Engineer', salary: '$195,000', location: 'Seattle / Remote', match: '91%', time: '28s ago' },
  { company: 'Meta', role: 'GenAI Infrastructure Lead', salary: '$230,000', location: 'Menlo Park', match: '94%', time: '45s ago' },
  { company: 'Anthropic', role: 'Prompt & Evaluation Engineer', salary: '$190,000', location: 'San Francisco', match: '89%', time: '1m ago' },
  { company: 'Netflix', role: 'Distributed Systems Engineer', salary: '$260,000', location: 'Los Gatos', match: '95%', time: '2m ago' },
];

export const LiveTickerFeed = () => {
  return (
    <div className="w-full bg-navy-900/70 border-y border-navy-800/80 py-2.5 overflow-hidden backdrop-blur-md relative select-none">
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-navy-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-navy-950 to-transparent z-10 pointer-events-none" />

      <div className="flex items-center">
        <div className="flex-shrink-0 px-4 flex items-center gap-2 border-r border-navy-750 z-20 bg-navy-900/90 text-[11px] font-mono font-bold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400">LIVE</span> SCENARIO STREAM:
        </div>

        {/* Animated Marquee Strip */}
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 32 }}
          className="flex items-center gap-8 whitespace-nowrap will-change-transform pl-4"
        >
          {[...LIVE_EVENTS, ...LIVE_EVENTS].map((item, idx) => (
            <div key={idx} className="inline-flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Building2 className="w-3.5 h-3.5 text-brand-blue-light" />
                {item.company}
              </span>
              <span className="text-slate-400 font-sans">•</span>
              <span className="text-slate-200">{item.role}</span>
              <span className="px-2 py-0.5 rounded-md bg-status-success/15 border border-status-success/30 text-status-success font-mono text-[10px] font-bold">
                {item.match} Match
              </span>
              <span className="text-emerald-400 font-mono text-[11px] font-semibold flex items-center">
                <DollarSign className="w-3 h-3 -mr-0.5" />
                {item.salary}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">({item.time})</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LiveTickerFeed;
