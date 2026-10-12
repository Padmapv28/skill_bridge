import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Map, 
  CheckSquare, 
  Square, 
  ExternalLink, 
  Clock, 
  Award, 
  BookOpen, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  Layers,
  GraduationCap,
  Download,
  Share2
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import OrbitingSpinner from '../components/common/OrbitingSpinner';
import StateFallback from '../components/common/StateFallback';
import * as resumeApi from '../api/resume';
import { useToast } from '../context/ToastContext';
import { useResume } from '../context/ResumeContext';
import { useVoiceAssistant } from '../context/VoiceContext';


const PHASE_THEMES = ['foundation', 'intermediate', 'advanced'];

const normalizeRoadmapForUi = (source) => {
  if (!source || typeof source !== 'object') return null;
  const sourcePhases = Array.isArray(source.phases) ? source.phases : [];
  return {
    ...source,
    targetTimeline: source.targetTimeline || source.target_timeline || '12 weeks',
    finalProject: source.finalProject || source.final_project || '',
    careerAdvice: source.careerAdvice || source.career_advice || '',
    phases: sourcePhases.map((phase, index) => ({
      ...phase,
      phaseNumber: phase.phaseNumber ?? phase.phase_number ?? phase.phase ?? (index + 1),
      name: phase.name || phase.focus || `${phase.title || `Phase ${index + 1}`} Skill Path`,
      title: phase.title || phase.name || ['Foundation', 'Intermediate', 'Advanced'][index] || `Phase ${index + 1}`,
      theme: phase.theme || PHASE_THEMES[Math.min(index, PHASE_THEMES.length - 1)],
    })),
  };
};

export const RoadmapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toastSuccess, toastInfo } = useToast();
  const { speak } = useVoiceAssistant();
  const { 
    roadmapResult, 
    setRoadmap: setContextRoadmap, 
    selectedRole,
    parsedResume,
    skillGapResult,
    isLoadingSession,
    skillProgress,
    updateSkillStatus
  } = useResume();

  const [role, setRole] = useState(location.state?.role || selectedRole || null);
  const resumeData = parsedResume || (isLoadingSession ? location.state?.resumeData : null) || null;
  const [missingSkills, setMissingSkills] = useState(location.state?.missingSkills || []);
  const [partialSkills, setPartialSkills] = useState(location.state?.partialSkills || []);
  const [roadmap, setRoadmap] = useState(() => normalizeRoadmapForUi(roadmapResult));
  const [isLoading, setIsLoading] = useState(false);
  const [roadmapError, setRoadmapError] = useState('');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [courseSuggestions, setCourseSuggestions] = useState({});
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const roleTitleOf = (value) => typeof value === 'string' ? value.trim() : String(value?.title || value?.role || value?.name || '').trim();
  const roleTitle = roleTitleOf(role);
  const displayTimeline = roadmap?.targetTimeline || roadmap?.target_timeline || '12 weeks';

  // Coming directly from Skill Gap means the user has fresh gap inputs.
  // In that flow, do not silently reuse an older roadmap for the same role;
  // ask the backend to generate a new roadmap from the current resume and gaps.
  const hasFreshSkillGapInput = Boolean(
    location.state &&
    (location.state.resumeData ||
      Array.isArray(location.state.missingSkills) ||
      Array.isArray(location.state.partialSkills))
  );

  useEffect(() => {
    if (location.state?.role && roleTitleOf(location.state.role) !== roleTitleOf(role)) {
      setRole(location.state.role);
    } else if (selectedRole && !role) {
      setRole(selectedRole);
    }
    if (location.state?.missingSkills) setMissingSkills(location.state.missingSkills);
    if (location.state?.partialSkills) setPartialSkills(location.state.partialSkills);
  }, [location.state?.role, location.state?.missingSkills, location.state?.partialSkills, selectedRole]);

  // Once the authenticated session is hydrated, its server-side roadmap is the
  // source of truth. Do not revive a stale browser-cached roadmap if the server has none.
  useEffect(() => {
    if (isLoadingSession) return;
    setRoadmap(normalizeRoadmapForUi(roadmapResult));
  }, [isLoadingSession, roadmapResult]);

  // Restore skill-gap details after refresh so the next roadmap uses the actual gaps.
  useEffect(() => {
    if (isLoadingSession) return;
    if (location.state?.missingSkills === undefined && Array.isArray(skillGapResult?.missingSkills)) {
      setMissingSkills(skillGapResult.missingSkills);
    }
    if (location.state?.partialSkills === undefined && Array.isArray(skillGapResult?.partialSkills)) {
      setPartialSkills(skillGapResult.partialSkills);
    }
  }, [isLoadingSession, location.state?.missingSkills, location.state?.partialSkills, skillGapResult]);

  useEffect(() => {
    if (isLoadingSession) return;
    if (!roleTitle) return;
    if (!resumeData) {
      setRoadmapError('No resume is loaded for this account. Upload a resume before generating a roadmap.');
      return;
    }
    const savedRoadmap = normalizeRoadmapForUi(roadmapResult);
    const existingRole = roleTitleOf(savedRoadmap?.role);
    if (savedRoadmap && existingRole.toLowerCase() === roleTitle.toLowerCase() && !hasFreshSkillGapInput) {
      setRoadmap(savedRoadmap);
      setRoadmapError('');
      speak(`Roadmap loaded for ${roleTitle}.`);
      return;
    }

    let cancelled = false;
    const fetchRoadmap = async () => {
      setIsLoading(true);
      setRoadmapError('');
      try {
        const response = await resumeApi.generateRoadmap({
          role: roleTitle,
          resumeData,
          missingSkills,
          partialSkills,
        });
        const generated = response.roadmap;
        if (!generated || !Array.isArray(generated.phases) || generated.phases.length === 0) {
          throw new Error('The backend did not return a valid roadmap.');
        }
        if (cancelled) return;
        const normalizedRoadmap = normalizeRoadmapForUi(generated);
        const withId = { ...normalizedRoadmap, roadmap_id: response.roadmap_id || generated.roadmap_id || null };
        setRoadmap(withId);
        setContextRoadmap(withId);
        speak(`Personalized roadmap generated for ${roleTitle}.`);
      } catch (err) {
        if (cancelled) return;
        const message = err?.response?.data?.detail || err?.message || 'Roadmap generation failed.';
        console.error('Roadmap generation failed:', err);
        setRoadmapError(message);
        setRoadmap(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchRoadmap();
    return () => { cancelled = true; };
  }, [roleTitle, resumeData, missingSkills, partialSkills, retryAttempt, isLoadingSession, hasFreshSkillGapInput]);

  // Direct Learning Suggestions are loaded separately from the roadmap model.
  // Course titles and URLs come from the course matcher or search-link fallbacks,
  // not from the LLM inventing resource URLs.
  useEffect(() => {
    if (isLoadingSession || !roleTitle) return;
    let cancelled = false;
    const loadSuggestions = async () => {
      setCoursesLoading(true);
      setCoursesError('');
      try {
        const result = await resumeApi.getCourseSuggestions({ role: roleTitle, missingSkills, partialSkills });
        if (!cancelled) setCourseSuggestions(result?.course_suggestions || {});
      } catch (err) {
        if (cancelled) return;
        const message = err?.response?.data?.detail || err?.message || 'Could not load course suggestions.';
        setCoursesError(message);
        setCourseSuggestions({});
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    };
    loadSuggestions();
    return () => { cancelled = true; };
  }, [roleTitle, JSON.stringify(missingSkills), JSON.stringify(partialSkills), isLoadingSession]);

  // Robust fallback for direct access or refresh without state
  if (!role) {
    return (
      <PageWrapper className="py-12 px-4 sm:px-6 lg:px-8">
        <StateFallback
          pageTitle="Roadmap Parameters Missing"
          message="To build a personalized roadmap, select a predicted role and complete the skill-gap analysis first."
          primaryActionPath="/results"
          primaryActionLabel="Go to Role Predictions"
          secondaryActionPath="/upload"
          secondaryActionLabel="Upload Resume"
        />
      </PageWrapper>
    );
  }

  const handleSkillStatusChange = async (skill, phaseNumber, newStatus) => {
    const skillName = typeof skill === 'string' ? skill : (skill?.name || skill?.title || 'Skill');
    if (!roadmap?.roadmap_id) {
      toastInfo('Roadmap progress will be available after the backend assigns a roadmap ID.');
      return;
    }
    try {
      await updateSkillStatus({
        roadmapId: roadmap.roadmap_id,
        skillName,
        phaseNumber,
        status: newStatus,
      });
      if (newStatus === 'completed') {
        toastSuccess(`Marked "${skillName}" as Completed!`);
        speak(`Milestone achieved! ${skillName} completed.`);
      } else if (newStatus === 'in_progress') {
        toastInfo(`Marked "${skillName}" as In Progress.`);
        speak(`Marked ${skillName} as in progress.`);
      } else {
        speak(`Reset ${skillName} to todo.`);
      }
    } catch (error) {
      toastInfo(error?.response?.data?.detail || error.message || 'Could not save roadmap progress.');
    }
  };

  // Phase color styling lookup using dedicated phase theme tokens
  const getPhaseStyles = (phaseTheme) => {
    switch (phaseTheme) {
      case 'foundation':
        return {
          nodeBg: 'bg-phase-foundation/20',
          nodeBorder: 'border-phase-foundation',
          nodeText: 'text-phase-foundation-light',
          badge: 'bg-phase-foundation-dim text-phase-foundation-light border-phase-foundation-border',
          cardBorder: 'border-phase-foundation-border/40',
          accent: 'text-phase-foundation',
          connector: 'bg-gradient-to-b from-phase-foundation to-phase-intermediate'
        };
      case 'intermediate':
        return {
          nodeBg: 'bg-phase-intermediate/20',
          nodeBorder: 'border-phase-intermediate',
          nodeText: 'text-phase-intermediate-light',
          badge: 'bg-phase-intermediate-dim text-phase-intermediate-light border-phase-intermediate-border',
          cardBorder: 'border-phase-intermediate-border/40',
          accent: 'text-phase-intermediate',
          connector: 'bg-gradient-to-b from-phase-intermediate to-phase-advanced'
        };
      case 'advanced':
      default:
        return {
          nodeBg: 'bg-phase-advanced/20',
          nodeBorder: 'border-phase-advanced',
          nodeText: 'text-phase-advanced-light',
          badge: 'bg-phase-advanced-dim text-phase-advanced-light border-phase-advanced-border',
          cardBorder: 'border-phase-advanced-border/40',
          accent: 'text-phase-advanced',
          connector: '' // No line past the final phase
        };
    }
  };

  // Calculate total progress from skillProgress
  const allSkills = (roadmap?.phases?.flatMap((p) => p.skills || []) || []).map((skill, index) => ({
    name: typeof skill === 'string' ? skill : (skill?.name || skill?.title || `Skill ${index + 1}`),
    id: typeof skill === 'string' ? skill : (skill?.id || skill?.name || `skill_${index}`),
  }));
  const totalSkillsCount = allSkills.length;
  const completedCount = allSkills.filter((skill) => (skillProgress[skill.name] || skillProgress[skill.id]) === 'completed').length;
  const inProgressCount = allSkills.filter((skill) => (skillProgress[skill.name] || skillProgress[skill.id]) === 'in_progress').length;
  const progressPercent = totalSkillsCount > 0 ? Math.round((completedCount / totalSkillsCount) * 100) : 0;

  // Trigger celebration on 100% completion
  useEffect(() => {
    if (progressPercent === 100 && totalSkillsCount > 0) {
      speak(`Congratulations! You have completed all roadmap milestones and achieved 100 percent candidate readiness for ${roleTitle || 'your target role'}!`);
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [progressPercent, totalSkillsCount]);

  return (
    <PageWrapper className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-navy-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-success/10 border border-status-success/30 text-status-success text-xs font-mono mb-2">
            <Map className="w-3.5 h-3.5" />
            <span>Step 4 of 4 • Personalized 3-Phase Execution</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Learning Roadmap: <span className="text-brand-blue-light">{roleTitle}</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Sequenced progression designed to bridge critical skill gaps with verified courses
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            to="/skill-gap"
            state={{ role, userSkills: resumeData?.skills || [], resumeData, missingSkills, partialSkills }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-850 text-slate-300 hover:text-white border border-navy-750 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Review Skill Gap</span>
          </Link>
        </div>
      </div>

      {roadmapError && !isLoading ? (
        <div className="glass-card rounded-3xl p-8 border border-rose-500/30 text-center">
          <p className="text-sm text-rose-300">Roadmap generation failed: {roadmapError}</p>
          <div className="flex gap-3 justify-center mt-5">
            <button type="button" onClick={() => setRetryAttempt((v) => v + 1)} className="px-5 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold">Retry Roadmap</button>
            <Link to="/skill-gap" state={{ role, resumeData, missingSkills, partialSkills }} className="px-5 py-2.5 rounded-xl border border-navy-700 text-slate-200 text-sm">Back to Skill Gap</Link>
          </div>
        </div>
      ) : isLoading || !roadmap ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-brand-blue/30 shadow-glow-blue/20">
          <OrbitingSpinner
            size="lg"
            label="Synthesizing Tailored Learning Path..."
            subtext={`Generating 3-phase curriculum for ${roleTitle}`}
          />
        </div>
      ) : (
        <div className="space-y-10">
          {/* Progress Tracker Card */}
          <div className="glass-card rounded-3xl p-6 border border-navy-700/80 shadow-card-dark flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-brand-gold" />
                  Roadmap Milestone Progress
                </span>
                <span className="text-brand-blue-light font-bold">
                  {completedCount} / {totalSkillsCount} Skills Mastered ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-navy-950 border border-navy-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-blue via-cyan-400 to-status-success"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              <span className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-xl bg-navy-950 border border-navy-800">
                Pacing: <strong className="text-white">{displayTimeline}</strong>
              </span>
            </div>
          </div>

          {/* Direct Learning Suggestions: all gap skills, certification + free, beginner + advanced */}
          <section className="glass-card rounded-3xl p-6 sm:p-8 border border-cyan-500/25 shadow-card-dark space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-white">Direct Learning Suggestions</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Resources for every missing or partial skill, including certification paths and free learning options.</p>
              </div>
            </div>

            {coursesLoading && (
              <div className="flex items-center gap-3 text-sm text-slate-400 py-4">
                <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                Matching learning resources to your skill gaps...
              </div>
            )}
            {!coursesLoading && coursesError && (
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/25 text-sm text-rose-300">{coursesError}</div>
            )}
            {!coursesLoading && !coursesError && Object.keys(courseSuggestions).length === 0 && (
              <p className="p-4 rounded-xl bg-navy-950/60 border border-navy-800 text-sm text-slate-400">
                No missing or partial skills were provided, so no additional suggestions are needed.
              </p>
            )}
            {!coursesLoading && !coursesError && Object.entries(courseSuggestions).map(([skillName, groups]) => (
              <div key={skillName} className="space-y-3">
                <h3 className="text-sm font-semibold text-white">{skillName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['certification', 'free'].map((kind) => (
                    <div key={`${skillName}-${kind}`} className="rounded-2xl bg-navy-950/60 border border-navy-800 p-4 space-y-3">
                      <h4 className="text-xs uppercase tracking-wider font-mono text-cyan-300">{kind === 'certification' ? 'Certification / structured courses' : 'Free resources'}</h4>
                      {(groups?.[kind] || []).map((course, index) => (
                        <div key={`${skillName}-${kind}-${index}`} className="border-t border-navy-800 pt-3 first:border-0 first:pt-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-slate-100">{course.title}</p>
                            <span className="shrink-0 rounded-md border border-navy-700 px-2 py-0.5 text-[10px] text-slate-400">{course.level || 'All levels'}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{course.platform || course.provider || (kind === 'free' ? 'Free resource' : 'Course provider')}</p>
                          {course.url && (
                            <a href={course.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs text-cyan-300 hover:text-white">
                              Open resource <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Vertical Timeline */}
          <div className="relative pl-4 sm:pl-8 space-y-12">
            {roadmap.phases?.map((phase, pIdx) => {
              const isLastPhase = pIdx === roadmap.phases.length - 1;
              const styles = getPhaseStyles(phase.theme);

              return (
                <div key={phase.id || pIdx} className="relative group">
                  {/* Timeline Left Node / Milestone Indicator */}
                  <div className="absolute -left-4 sm:-left-8 top-0 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-2xl ${styles.nodeBg} border-2 ${styles.nodeBorder} flex items-center justify-center font-mono font-bold text-xs ${styles.nodeText} shadow-md z-10 bg-navy-950`}>
                      0{phase.phaseNumber || pIdx + 1}
                    </div>

                    {/* Connecting Vertical Line: DO NOT draw line past the final phase! */}
                    {!isLastPhase && (
                      <div 
                        className={`w-0.5 min-h-[380px] sm:min-h-[320px] h-full ${styles.connector} opacity-70 my-1`}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Main Phase Card Content */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: pIdx * 0.1, duration: 0.4 }}
                    className={`ml-6 sm:ml-8 glass-card rounded-3xl p-6 sm:p-8 border ${styles.cardBorder} shadow-card-dark space-y-6`}
                  >
                    {/* Phase Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-navy-800">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono uppercase font-bold tracking-wider ${styles.badge}`}>
                            {phase.title}
                          </span>
                          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {phase.duration}
                          </span>
                        </div>
                        <h2 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
                          {phase.name || phase.focus || phase.title || `Phase ${pIdx + 1}`}
                        </h2>
                      </div>
                    </div>

                    {/* Phase Description */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                      {phase.description}
                    </p>

                    {/* Interactive Skill Checklist */}
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <CheckSquare className="w-3.5 h-3.5 text-brand-blue-light" />
                        Phase Competency Checklist
                      </h3>

                      <div className="space-y-2.5 bg-navy-950/70 p-4 rounded-2xl border border-navy-850">
                        {phase.skills?.map((skill, sIdx) => {
                          const skillName = typeof skill === 'string' ? skill : (skill.name || skill.title || `Skill ${sIdx + 1}`);
                          const skillId = typeof skill === 'string' ? skill : (skill.id || skill.name || `skill_${sIdx}`);
                          const status = skillProgress[skillName] || skillProgress[skillId] || 'not_started';
                          const isDone = status === 'completed';
                          const isInProg = status === 'in_progress';

                          return (
                            <div
                              key={skillId}
                              className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl transition-all border ${
                                isDone
                                  ? 'bg-status-success/10 border-status-success/30 text-emerald-300'
                                  : isInProg
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                  : 'bg-navy-900/50 border-navy-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : isInProg ? (
                                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border border-slate-600" />
                                  )}
                                </div>
                                <span className={`text-xs sm:text-sm font-sans font-medium ${isDone ? 'line-through opacity-85' : ''}`}>
                                  {skillName}
                                </span>
                              </div>

                              {/* 3-State Progress Toggle Buttons */}
                              <div className="flex items-center gap-1 self-end sm:self-auto bg-navy-950 p-1 rounded-lg border border-navy-800 text-[11px] font-mono">
                                <button
                                  type="button"
                                  onClick={() => handleSkillStatusChange({ name: skillName, id: skillId }, phase.phase || phase.phaseNumber || (pIdx + 1), 'not_started')}
                                  className={`px-2 py-0.5 rounded transition-colors ${
                                    status === 'not_started'
                                      ? 'bg-navy-800 text-slate-300 font-bold'
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  Todo
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSkillStatusChange({ name: skillName, id: skillId }, phase.phase || phase.phaseNumber || (pIdx + 1), 'in_progress')}
                                  className={`px-2 py-0.5 rounded transition-colors ${
                                    status === 'in_progress'
                                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  In Progress
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSkillStatusChange({ name: skillName, id: skillId }, phase.phase || phase.phaseNumber || (pIdx + 1), 'completed')}
                                  className={`px-2 py-0.5 rounded transition-colors ${
                                    status === 'completed'
                                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Practical Project Recommendation from LLM */}
                      {phase.project && (
                        <div className="mt-3 p-3.5 rounded-xl bg-navy-950/80 border border-brand-blue/30 text-xs text-slate-300 flex items-start gap-2.5 shadow-sm">
                          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-mono font-bold text-cyan-300">Phase Project: </span>
                            <span className="font-sans text-slate-200">{phase.project}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recommended Courses as Clickable Cards */}
                    {phase.courses && phase.courses.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
                          Curated Recommended Courses
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {phase.courses.map((course) => (
                            <div
                              key={course.id}
                              className="p-4 rounded-2xl bg-navy-900/90 border border-navy-750 hover:border-brand-blue/50 flex flex-col justify-between transition-all group"
                            >
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-navy-950 border border-navy-700 text-[10px] font-mono text-cyan-400 font-bold">
                                    {course.platform}
                                  </span>
                                  <span className="text-[11px] font-mono text-brand-gold flex items-center gap-1">
                                    ★ {course.rating || '4.9'}
                                  </span>
                                </div>

                                <h4 className="font-heading font-bold text-sm text-slate-100 group-hover:text-brand-blue-light transition-colors leading-snug">
                                  {course.title}
                                </h4>

                                <p className="text-[11px] text-slate-400">
                                  by {course.provider} • <span className="font-mono">{course.duration}</span>
                                </p>
                              </div>

                              {/* Clickable Course Link opening in new tab with rel="noopener noreferrer" */}
                              <a
                                href={course.url || 'https://www.coursera.org'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-between w-full py-2 px-3 rounded-xl bg-navy-950 hover:bg-brand-blue text-slate-300 hover:text-white border border-navy-800 text-xs font-medium transition-all group/btn focus-visible:ring-2"
                              >
                                <span>Start Course</span>
                                <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Bottom Completion & Export Toolbar */}
          <div className="rounded-3xl bg-navy-900/90 border border-navy-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-0.5">
              <p className="font-heading font-bold text-white text-sm">
                Target Role Preparation in Progress
              </p>
              <p className="text-xs text-slate-400">
                You can revisit this roadmap anytime or run a fresh analysis with updated resume versions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/upload"
                className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 border border-navy-700 text-xs font-medium transition-colors"
              >
                Upload New Resume
              </Link>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default RoadmapPage;
