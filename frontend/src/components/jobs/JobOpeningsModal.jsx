import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  ExternalLink, 
  X, 
  MapPin, 
  Clock, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  TrendingUp, 
  Search,
  Zap,
  Globe
} from 'lucide-react';
import { getLiveJobPortalLinks, getPresentOpeningsForRole } from '../../utils/jobOpenings';
import { useVoiceAssistant } from '../../context/VoiceContext';

export const JobOpeningsModal = ({ isOpen, onClose, role, onViewSkillGap }) => {
  const { speak } = useVoiceAssistant();

  useEffect(() => {
    if (isOpen && role) {
      speak(
        `Fetching current verified job openings for ${role.title}. I found active opportunities across LinkedIn, Indeed, Google Jobs, and leading tech companies.`
      );
    }
  }, [isOpen, role]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !role) return null;

  const livePortals = getLiveJobPortalLinks(role.title);
  const presentOpenings = getPresentOpeningsForRole(role);

  const handleApplyClick = (opening) => {
    speak(`Opening live application portal for ${opening.company}. Best of luck with your application!`);
  };

  const handlePortalClick = (portal) => {
    speak(`Opening ${portal.name} with real-time openings for ${role.title}.`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-navy-950/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-navy-900 border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border-b border-navy-800 flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Actively Hiring Now
                </span>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  Real-Time Live Application Portals
                </span>
              </div>

              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-cyan-400" />
                <span>{role.title}</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-sans">
                Showing present available openings and live-filtered job portal application links.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-400 hover:text-white border border-navy-750 transition-colors flex-shrink-0"
              title="Close Modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-8 custom-scrollbar">
            {/* Section 1: 1-Click Real-Time Search Portals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>Real-Time Job Openings Search (Filtered to Past 7 Days)</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">1-Click Live Search</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {livePortals.map((portal) => (
                  <a
                    key={portal.id}
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handlePortalClick(portal)}
                    className="p-3.5 rounded-2xl bg-navy-950/80 hover:bg-navy-850 border border-navy-750 hover:border-cyan-400/60 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-heading font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                          {portal.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy-900 border border-navy-700 text-cyan-300">
                          {portal.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {portal.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-navy-850 flex items-center justify-between text-xs font-mono text-cyan-400 group-hover:text-cyan-300">
                      <span>View Present Openings</span>
                      <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Section 2: Present Verified Company Openings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Present Openings ({presentOpenings.length} Active Positions)</span>
                </h3>
                <span className="text-xs font-mono text-emerald-400">Direct Application Available</span>
              </div>

              <div className="space-y-4">
                {presentOpenings.map((job) => (
                  <div
                    key={job.id}
                    className="p-5 sm:p-6 rounded-2xl bg-navy-950/90 border border-navy-750 hover:border-cyan-500/40 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 group shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      {/* Company Avatar / Logo */}
                      <img
                        src={job.logo}
                        alt={job.company}
                        className="w-12 h-12 rounded-xl object-cover border border-navy-700 flex-shrink-0 shadow-md"
                      />

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-heading font-bold text-sm text-cyan-400">
                            {job.company}
                          </span>
                          {job.urgentHiring && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-mono text-rose-300 font-bold">
                              ⚡ Urgently Hiring
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">
                            {job.postedTime}
                          </span>
                        </div>

                        <h4 className="font-heading font-bold text-base sm:text-lg text-white group-hover:text-cyan-300 transition-colors">
                          {job.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-300">
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            {job.location}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center gap-1 text-emerald-400">
                            <DollarSign className="w-3.5 h-3.5 -mr-0.5" />
                            {job.salaryRange}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">
                            Exp: {job.experienceLevel}
                          </span>
                        </div>

                        {/* Matched Skills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {job.skills?.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md bg-navy-900 border border-navy-800 text-slate-300 text-[11px] font-mono"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Direct Apply Buttons */}
                    <div className="flex sm:flex-row lg:flex-col items-center gap-2.5 w-full lg:w-auto flex-shrink-0">
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleApplyClick(job)}
                        className="w-full lg:w-44 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 hover:from-brand-blue-hover hover:to-cyan-400 text-white font-heading font-bold text-xs tracking-wide shadow-glow-cyan flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <span>Apply on Company Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {job.portalSearchUrl && (
                        <a
                          href={job.portalSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => speak(`Checking LinkedIn listings for ${job.company}.`)}
                          className="w-full lg:w-44 py-2 px-3 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-navy-750 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors text-center"
                        >
                          <span>View on LinkedIn</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-6 bg-navy-950 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 font-mono text-center sm:text-left">
              Want to eliminate your skill gaps before applying?
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 sm:w-auto px-4 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-300 text-xs font-mono transition-colors"
              >
                Close
              </button>

              {onViewSkillGap && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewSkillGap(role);
                  }}
                  className="w-1/2 sm:w-auto px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-heading font-bold flex items-center justify-center gap-1.5 shadow-glow-blue transition-all"
                >
                  <span>Audit Skill Gap & Roadmap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default JobOpeningsModal;
