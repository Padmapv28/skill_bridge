import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Layers, 
  ChevronRight,
  Filter,
  FileText
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import OrbitingSpinner from '../components/common/OrbitingSpinner';
import StateFallback from '../components/common/StateFallback';
import * as resumeApi from '../api/resume';
import { mockPredictedRoles, sampleParsedResume } from '../api/mockData';
import { useToast } from '../context/ToastContext';

export const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toastSuccess, toastError } = useToast();

  const [resumeData, setResumeData] = useState(location.state?.resumeData || null);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (!resumeData) return;

    const fetchPredictedRoles = async () => {
      setIsLoading(true);
      try {
        const response = await resumeApi.predictRole(resumeData);
        setRoles(response.roles || mockPredictedRoles);
      } catch (err) {
        console.warn('API error, using mock predicted roles:', err);
        setRoles(mockPredictedRoles);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictedRoles();
  }, [resumeData]);

  // If no resumeData in state, show the required robust fallback
  if (!resumeData) {
    return (
      <PageWrapper className="py-12 px-4 sm:px-6 lg:px-8">
        <StateFallback
          pageTitle="Resume Data Required"
          message="We couldn't find parsed resume data in your current session. Please upload a resume to calculate predictive role matching, or continue with our sample profile."
          primaryActionPath="/upload"
          primaryActionLabel="Go to Upload Resume"
          sampleType="resume"
          onLoadSample={() => {
            setResumeData(sampleParsedResume);
          }}
        />
      </PageWrapper>
    );
  }

  const handleViewSkillGap = (role) => {
    navigate('/skill-gap', {
      state: {
        role,
        userSkills: resumeData.skills || [],
        resumeData
      }
    });
  };

  const getScoreColorTheme = (score) => {
    if (score >= 90) return {
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      badge: 'bg-status-success/15 border-status-success/40 text-status-success',
      text: 'text-status-success',
      glow: 'shadow-glow-success'
    };
    if (score >= 80) return {
      bar: 'bg-gradient-to-r from-brand-blue to-cyan-400',
      badge: 'bg-brand-blue/15 border-brand-blue/40 text-brand-blue-light',
      text: 'text-brand-blue-light',
      glow: 'shadow-glow-blue'
    };
    if (score >= 70) return {
      bar: 'bg-gradient-to-r from-brand-gold to-amber-300',
      badge: 'bg-brand-gold/15 border-brand-gold/40 text-brand-gold',
      text: 'text-brand-gold',
      glow: 'shadow-glow-gold'
    };
    return {
      bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
      badge: 'bg-status-danger/15 border-status-danger/40 text-status-danger',
      text: 'text-status-danger',
      glow: 'shadow-glow-danger'
    };
  };

  return (
    <PageWrapper className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-8 border-b border-navy-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Step 2 of 4 • Predictive Role Scoring</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Top 5 Predicted Career Roles
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Ranked based on multi-dimensional skill synergy for <strong className="text-slate-200">{resumeData.candidateName || 'Candidate'}</strong>
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-brand-blue-light transition-colors self-start md:self-auto font-mono"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Switch Resume File</span>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-brand-blue/30 shadow-glow-blue/20">
          <OrbitingSpinner
            size="lg"
            label="Calculating Neural Role Matches..."
            subtext="Evaluating profile against 500+ tech career matrices and salary benchmarks"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {roles.map((role, index) => {
            const theme = getScoreColorTheme(role.fitScore);
            return (
              <motion.div
                key={role.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.35 }}
                className="glass-card glass-card-hover rounded-3xl p-6 sm:p-8 border border-navy-700/80 shadow-card-dark relative overflow-hidden"
              >
                {/* Ranking Pill & Score Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-navy-950 border border-navy-750 flex items-center justify-center font-mono font-bold text-sm text-slate-400">
                      #{index + 1}
                    </span>
                    <div>
                      <h2 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {role.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 -mr-0.5" />
                          {role.salaryRange}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {role.demandTrend}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <span className={`px-3 py-1 rounded-full border text-xs font-mono font-semibold ${theme.badge}`}>
                      {role.fitScore}% Fit Score
                    </span>
                  </div>
                </div>

                {/* Animated Fit-Score Progress Bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Role Compatibility Index</span>
                    <span className={theme.text}>{role.matchLevel || 'High Alignment'}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-navy-950 border border-navy-800 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${theme.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${role.fitScore}%` }}
                      transition={{ duration: 0.9, delay: 0.15 + index * 0.1, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Justification Text */}
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-5 font-sans bg-navy-950/50 p-4 rounded-2xl border border-navy-850">
                  <strong className="text-slate-200 font-semibold block mb-1">AI Match Justification:</strong>
                  {role.justification}
                </p>

                {/* Top Matching Strengths + Action CTA */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-navy-800/80">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Key Synergy:
                    </span>
                    {role.topMatchingSkills?.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-0.5 rounded-lg bg-navy-850 border border-navy-750 text-slate-300 text-xs font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleViewSkillGap(role)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-xs sm:text-sm shadow-glow-blue transition-all group focus-visible:ring-2 flex-shrink-0"
                  >
                    <span>View Skill Gap</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
};

export default ResultsPage;
