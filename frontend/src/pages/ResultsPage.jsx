import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Brain,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import PageWrapper from '../components/layout/PageWrapper';
import * as resumeApi from '../api/resume';

export const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * The UploadResumePage sends the parsed CURRENT resume
   * through React Router state.
   */
  const uploadedResume = location.state?.resumeData || null;

  const [resumeData] = useState(uploadedResume);

  const [roles, setRoles] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState('');

  /*
   * REAL AI ROLE PREDICTION
   *
   * The backend expects:
   *
   * {
   *   "resume": {...}
   * }
   *
   * and returns:
   *
   * {
   *   "predictions": [...]
   * }
   */
  useEffect(() => {
    if (!resumeData) {
      return;
    }

    let cancelled = false;

    const predictRoles = async () => {
      setIsLoading(true);
      setError('');
      setRoles([]);

      try {
        console.log(
          '[Results] Sending CURRENT resume to AI:',
          resumeData
        );

        const response = await resumeApi.predictRole(resumeData);

        console.log(
          '[Results] AI prediction response:',
          response
        );

        if (
          !response ||
          !Array.isArray(response.predictions)
        ) {
          throw new Error(
            'Backend returned an invalid prediction response.'
          );
        }

        /*
         * Convert backend format:
         *
         * role
         * fit_score
         * justification
         * key_skills
         *
         * into the format used by this UI.
         */
        const formattedRoles = response.predictions.map(
          (prediction, index) => ({
            id: `${prediction.role || 'career-role'}-${index}`,

            title:
              prediction.role ||
              'Career Role',

            fitScore:
              Number(prediction.fit_score) || 0,

            justification:
              prediction.justification ||
              'No detailed justification was returned.',

            topMatchingSkills:
              Array.isArray(prediction.key_skills)
                ? prediction.key_skills
                : [],
          })
        );

        if (!cancelled) {
          setRoles(formattedRoles);
        }

        console.log(
          '[Results] Formatted roles:',
          formattedRoles
        );
      } catch (err) {
        console.error(
          '[Results] Role prediction failed:',
          err
        );

        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              'Unable to generate AI career predictions.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    predictRoles();

    return () => {
      cancelled = true;
    };
  }, [resumeData]);

  /*
   * Navigate to Skill Gap using the CURRENT resume.
   */
  const handleViewSkillGap = (role) => {
    navigate('/skill-gap', {
      state: {
        role,
        userSkills: resumeData?.skills || [],
        resumeData,
      },
    });
  };

  /*
   * Fit score visual theme.
   */
  const getScoreColorTheme = (score) => {
    if (score >= 90) {
      return {
        bar:
          'bg-gradient-to-r from-emerald-500 to-teal-400',

        badge:
          'bg-status-success/15 border-status-success/40 text-status-success',

        text:
          'text-status-success',
      };
    }

    if (score >= 80) {
      return {
        bar:
          'bg-gradient-to-r from-brand-blue to-cyan-400',

        badge:
          'bg-brand-blue/15 border-brand-blue/40 text-brand-blue-light',

        text:
          'text-brand-blue-light',
      };
    }

    if (score >= 70) {
      return {
        bar:
          'bg-gradient-to-r from-brand-gold to-amber-300',

        badge:
          'bg-brand-gold/15 border-brand-gold/40 text-brand-gold',

        text:
          'text-brand-gold',
      };
    }

    return {
      bar:
        'bg-gradient-to-r from-rose-500 to-pink-500',

      badge:
        'bg-status-danger/15 border-status-danger/40 text-status-danger',

      text:
        'text-status-danger',
    };
  };

  /*
   * No resume was supplied.
   */
  if (!resumeData) {
    return (
      <PageWrapper className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="glass-card rounded-3xl p-10 text-center border border-red-500/30 bg-red-500/5">

          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />

          <h1 className="text-2xl font-bold text-white mb-3">
            Resume Data Not Found
          </h1>

          <p className="text-slate-400 text-sm mb-6">
            Your uploaded resume data is not available.
            Please upload your resume again.
          </p>

          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold transition-all"
          >
            <FileText className="w-4 h-4" />
            Upload Resume
          </Link>

        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-8 border-b border-navy-800">

        <div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">

            <Brain className="w-3.5 h-3.5" />

            <span>
              Step 2 of 4 • Live AI Role Prediction
            </span>

          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Top 5 Predicted Career Roles
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            AI-powered predictions generated from your uploaded resume for{' '}

            <strong className="text-slate-200">
              {resumeData.candidateName ||
                resumeData.name ||
                'Candidate'}
            </strong>
          </p>

        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-brand-blue-light transition-colors self-start md:self-auto font-mono"
        >
          <FileText className="w-3.5 h-3.5" />

          <span>
            Switch Resume File
          </span>
        </Link>

      </div>

      {/* LOADING */}
      {isLoading && (
        <div className="glass-card rounded-3xl p-16 text-center border border-brand-blue/30 shadow-glow-blue/20">

          <Loader2 className="w-12 h-12 mx-auto mb-5 text-cyan-400 animate-spin" />

          <h2 className="text-xl font-bold text-white mb-2">
            AI is analyzing your resume...
          </h2>

          <p className="text-slate-400 text-sm">
            Sending the current resume to the local Llama 3.2 model and calculating the best career roles.
          </p>

        </div>
      )}

      {/* ERROR */}
      {!isLoading && error && (
        <div className="glass-card rounded-3xl p-8 border border-red-500/30 bg-red-500/5">

          <AlertCircle className="w-10 h-10 mb-4 text-red-400" />

          <h2 className="text-xl font-bold text-red-400 mb-3">
            AI Prediction Failed
          </h2>

          <p className="text-slate-300 text-sm mb-5">
            {typeof error === 'string'
              ? error
              : JSON.stringify(error)}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-semibold"
          >
            Try Again
          </button>

        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {!isLoading &&
        !error &&
        roles.length > 0 && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">

            <div className="flex items-center gap-2 text-sm text-emerald-400">

              <CheckCircle2 className="w-4 h-4" />

              <span>
                AI predictions generated from the current uploaded resume.
              </span>

            </div>

          </div>
        )}

      {/* ROLE RESULTS */}
      {!isLoading &&
        !error &&
        roles.length > 0 && (

          <div className="space-y-6">

            {roles.map((role, index) => {

              const theme =
                getScoreColorTheme(role.fitScore);

              return (
                <motion.div
                  key={role.id}

                  initial={{
                    opacity: 0,
                    y: 20,
                  }}

                  animate={{
                    opacity: 1,
                    y: 0,
                  }}

                  transition={{
                    delay: index * 0.08,
                    duration: 0.35,
                  }}

                  className="glass-card glass-card-hover rounded-3xl p-6 sm:p-8 border border-navy-700/80 shadow-card-dark relative overflow-hidden"
                >

                  {/* ROLE HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">

                    <div className="flex items-center gap-3">

                      <span className="w-8 h-8 rounded-xl bg-navy-950 border border-navy-750 flex items-center justify-center font-mono font-bold text-sm text-slate-400">
                        #{index + 1}
                      </span>

                      <div>

                        <h2 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
                          {role.title}
                        </h2>

                        <p className="text-xs text-cyan-400 mt-1 font-mono">
                          Live AI Prediction
                        </p>

                      </div>

                    </div>

                    <span
                      className={`px-3 py-1 rounded-full border text-xs font-mono font-semibold ${theme.badge}`}
                    >
                      {role.fitScore}% Fit Score
                    </span>

                  </div>

                  {/* SCORE */}
                  <div className="space-y-1.5 mb-5">

                    <div className="flex justify-between text-[11px] font-mono text-slate-400">

                      <span>
                        AI Role Compatibility
                      </span>

                      <span className={theme.text}>
                        {role.fitScore >= 90
                          ? 'Excellent Match'
                          : role.fitScore >= 80
                          ? 'Strong Match'
                          : role.fitScore >= 70
                          ? 'Good Match'
                          : 'Developing Match'}
                      </span>

                    </div>

                    <div className="w-full h-2.5 rounded-full bg-navy-950 border border-navy-800 overflow-hidden">

                      <motion.div
                        className={`h-full rounded-full ${theme.bar}`}

                        initial={{
                          width: 0,
                        }}

                        animate={{
                          width: `${Math.min(
                            Math.max(role.fitScore, 0),
                            100
                          )}%`,
                        }}

                        transition={{
                          duration: 0.9,
                          delay: 0.15 + index * 0.1,
                          ease: 'easeOut',
                        }}
                      />

                    </div>

                  </div>

                  {/* JUSTIFICATION */}
                  <div className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-5 font-sans bg-navy-950/50 p-4 rounded-2xl border border-navy-850">

                    <strong className="text-slate-200 font-semibold block mb-1">
                      AI Match Justification:
                    </strong>

                    {role.justification}

                  </div>

                  {/* SKILLS + SKILL GAP */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-navy-800/80">

                    <div className="flex flex-wrap items-center gap-1.5">

                      <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">

                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />

                        AI Identified Skills:

                      </span>

                      {role.topMatchingSkills.map(
                        (skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="px-2.5 py-0.5 rounded-lg bg-navy-850 border border-navy-750 text-slate-300 text-xs font-mono"
                          >
                            {skill}
                          </span>
                        )
                      )}

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleViewSkillGap(role)
                      }
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-xs sm:text-sm shadow-glow-blue transition-all group focus-visible:ring-2 flex-shrink-0"
                    >

                      <span>
                        View Skill Gap
                      </span>

                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />

                    </button>

                  </div>

                </motion.div>
              );
            })}

          </div>
        )}

      {/* EMPTY */}
      {!isLoading &&
        !error &&
        roles.length === 0 && (

          <div className="glass-card rounded-3xl p-10 text-center border border-amber-500/30 bg-amber-500/5">

            <AlertCircle className="w-10 h-10 mx-auto mb-4 text-amber-400" />

            <h2 className="text-xl font-bold text-white mb-2">
              No AI Predictions Returned
            </h2>

            <p className="text-slate-400 text-sm mb-5">
              The AI service returned no career predictions.
            </p>

            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-sm"
            >
              Upload Again
            </Link>

          </div>
        )}

    </PageWrapper>
  );
};

export default ResultsPage;