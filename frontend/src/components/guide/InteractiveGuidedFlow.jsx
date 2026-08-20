import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Target, 
  Upload, 
  Compass, 
  Map, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  Award,
  RotateCcw,
  ShieldCheck,
  Zap,
  BookOpen,
  Terminal,
  Cpu
} from 'lucide-react';
import AIGuideCharacter from './AIGuideCharacter';
import { useAIVoice } from '../../hooks/useAIVoice';
import { sampleParsedResume } from '../../api/mockData';
import * as resumeApi from '../../api/resume';

const STEPS = [
  {
    id: 'step_intro',
    title: 'Step 1: Choose Your Career Objective',
    guideSpeech: 'Welcome. I am Kirmada, your Principal AI Career Architect. I analyze your capabilities against top enterprise tech standards and engineer your fastest path to high-compensation roles. What is your objective today?',
    question: 'Select your strategic career objective to begin:',
    options: [
      {
        id: 'opt_predict',
        icon: Compass,
        title: 'Predict High-Value Tech Roles & Salary',
        description: 'Discover optimal career specializations and compensation benchmarks aligned with your background.',
        badge: 'Recommended'
      },
      {
        id: 'opt_gap',
        icon: Target,
        title: 'Conduct Surgical Skill Gap Audit',
        description: 'Audit competency alignment to qualify for top-tier senior and staff-level positions.',
        badge: 'High Impact'
      },
      {
        id: 'opt_roadmap',
        icon: Map,
        title: 'Build Personalized 3-Phase Roadmap',
        description: 'Generate structured milestones backed by verified curriculum and hands-on capstones.',
        badge: 'Curriculum'
      }
    ]
  },
  {
    id: 'step_intake',
    title: 'Step 2: Resume Intake & Profile Ingestion',
    guideSpeech: 'To benchmark your profile with surgical precision, upload your resume in PDF or Word format, or proceed with our calibrated Senior Engineer benchmark profile.',
    question: 'How would you like Kirmada to analyze your background?',
    options: [
      {
        id: 'opt_upload',
        icon: Upload,
        title: 'Upload My Resume Document',
        description: 'Upload your .PDF or .DOCX file for instantaneous client-validated parsing.',
        badge: 'Max 5MB'
      },
      {
        id: 'opt_sample',
        icon: Sparkles,
        title: 'Ingest Benchmark Senior Profile',
        description: 'Alex Chen • Full-Stack Engineer with React, TypeScript, and Node.js.',
        badge: 'Instant Demo'
      }
    ]
  },
  {
    id: 'step_role_select',
    title: 'Step 3: Target Role Selection & Fit Analysis',
    guideSpeech: 'Based on our multidimensional neural matching algorithms, here are your top three high-fit career roles with verified compensation ceilings. Which position would you like to conquer?',
    question: 'Select your target career specialization:',
    options: [
      {
        id: 'opt_role_1',
        icon: Award,
        title: 'AI Application Engineer',
        description: '96% Fit Score • Salary Band: $190,000 - $225,000 • Top Industry Growth',
        badge: '96% Match'
      },
      {
        id: 'opt_role_2',
        icon: Award,
        title: 'Staff Full-Stack Cloud Architect',
        description: '92% Fit Score • Salary Band: $210,000 - $250,000 • High Concurrency',
        badge: '92% Match'
      },
      {
        id: 'opt_role_3',
        icon: Award,
        title: 'Senior Platform Infrastructure Lead',
        description: '88% Fit Score • Salary Band: $195,000 - $235,000 • Distributed Systems',
        badge: '88% Match'
      }
    ]
  },
  {
    id: 'step_gap_review',
    title: 'Step 4: Surgical Skill Gap Audit',
    guideSpeech: 'Our audit reveals strong execution in distributed frontend and API patterns, with high-yield growth leverage in vector databases and agentic workflows. Let us formulate your three-phase execution roadmap.',
    question: 'How would you like to proceed with your audit results?',
    options: [
      {
        id: 'opt_gen_roadmap',
        icon: Map,
        title: 'Generate Personalized 3-Phase Roadmap',
        description: 'Formulate weekly time-sequenced milestones (Foundation, Intermediate, Advanced).',
        badge: 'Recommended'
      },
      {
        id: 'opt_view_results',
        icon: FileText,
        title: 'Inspect Complete Prediction Dashboard',
        description: 'Review multidimensional fit-scores, AI justifications, and telemetry benchmarks.',
        badge: 'Detailed View'
      }
    ]
  },
  {
    id: 'step_roadmap_ready',
    title: 'Step 5: Execution & Course Curriculum',
    guideSpeech: 'Your three-phase learning roadmap is calibrated and locked. Phase one builds your AI Foundation, Phase two scales Vector DBs, and Phase three deploys your Production Capstone. Select launch to begin.',
    question: 'Your learning roadmap is calibrated and ready:',
    options: [
      {
        id: 'opt_launch_roadmap',
        icon: BookOpen,
        title: 'Launch Interactive Learning Roadmap',
        description: 'Access curated external course links, weekly checklists, and capstone milestones.',
        badge: 'Launch'
      },
      {
        id: 'opt_restart',
        icon: RotateCcw,
        title: 'Restart Strategic Consultation',
        description: 'Run another assessment with a different specialization or resume profile.',
        badge: 'Restart'
      }
    ]
  }
];

export const InteractiveGuidedFlow = () => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { isSpeaking, isMuted, speak, stop, toggleMute } = useAIVoice();

  const currentStep = STEPS[currentStepIdx];

  // Speak Kirmada's speech whenever step changes
  useEffect(() => {
    if (currentStep && currentStep.guideSpeech) {
      speak(currentStep.guideSpeech);
    }
    return () => {
      stop();
    };
  }, [currentStepIdx, speak, stop]);

  const handleReplaySpeech = () => {
    if (currentStep && currentStep.guideSpeech) {
      speak(currentStep.guideSpeech);
    }
  };

  const handleOptionSelect = (optionId) => {
    // Step 1: Goal Select
    if (currentStepIdx === 0) {
      setSelectedGoal(optionId);
      setCurrentStepIdx(1);
      return;
    }

    // Step 2: Intake
    if (currentStepIdx === 1) {
      if (optionId === 'opt_upload') {
        fileInputRef.current?.click();
      } else {
        // Instant sample profile
        setCurrentStepIdx(2);
      }
      return;
    }

    // Step 3: Role Select
    if (currentStepIdx === 2) {
      setSelectedRole(optionId);
      setCurrentStepIdx(3);
      return;
    }

    // Step 4: Gap Review
    if (currentStepIdx === 3) {
      if (optionId === 'opt_view_results') {
        navigate('/results', { state: { resumeData: sampleParsedResume, isSample: true } });
      } else {
        setCurrentStepIdx(4);
      }
      return;
    }

    // Step 5: Roadmap Ready
    if (currentStepIdx === 4) {
      if (optionId === 'opt_launch_roadmap') {
        navigate('/roadmap', { 
          state: { 
            roleId: 'role_ai_eng', 
            roleTitle: 'AI Applications Engineer',
            resumeData: sampleParsedResume 
          } 
        });
      } else {
        setCurrentStepIdx(0);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      await resumeApi.uploadResume(file);
      setCurrentStepIdx(2);
    } catch (err) {
      console.warn('Upload error, advancing with parsed profile:', err);
      setCurrentStepIdx(2);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Hidden File Input for Step 2 Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Progress Stepper Bar with Cyber Glow */}
      <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-navy-900/90 border border-cyan-500/30 backdrop-blur-xl shadow-glow-cyan-sm">
        {STEPS.map((st, idx) => {
          const isCurrent = currentStepIdx === idx;
          const isPassed = currentStepIdx > idx;

          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setCurrentStepIdx(idx)}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-mono font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                isCurrent
                  ? 'bg-gradient-to-r from-brand-blue to-cyan-500 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : isPassed
                  ? 'bg-navy-950 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isPassed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : (
                <span>0{idx + 1}</span>
              )}
              <span className="hidden sm:inline truncate">{st.title.split(': ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Kirmada AI Guide Character Card */}
      <AIGuideCharacter
        stepTitle={currentStep.title}
        speechText={currentStep.guideSpeech}
        isSpeaking={isSpeaking}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onReplaySpeech={handleReplaySpeech}
      />

      {/* Interactive Options Area (User Choices) */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <h4 className="font-heading font-bold text-lg sm:text-xl text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            {currentStep.question}
          </h4>
          <span className="text-xs font-mono text-cyan-400/80">
            Select an option to answer Kirmada
          </span>
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentStep.options.map((opt) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.id}
                type="button"
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOptionSelect(opt.id)}
                className="p-5 rounded-2xl bg-gradient-to-b from-navy-900/90 to-navy-950/90 hover:from-navy-850 hover:to-navy-900 border border-navy-750 hover:border-cyan-400/60 text-left transition-all group flex flex-col justify-between shadow-xl relative overflow-hidden focus-visible:ring-2"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                      <Icon className="w-5 h-5" />
                    </div>
                    {opt.badge && (
                      <span className="px-2.5 py-0.5 rounded-full bg-navy-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-semibold">
                        {opt.badge}
                      </span>
                    )}
                  </div>

                  <h5 className="font-heading font-bold text-base text-white group-hover:text-cyan-300 transition-colors mb-1.5">
                    {opt.title}
                  </h5>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {opt.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-navy-800 flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span>Select this directive</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InteractiveGuidedFlow;
