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
  FileText,
  AlertCircle,
  Briefcase,
  ExternalLink
} from 'lucide-react';

import PageWrapper from '../components/layout/PageWrapper';
import OrbitingSpinner from '../components/common/OrbitingSpinner';
import StateFallback from '../components/common/StateFallback';
import JobOpeningsModal from '../components/jobs/JobOpeningsModal';
import * as resumeApi from '../api/resume';
import { sampleParsedResume } from '../api/mockData';
import { useToast } from '../context/ToastContext';
import { useResume } from '../context/ResumeContext';
import { useVoiceAssistant } from '../context/VoiceContext';



export const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toastSuccess, toastError } = useToast();
  const { speak } = useVoiceAssistant();

  const {
    parsedResume,
    setResume,
    predictions,
    setPredictions,
    setSelectedRole,
    setSkillGap,
    setRoadmap
  } = useResume();

  const [resumeData, setResumeData] = useState(
    location.state?.resumeData || parsedResume || null
  );

  const [roles, setRoles] = useState(() =>
    location.state?.forceRefresh
      ? []
      : (predictions && predictions.length > 0 ? predictions : [])
  );

  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [roleError, setRoleError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [selectedRoleForJobs, setSelectedRoleForJobs] = useState(null);

  const handleOpenJobs = (role) => {
    setSelectedRoleForJobs(role);
    speak(`Fetching current verified job openings for ${role.title}. I found active opportunities across LinkedIn, Indeed, Google Jobs, and leading tech companies.`);
  };

  useEffect(() => {
    if (location.state?.resumeData) {
      setResume(location.state.resumeData);
      setResumeData(location.state.resumeData);
    } else if (parsedResume && !resumeData) {
      setResumeData(parsedResume);
    }
  }, [location.state?.resumeData, parsedResume]);

  useEffect(() => {
    if (!resumeData) return;

    // Never reuse old predictions when ATS requests a fresh analysis.
    if (!location.state?.forceRefresh && roles.length > 0) {
      speak(
        `Loaded saved career predictions. Your top role is ${roles[0]?.title || 'not available'}.`
      );
      return;
    }

    let cancelled = false;

    const fetchPredictedRoles = async () => {
      setIsLoading(true);
      setRoleError('');

      try {
        const response = await resumeApi.predictRole(resumeData);

        const rawPredictions = Array.isArray(response?.predictions)
          ? response.predictions
          : Array.isArray(response?.roles)
            ? response.roles
            : Array.isArray(response)
              ? response
              : [];

        const fetchedRoles = rawPredictions
          .map((item, index) => {
            const title =
              item?.role ||
              item?.title ||
              item?.role_title ||
              item?.name;

            if (!title) return null;

            const rawScore =
              item?.fit_score ??
              item?.fitScore ??
              item?.match_score ??
              item?.matchScore;

            const numericScore =
              rawScore === null ||
              rawScore === undefined ||
              rawScore === ''
                ? null
                : Number(rawScore);

            const fitScore =
              numericScore !== null && Number.isFinite(numericScore)
                ? Math.max(0, Math.min(100, numericScore))
                : null;

            const skills =
              item?.key_skills ??
              item?.keySkills ??
              item?.topMatchingSkills;

            const computedMatchLevel =
              fitScore === null
                ? 'Fit score unavailable'
                : fitScore >= 80
                  ? 'Strong Match'
                  : fitScore >= 60
                    ? 'Moderate Match'
                    : 'Needs Development';

            return {
              id: item?.id || `predicted-role-${index + 1}`,
              title,
              fitScore,
              matchLevel:
                item?.match_level ||
                item?.matchLevel ||
                computedMatchLevel,
              salaryRange:
                item?.salary_range ??
                item?.salaryRange ??
                item?.salary ??
                null,
              demandTrend:
                item?.demand_trend ??
                item?.demandTrend ??
                item?.growth_rate ??
                item?.growthRate ??
                null,
              justification:
                item?.justification ||
                item?.reason ||
                'The prediction service did not provide an explanation.',
              topMatchingSkills: Array.isArray(skills) ? skills : []
            };
          })
          .filter(Boolean);

        if (fetchedRoles.length === 0) {
          throw new Error(
            'The role prediction API returned no usable roles. Check the backend response and try again.'
          );
        }

        if (cancelled) return;

        setRoles(fetchedRoles);
        setPredictions(fetchedRoles);
        setRoleError('');

        speak(
          `Career predictions calculated for ${resumeData.candidateName || resumeData.name || 'your profile'}. Your top role is ${fetchedRoles[0]?.title}.`
        );
      } catch (error) {
        if (cancelled) return;

        console.error('[Role Matcher] Prediction failed:', error);

        const message =
          error?.response?.data?.detail ||
          error?.message ||
          'Unable to predict roles from this resume.';

        setRoleError(message);
        setRoles([]);
        setPredictions([]);
        toastError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPredictedRoles();

    return () => {
      cancelled = true;
    };
  }, [resumeData, location.state?.forceRefresh, retryCount]);

  if (!resumeData) {
    return (
      <PageWrapper className="py-12 px-4 sm:px-6 lg:px-8">
        <StateFallback
          pageTitle="Resume Data Required"
          message="We couldn't find parsed resume data in your current session. Please upload a resume to calculate predictive role matching, or explicitly choose a sample profile."
          primaryActionPath="/upload"
          primaryActionLabel="Go to Upload Resume"
          sampleType="resume"
          onLoadSample={() => {
            setResume(sampleParsedResume);
            setResumeData(sampleParsedResume);
            setRoles([]);
            setPredictions([]);
            setRoleError('');
            speak('Loaded sample resume profile for evaluation.');
          }}
        />
      </PageWrapper>
    );
  }

  const handleViewSkillGap = (role) => {
    setSelectedRole(role);
    setSkillGap(null);
    setRoadmap(null);

    speak(
      `Selected ${role.title}. Let's examine your skill gaps and market alignment.`
    );

    navigate('/skill-gap', {
      state: {
        role,
        userSkills: resumeData.skills || [],
        resumeData,
        forceRefresh: true
      }
    });
  };

  const getScoreColorTheme = (score) => {
    if (score >= 90) {
      return {
        bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        badge: 'bg-status-success/15 border-status-success/40 text-status-success',
        text: 'text-status-success',
        glow: 'shadow-glow-success'
      };
    }

    if (score >= 80) {
      return {
        bar: 'bg-gradient-to-r from-brand-blue to-cyan-400',
        badge: 'bg-brand-blue/15 border-brand-blue/40 text-brand-blue-light',
        text: 'text-brand-blue-light',
        glow: 'shadow-glow-blue'
      };
    }

    if (score >= 70) {
      return {
        bar: 'bg-gradient-to-r from-brand-gold to-amber-300',
        badge: 'bg-brand-gold/15 border-brand-gold/40 text-brand-gold',
        text: 'text-brand-gold',
        glow: 'shadow-glow-gold'
      };
    }

    return {
      bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
      badge: 'bg-status-danger/15 border-status-danger/40 text-status-danger',
      text: 'text-status-danger',
      glow: 'shadow-glow-danger'
    };
  };

  return (
    <PageWrapper className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
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
            Ranked based on multi-dimensional skill synergy for{' '}
            <strong className="text-slate-200">
              {resumeData.candidateName || resumeData.name || 'Candidate'}
            </strong>
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

      {isLoading ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-brand-blue/30 shadow-glow-blue/20">
          <OrbitingSpinner
            size="lg"
            label="Calculating Neural Role Matches..."
            subtext="Evaluating the current resume against career requirements."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {roles.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 border border-rose-500/30 text-center">
              <AlertCircle className="w-10 h-10 mx-auto text-rose-400 mb-3" />

              <h2 className="text-xl font-heading font-bold text-white">
                Role prediction unavailable
              </h2>

              <p className="text-sm text-slate-400 mt-2">
                {roleError || 'No role predictions are available for this resume.'}
              </p>

              <button
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
                className="mt-5 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : (
            roles.map((role, index) => {
              const theme = getScoreColorTheme(role.fitScore ?? 0);

              return (
                <motion.div
                  key={role.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.35 }}
                  className="glass-card glass-card-hover rounded-3xl p-6 sm:p-8 border border-navy-700/80 shadow-card-dark relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-navy-950 border border-navy-750 flex items-center justify-center font-mono font-bold text-sm text-slate-400">
                        #{index + 1}
                      </span>

                      <div>
                        <h2 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
                          {role.title}
                        </h2>

                        {(role.salaryRange || role.demandTrend) && (
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {role.salaryRange && (
                              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                                <DollarSign className="w-3 h-3 -mr-0.5" />
                                {role.salaryRange}
                              </span>
                            )}

                            {role.salaryRange && role.demandTrend && (
                              <span className="text-slate-600">•</span>
                            )}

                            {role.demandTrend && (
                              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {role.demandTrend}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-mono font-semibold ${theme.badge}`}
                      >
                        {role.fitScore === null || role.fitScore === undefined
                          ? 'Fit score unavailable'
                          : `${role.fitScore}% Fit Score`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Role Compatibility Index</span>

                      <span className={theme.text}>
                        {role.matchLevel ||
                          (role.fitScore === null || role.fitScore === undefined
                            ? 'Fit score unavailable'
                            : role.fitScore >= 80
                              ? 'Strong Match'
                              : role.fitScore >= 60
                                ? 'Moderate Match'
                                : 'Needs Development')}
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-navy-950 border border-navy-800 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${theme.bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${role.fitScore ?? 0}%` }}
                        transition={{
                          duration: 0.9,
                          delay: 0.15 + index * 0.1,
                          ease: 'easeOut'
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-5 font-sans bg-navy-950/50 p-4 rounded-2xl border border-navy-850">
                    <strong className="text-slate-200 font-semibold block mb-1">
                      AI Match Justification:
                    </strong>
                    {role.justification}
                  </p>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-navy-800/80">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Key Synergy:
                      </span>

                      {role.topMatchingSkills?.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-2.5 py-0.5 rounded-lg bg-navy-850 border border-navy-750 text-slate-300 text-xs font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenJobs(role)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-850 hover:bg-navy-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/35 hover:border-cyan-400 font-semibold text-xs sm:text-sm transition-all shadow-sm group"
                      >
                        <Briefcase className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span>Live Openings & Apply</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleViewSkillGap(role)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-xs sm:text-sm shadow-glow-blue transition-all group focus-visible:ring-2 flex-shrink-0"
                      >
                        <span>View Skill Gap</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Direct Job Openings Modal */}
      <JobOpeningsModal
        isOpen={!!selectedRoleForJobs}
        onClose={() => setSelectedRoleForJobs(null)}
        role={selectedRoleForJobs}
        onViewSkillGap={handleViewSkillGap}
      />
    </PageWrapper>
  );
};

export default ResultsPage;
