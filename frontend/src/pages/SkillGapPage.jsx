import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  ArrowRight, 
  ArrowLeft, 
  Map, 
  Sparkles, 
  Layers,
  HelpCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import OrbitingSpinner from '../components/common/OrbitingSpinner';
import CircularProgress from '../components/common/CircularProgress';
import StateFallback from '../components/common/StateFallback';
import * as resumeApi from '../api/resume';
import { mockSkillGapDatabase, mockPredictedRoles, sampleParsedResume } from '../api/mockData';
import { useToast } from '../context/ToastContext';

export const SkillGapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toastSuccess, toastError } = useToast();

  const [role, setRole] = useState(location.state?.role || null);
  const [userSkills, setUserSkills] = useState(location.state?.userSkills || []);
  const [skillGap, setSkillGap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!role) return;

    const fetchSkillGap = async () => {
      setIsLoading(true);
      try {
        const response = await resumeApi.getSkillGap({ role, userSkills });
        setSkillGap(response.skillGap || mockSkillGapDatabase[role.id] || mockSkillGapDatabase.default);
      } catch (err) {
        console.warn('API error, using mock skill gap data:', err);
        setSkillGap(mockSkillGapDatabase[role.id] || mockSkillGapDatabase.default);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkillGap();
  }, [role, userSkills]);

  // Robust fallback if user visits directly or refreshes without route state
  if (!role) {
    return (
      <PageWrapper className="py-12 px-4 sm:px-6 lg:px-8">
        <StateFallback
          pageTitle="Target Role Required"
          message="To audit skill gaps, please select a target role from your prediction results or run the analysis with our demo AI Application Engineer role."
          primaryActionPath="/results"
          primaryActionLabel="Back to Role Predictions"
          secondaryActionPath="/upload"
          secondaryActionLabel="Upload Resume"
          sampleType="role"
          onLoadSample={() => {
            setRole(mockPredictedRoles[0]);
            setUserSkills(sampleParsedResume.skills);
          }}
        />
      </PageWrapper>
    );
  }

  const handleBuildRoadmap = () => {
    if (!skillGap) return;
    navigate('/roadmap', {
      state: {
        role,
        userSkills,
        missingSkills: skillGap.missingSkills || [],
        partialSkills: skillGap.partialSkills || [],
        matchPercentage: skillGap.matchPercentage
      }
    });
  };

  return (
    <PageWrapper className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header with Role Title & Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-navy-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-xs font-mono mb-2">
            <Target className="w-3.5 h-3.5" />
            <span>Step 3 of 4 • Precision Skill Gap Audit</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Skill Gap Benchmark: <span className="text-brand-blue-light">{role.title}</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Tri-tier competency audit comparing your profile against market standards
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            to="/results"
            state={{ resumeData: location.state?.resumeData || sampleParsedResume }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-850 text-slate-300 hover:text-white border border-navy-750 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Predicted Roles</span>
          </Link>
        </div>
      </div>

      {isLoading || !skillGap ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-brand-gold/30 shadow-glow-gold/20">
          <OrbitingSpinner
            size="lg"
            label="Performing Tri-Tier Skill Audit..."
            subtext={`Benchmarking competencies for ${role.title}`}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Score Summary Banner */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-navy-700/80 shadow-card-dark grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Animated Circular Progress Ring */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-navy-950/60 rounded-2xl border border-navy-850">
              <CircularProgress
                percentage={skillGap.matchPercentage || 75}
                size={160}
                strokeWidth={12}
                label="Role Readiness"
              />
              <div className="mt-3 text-center">
                <span className="text-xs font-mono text-slate-400">
                  Target Threshold: <strong className="text-white">{skillGap.benchmarkScore || 85}%</strong>
                </span>
              </div>
            </div>

            {/* Strategic Overview Summary */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/30 text-brand-blue-light text-xs font-mono font-medium">
                  Readiness Synthesis
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Total Skills Audited: {((skillGap.matchedSkills?.length || 0) + (skillGap.partialSkills?.length || 0) + (skillGap.missingSkills?.length || 0))}
                </span>
              </div>

              <h2 className="font-heading text-xl sm:text-2xl font-bold text-white leading-snug">
                {skillGap.summary || 'Strong foundational synergy with distinct high-leverage focus areas.'}
              </h2>

              {/* Stat Counters */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-navy-950/70 border border-status-success/30">
                  <p className="font-mono text-xl font-bold text-status-success">
                    {skillGap.matchedSkills?.length || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Matched</p>
                </div>

                <div className="p-3 rounded-xl bg-navy-950/70 border border-brand-gold/30">
                  <p className="font-mono text-xl font-bold text-brand-gold">
                    {skillGap.partialSkills?.length || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Partial Gaps</p>
                </div>

                <div className="p-3 rounded-xl bg-navy-950/70 border border-status-danger/30">
                  <p className="font-mono text-xl font-bold text-status-danger">
                    {skillGap.missingSkills?.length || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Missing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tri-Tier Skill Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Matched Skills (Green Tags) */}
            <div className="glass-card rounded-3xl p-6 border border-status-success/30 shadow-glow-success/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-navy-800">
                  <div className="w-8 h-8 rounded-xl bg-status-success/15 border border-status-success/40 flex items-center justify-center text-status-success">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-slate-100 text-sm">
                      Matched Skills
                    </h3>
                    <p className="text-[11px] text-emerald-400 font-mono">
                      Verified Proficiencies
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skillGap.matchedSkills?.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="px-3 py-1.5 rounded-xl bg-status-success/10 border border-status-success/35 text-status-success text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.name || item}</span>
                      {item.proficiency && (
                        <span className="text-[10px] text-emerald-300 opacity-70">({item.proficiency})</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              <p className="mt-6 pt-4 border-t border-navy-800/80 text-[11px] text-slate-400">
                Direct resume evidence aligns with current market requirements.
              </p>
            </div>

            {/* 2. Partial Skills (Gold Tags) */}
            <div className="glass-card rounded-3xl p-6 border border-brand-gold/30 shadow-glow-gold/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-navy-800">
                  <div className="w-8 h-8 rounded-xl bg-brand-gold/15 border border-brand-gold/40 flex items-center justify-center text-brand-gold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-slate-100 text-sm">
                      Partial Growth Areas
                    </h3>
                    <p className="text-[11px] text-amber-400 font-mono">
                      Adjacent or Incomplete
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {skillGap.partialSkills?.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-2.5 rounded-xl bg-brand-gold/10 border border-brand-gold/35 text-brand-gold text-xs font-mono space-y-1 shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{item.name || item}</span>
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-slate-300 font-sans font-normal leading-snug">
                          {item.notes}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              <p className="mt-6 pt-4 border-t border-navy-800/80 text-[11px] text-slate-400">
                You have transferable concepts; minor upskilling needed.
              </p>
            </div>

            {/* 3. Missing Skills (Red Tags) */}
            <div className="glass-card rounded-3xl p-6 border border-status-danger/30 shadow-glow-danger/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-navy-800">
                  <div className="w-8 h-8 rounded-xl bg-status-danger/15 border border-status-danger/40 flex items-center justify-center text-status-danger">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-slate-100 text-sm">
                      Missing Capabilities
                    </h3>
                    <p className="text-[11px] text-rose-400 font-mono">
                      High Impact Priorities
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {skillGap.missingSkills?.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-2.5 rounded-xl bg-status-danger/10 border border-status-danger/35 text-status-danger text-xs font-mono flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                        <PlusCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{item.name || item}</span>
                      </div>
                      {item.demand && (
                        <span className="px-2 py-0.5 rounded-md bg-status-danger/20 text-[10px] text-rose-200 uppercase font-mono font-bold flex-shrink-0">
                          {item.demand}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              <p className="mt-6 pt-4 border-t border-navy-800/80 text-[11px] text-slate-400">
                Primary blockers for senior tier compensation bands.
              </p>
            </div>
          </div>

          {/* Action CTA Bar */}
          <div className="rounded-3xl bg-gradient-to-r from-navy-900 via-brand-blue/15 to-navy-900 border border-brand-blue/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-glow-blue">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-heading text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="w-5 h-5 text-brand-gold" />
                Ready to bridge the {((skillGap.missingSkills?.length || 0) + (skillGap.partialSkills?.length || 0))} identified skill gaps?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Generate a structured 3-phase curriculum with verified external course material.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBuildRoadmap}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-sm shadow-glow-blue flex items-center justify-center gap-2.5 transition-all group focus-visible:ring-2 flex-shrink-0"
            >
              <Map className="w-4 h-4" />
              <span>Build My Roadmap</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default SkillGapPage;
