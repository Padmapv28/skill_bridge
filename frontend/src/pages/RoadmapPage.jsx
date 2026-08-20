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
import { mockRoadmapData, mockPredictedRoles, sampleParsedResume } from '../api/mockData';
import { useToast } from '../context/ToastContext';

export const RoadmapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toastSuccess, toastInfo } = useToast();

  const [role, setRole] = useState(location.state?.role || null);
  const [missingSkills, setMissingSkills] = useState(location.state?.missingSkills || []);
  const [partialSkills, setPartialSkills] = useState(location.state?.partialSkills || []);
  const [roadmap, setRoadmap] = useState(null);
  const [completedSkills, setCompletedSkills] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!role) return;

    const fetchRoadmap = async () => {
      setIsLoading(true);
      try {
        const response = await resumeApi.generateRoadmap({
          role,
          missingSkills,
          partialSkills
        });
        setRoadmap(response.roadmap || mockRoadmapData[role.id] || mockRoadmapData.default);
      } catch (err) {
        console.warn('API error, using mock roadmap:', err);
        setRoadmap(mockRoadmapData[role.id] || mockRoadmapData.default);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoadmap();
  }, [role, missingSkills, partialSkills]);

  // Robust fallback for direct access or refresh without state
  if (!role) {
    return (
      <PageWrapper className="py-12 px-4 sm:px-6 lg:px-8">
        <StateFallback
          pageTitle="Roadmap Parameters Missing"
          message="To build a personalized learning roadmap, please first select a target role and review your skill gaps, or load our complete AI Application Engineer curriculum."
          primaryActionPath="/results"
          primaryActionLabel="Go to Role Predictions"
          secondaryActionPath="/upload"
          secondaryActionLabel="Upload Resume"
          sampleType="roadmap"
          onLoadSample={() => {
            setRole(mockPredictedRoles[0]);
            setMissingSkills([
              { name: 'LangChain & LlamaIndex' },
              { name: 'Vector Databases' },
              { name: 'RAG Architectures' }
            ]);
            setPartialSkills([
              { name: 'Python for AI Scripting' },
              { name: 'Docker Containerization' }
            ]);
          }}
        />
      </PageWrapper>
    );
  }

  const toggleSkillCompletion = (skillId) => {
    setCompletedSkills((prev) => {
      const next = { ...prev, [skillId]: !prev[skillId] };
      
      // Check if user just checked a new skill
      if (!prev[skillId]) {
        toastSuccess('Milestone checked! Keep pushing forward.');
        
        // Trigger celebratory confetti burst if user made great progress
        const completedCount = Object.values(next).filter(Boolean).length;
        if (completedCount % 3 === 0) {
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          } catch(e) {}
        }
      }
      return next;
    });
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

  // Calculate total progress
  const allSkills = roadmap?.phases?.flatMap((p) => p.skills) || [];
  const totalSkillsCount = allSkills.length;
  const completedCount = Object.values(completedSkills).filter(Boolean).length;
  const progressPercent = totalSkillsCount > 0 ? Math.round((completedCount / totalSkillsCount) * 100) : 0;

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
            Learning Roadmap: <span className="text-brand-blue-light">{role.title}</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Sequenced progression designed to bridge critical skill gaps with verified courses
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            to="/skill-gap"
            state={{ role, userSkills: location.state?.userSkills || [] }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-850 text-slate-300 hover:text-white border border-navy-750 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Review Skill Gap</span>
          </Link>
        </div>
      </div>

      {isLoading || !roadmap ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-brand-blue/30 shadow-glow-blue/20">
          <OrbitingSpinner
            size="lg"
            label="Synthesizing Tailored Learning Path..."
            subtext={`Generating 3-phase curriculum for ${role.title}`}
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
                Pacing: <strong className="text-white">{roadmap.targetTimeline || '12-16 Weeks'}</strong>
              </span>
            </div>
          </div>

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
                          {phase.name}
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

                      <div className="space-y-2 bg-navy-950/70 p-4 rounded-2xl border border-navy-850">
                        {phase.skills?.map((skill) => {
                          const isDone = Boolean(completedSkills[skill.id]);
                          return (
                            <button
                              key={skill.id}
                              type="button"
                              onClick={() => toggleSkillCompletion(skill.id)}
                              className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all text-xs sm:text-sm font-sans ${
                                isDone 
                                  ? 'bg-status-success/10 text-emerald-300 border border-status-success/30' 
                                  : 'hover:bg-navy-900 text-slate-300 border border-transparent'
                              }`}
                            >
                              <div className="mt-0.5 flex-shrink-0">
                                {isDone ? (
                                  <CheckSquare className="w-4 h-4 text-status-success" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                                )}
                              </div>
                              <span className={`leading-snug ${isDone ? 'line-through opacity-85' : ''}`}>
                                {skill.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
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
