import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Check,
  HelpCircle,
  Target,
  Zap,
  ShieldCheck,
  Layers,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  Volume2,
  VolumeX,
  UserCheck,
  Edit3,
  Sliders,
  Award,
  Clock,
  Briefcase,
  Mail
} from 'lucide-react';

import PageWrapper from '../components/layout/PageWrapper';
import CircularProgress from '../components/common/CircularProgress';
import { useResume } from '../context/ResumeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useVoiceAssistant } from '../context/VoiceContext';
import * as resumeApi from '../api/resume';
import {
  extractTextFromFile,
  extractSkillsFromText
} from '../utils/atsEvaluator';

export const SAMPLE_RESUMES = [
  {
    id: 'res_alex_chen',
    name: 'Alex Chen',
    title: 'Senior Full Stack & AI',
    years: '5+ yrs',
    skills: [
      'React.js', 'TypeScript', 'Node.js', 'Next.js',
      'Tailwind CSS', 'PostgreSQL', 'Docker', 'AWS',
      'REST APIs', 'System Design'
    ],
    text: `Alex Chen
Senior Software Engineer
Email: alex.chen@example.com | San Francisco, CA

SUMMARY:
Full-stack software engineer with 5+ years of experience engineering high-throughput web applications, microservices, and distributed cloud systems. Specialized in TypeScript, React.js, Node.js, PostgreSQL, and AWS.

SKILLS:
JavaScript, TypeScript, React.js, Next.js, Node.js, Express, REST APIs, GraphQL, PostgreSQL, MongoDB, Docker, AWS (S3, EC2), Tailwind CSS, System Design, Git CI/CD, Jest

EXPERIENCE:
Senior Full Stack Engineer | TechFlow Systems (2022 - Present)
- Architected real-time dashboard serving 120k+ daily active users using React, WebSockets, and Node.js.
- Reduced initial page load latency by 42% through code-splitting and Edge caching.
- Mentored 4 junior engineers and spearheaded TypeScript migration across 18 microservices.

Software Engineer | Nexus Digital Labs (2019 - 2022)
- Built scalable RESTful microservices in Node.js & PostgreSQL, handling 2,000+ RPS.
- Integrated Stripe payments and automated billing infrastructure with zero downtime.

EDUCATION:
B.S. in Computer Science, University of Washington (2015 - 2019)`
  },
  {
    id: 'res_priya_sharma',
    name: 'Priya Sharma',
    title: 'AI & Machine Learning Lead',
    years: '4 yrs',
    skills: [
      'Python', 'PyTorch', 'RAG', 'LangChain', 'LlamaIndex',
      'Vector Search', 'Pinecone', 'NLP', 'FastAPI',
      'Docker', 'Kubernetes'
    ],
    text: `Priya Sharma
AI & Machine Learning Engineer
Email: priya.sharma@example.com | New York, NY

SUMMARY:
AI Engineer with 4 years of experience building production LLM pipelines, RAG systems, and semantic vector search engines. Expert in Python, PyTorch, LangChain, Pinecone, and microservice deployments.

SKILLS:
Python, PyTorch, TensorFlow, Scikit-Learn, LangChain, LlamaIndex, Vector Search (Pinecone, pgvector), RAG Architectures, NLP, Prompt Engineering, FastAPI, Docker, Kubernetes, AWS, Git

EXPERIENCE:
Lead AI Engineer | CognitiveWorks AI (2022 - Present)
- Engineered enterprise RAG search application using LangChain, pgvector, and FastAPI reducing document search time by 65%.
- Fine-tuned open-source LLMs (Llama 3, Mistral) for domain-specific code analysis achieving 88% precision.
- Deployed scalable model inference endpoints on Kubernetes with auto-scaling.

Data Scientist | DataWave Analytics (2020 - 2022)
- Built predictive machine learning models in Python, Pandas, and Scikit-Learn for customer churn prediction.
- Developed automated NLP sentiment analysis pipelines on customer reviews.

EDUCATION:
M.S. in Computer Science (Artificial Intelligence), Columbia University (2018 - 2020)`
  },
  {
    id: 'res_marcus_vance',
    name: 'Marcus Vance',
    title: 'Staff Cloud & DevOps',
    years: '7 yrs',
    skills: [
      'AWS', 'Kubernetes', 'Terraform', 'Docker', 'Linux',
      'CI/CD', 'GitHub Actions', 'Prometheus', 'Grafana',
      'Ansible', 'Python'
    ],
    text: `Marcus Vance
Staff DevOps & Cloud Infrastructure Engineer
Email: marcus.vance@example.com | Austin, TX

SUMMARY:
Staff DevOps & Cloud Infrastructure Engineer with 7+ years architecting high-reliability, multi-cloud infrastructure, Kubernetes clusters, and automated CI/CD pipelines.

SKILLS:
AWS, Google Cloud, Docker, Kubernetes (K8s), Terraform, Ansible, Linux, Bash, CI/CD, GitHub Actions, Jenkins, Prometheus, Grafana, Microservices, Python, Network Topology, Zero-Trust

EXPERIENCE:
Staff Cloud Architect | CloudSphere Networks (2021 - Present)
- Architected multi-region Kubernetes clusters on AWS supporting 5M+ daily requests with 99.99% uptime.
- Automated complete infrastructure provisioning with Terraform and GitOps workflows, reducing deployment cycles by 80%.
- Implemented zero-trust network policies and centralized observability using Prometheus and Grafana.

Senior DevOps Engineer | ScaleGrid Tech (2017 - 2021)
- Spearheaded container migration of legacy monolith to Docker and AWS ECS.
- Designed automated disaster recovery pipelines cutting RTO from 4 hours to 12 minutes.

EDUCATION:
B.S. in Computer Engineering, University of Texas at Austin (2013 - 2017)`
  },
  {
    id: 'res_jordan_lee',
    name: 'Jordan Lee',
    title: 'Junior Web Developer',
    years: '1 yr',
    skills: [
      'HTML5', 'CSS3', 'JavaScript', 'React',
      'Tailwind CSS', 'Git', 'Responsive Design'
    ],
    text: `Jordan Lee
Junior Frontend Developer
Email: jordan.lee@example.com | Seattle, WA

SUMMARY:
Enthusiastic Junior Frontend Developer with 1 year of experience building responsive, user-friendly web interfaces using HTML5, CSS3, JavaScript, and React. Eager to grow full-stack and cloud skills.

SKILLS:
HTML5, CSS3, JavaScript, React, Tailwind CSS, Responsive Design, Git, GitHub, REST APIs, Figma

EXPERIENCE:
Junior Web Developer | PixelCraft Studio (2023 - Present)
- Developed responsive marketing pages and web portals using React and Tailwind CSS.
- Optimized images and asset delivery improving Google Lighthouse performance score from 68 to 92.
- Collaborated with UI/UX designers to translate Figma designs into pixel-perfect components.

EDUCATION:
B.A. in Digital Arts & Information Systems, Western Washington University (2019 - 2023)`
  }
];

export const SAMPLE_JDS = [
  {
    title: 'AI Application Engineer',
    company: 'Anthropic / OpenAI',
    text: `Job Title: AI Applications Engineer
Location: San Francisco, CA (Hybrid / Remote)
Experience: 3-5+ years in modern software engineering

Responsibilities:
- Build and scale LLM-powered applications using LangChain, LlamaIndex, and Vector Databases (Pinecone, Weaviate, pgvector).
- Design and optimize Retrieval-Augmented Generation (RAG) architectures with semantic search and re-ranking.
- Develop production-grade full-stack features with React.js, TypeScript, Node.js, and Python.
- Deploy and orchestrate microservices on Kubernetes and AWS / GCP with robust CI/CD pipelines.

Qualifications:
- Bachelor's or Master's degree in Computer Science or related STEM field.
- Strong proficiency in Python, TypeScript, and modern distributed systems.
- Experience with prompt engineering, fine-tuning, and model evaluation telemetry.
- Demonstrated ability to ship customer-facing AI products with high reliability.`
  },
  {
    title: 'Staff Cloud Architect',
    company: 'Stripe / Cloudflare',
    text: `Job Title: Staff Cloud Architect
Experience: 6+ years designing scalable cloud infrastructure

Responsibilities:
- Lead architecture of distributed cloud systems handling millions of requests per second.
- Champion cloud security, zero-trust infrastructure, and multi-region Kubernetes clusters.
- Collaborate with frontend and backend engineering teams to ensure optimal API latency and high availability.
- Mentor senior engineers on distributed consensus, event-driven architectures, and observability.

Requirements:
- Proven experience with AWS, Terraform, Docker, and Kubernetes at scale.
- Deep expertise in system design, relational and NoSQL databases, and network topology.
- Strong communication and cross-functional leadership skills.`
  },
  {
    title: 'Senior Frontend Lead',
    company: 'Vercel / Airbnb',
    text: `Job Title: Senior Frontend Engineer
Experience: 4-6+ years in frontend engineering

Responsibilities:
- Build blazing fast, accessible web applications using React.js, Next.js, and TypeScript.
- Architect design systems, reusable components, and high-performance user experiences.
- Optimize core web vitals, bundle size, and state management using Tailwind CSS and modern tooling.
- Collaborate with backend engineers to integrate GraphQL and RESTful APIs.

Requirements:
- Deep expertise in React.js, TypeScript, Next.js, and modern CSS frameworks.
- Strong experience with testing frameworks like Jest, Cypress, and Playwright.
- Excellent eye for design fidelity and micro-interactions.`
  }
];

export const ATSScorePage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const {
    parsedResume,
    setResume,
    setAtsResult,
    atsResult,
    setPredictions,
    setSelectedRole,
    setSkillGap,
    setRoadmap
  } = useResume();

  const {
    speak,
    replay,
    isSpeaking,
    isMuted,
    toggleMute
  } = useVoiceAssistant();

  const { user } = useAuth();
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [useExistingResume, setUseExistingResume] = useState(Boolean(parsedResume));
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [jdText, setJdText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisError, setAnalysisError] = useState('');

  const fileInputRef = useRef(null);

  const resumeToText = (resume) => {
    if (!resume) return '';

    const name = resume.candidateName || resume.name || '';
    const headline = resume.headline || resume.title || '';
    const summary = resume.summary || resume.professional_summary || '';
    const skills = Array.isArray(resume.skills) ? resume.skills : [];
    const experience = Array.isArray(resume.experience) ? resume.experience : [];
    const education = Array.isArray(resume.education) ? resume.education : [];

    return [
      name,
      headline,
      summary,
      skills.length ? `Skills: ${skills.join(', ')}` : '',
      experience.length ? `Experience: ${JSON.stringify(experience)}` : '',
      education.length ? `Education: ${JSON.stringify(education)}` : ''
    ].filter(Boolean).join('\n');
  };

  useEffect(() => {
    if (parsedResume && !selectedFile && !selectedPresetId) {
      setUseExistingResume(true);
      setResumeText(resumeToText(parsedResume));
    }
  }, [parsedResume]);

  useEffect(() => {
    speak(
      'Welcome to the enhanced ATS Compatibility Evaluator. Test resumes against real job descriptions to compute your compatibility score.'
    );
  }, []);

  const handleEmailReport = async () => {
    if (!atsResult) return;

    const targetEmail =
      user?.email ||
      window.prompt('Enter your email address to receive this report:');

    if (!targetEmail) return;

    setIsSendingEmail(true);

    try {
      await resumeApi.emailAtsReport({
        email: targetEmail,
        name: user?.name || parsedResume?.candidateName || 'Candidate',
        atsResult,
        jdTitle: jdText.split('\n')[0].slice(0, 50) || 'Target Job'
      });

      addToast(`ATS report sent to ${targetEmail}.`, 'success');
      speak('ATS evaluation report has been sent to your email.');
    } catch (error) {
      console.error('[ATS] Report email failed:', error);
      addToast(
        error?.response?.data?.detail ||
          error?.message ||
          'Could not send the ATS report.',
        'error'
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSelectExistingResume = () => {
    setUseExistingResume(true);
    setSelectedPresetId(null);
    setSelectedFile(null);

    if (parsedResume) {
      setResumeText(resumeToText(parsedResume));
    }

    speak('Active session resume loaded. Ready for job description comparison.');
  };

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setUseExistingResume(false);
    setSelectedFile(null);
    setResumeText(preset.text);
    setFileError('');

    addToast(`Selected sample profile: ${preset.name}`, 'info');
    speak(`Loaded profile for ${preset.name}. Select or paste a job description.`);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    const extension = `.${file.name.split('.').pop().toLowerCase()}`;

    if (!allowedExtensions.includes(extension)) {
      setFileError('Please upload a valid PDF, DOCX, or TXT file.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds the 5 MB limit.');
      setSelectedFile(null);
      return;
    }

    setFileError('');
    setAnalysisError('');
    setSelectedFile(file);
    setUseExistingResume(false);
    setSelectedPresetId(null);

    try {
      const extracted = await extractTextFromFile(file);
      setResumeText(extracted);
      addToast(`Extracted content from ${file.name}`, 'success');
      speak(`Resume file selected: ${file.name}. Ready for ATS analysis.`);
    } catch (error) {
      console.error('[ATS] Local text extraction failed:', error);
      setResumeText('');
      setFileError(
        'The file was selected, but text extraction failed. Try another file or use the resume text editor.'
      );
    }
  };

  const handleQuickFill = (jd) => {
    setJdText(jd.text);
    addToast(`Loaded target job description: ${jd.title}`, 'info');
    speak(`Loaded target job description for ${jd.title}.`);
  };

  const handleAnalyze = async () => {
    if (!jdText.trim()) {
      addToast('Please paste a job description before starting analysis.', 'warning');
      return;
    }

    if (
      !useExistingResume &&
      !selectedFile &&
      !selectedPresetId &&
      !resumeText.trim()
    ) {
      addToast('Please select or upload a resume before analysis.', 'warning');
      return;
    }

    if (useExistingResume && !parsedResume) {
      addToast('No active session resume is available. Please upload a resume.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysisStep(1);

    speak('Starting ATS analysis. Comparing your resume against the job description.');

    const stepInterval = setInterval(() => {
      setAnalysisStep((current) => (current < 3 ? current + 1 : current));
    }, 1200);

    try {
      const activePreset = SAMPLE_RESUMES.find(
        (item) => item.id === selectedPresetId
      );

      const response = await resumeApi.checkAtsScore({
        resumeData: useExistingResume ? parsedResume : (
          activePreset
            ? {
                name: activePreset.name,
                candidateName: activePreset.name,
                skills: activePreset.skills,
                yearsExperience: activePreset.years,
                summary: activePreset.text,
                rawText: activePreset.text
              }
            : undefined
        ),
        file: selectedFile || undefined,
        jdText,
        resumeText: resumeText || undefined
      });

      clearInterval(stepInterval);

      const payload = response?.result || response?.atsResult || response;
      const rawScore =
        payload?.overall_score ??
        payload?.overallScore ??
        payload?.score;

      const numericScore = Number(rawScore);

      if (
        rawScore === undefined ||
        rawScore === null ||
        rawScore === '' ||
        !Number.isFinite(numericScore)
      ) {
        throw new Error(
          'The ATS API returned no valid overall score. Check the backend response.'
        );
      }

      const clampPercent = (value) => {
        const number = Number(value);
        return Number.isFinite(number)
          ? Math.max(0, Math.min(100, number))
          : 0;
      };

      const normalizedResult = {
        ...payload,
        overall_score: clampPercent(numericScore),
        skills_match: clampPercent(
          payload.skills_match ?? payload.skillsMatch
        ),
        experience_match: clampPercent(
          payload.experience_match ?? payload.experienceMatch
        ),
        education_match: clampPercent(
          payload.education_match ?? payload.educationMatch
        ),
        matched_keywords: Array.isArray(
          payload.matched_keywords ?? payload.matchedKeywords
        )
          ? (payload.matched_keywords ?? payload.matchedKeywords)
          : [],
        missing_keywords: Array.isArray(
          payload.missing_keywords ?? payload.missingKeywords
        )
          ? (payload.missing_keywords ?? payload.missingKeywords)
          : [],
        improvement_suggestions: Array.isArray(
          payload.improvement_suggestions ?? payload.improvementSuggestions
        )
          ? (payload.improvement_suggestions ?? payload.improvementSuggestions)
          : []
      };

      setAtsResult(normalizedResult);
      addToast('ATS score calculated successfully.', 'success');

      const matchedCount = normalizedResult.matched_keywords.length;
      const missingCount = normalizedResult.missing_keywords.length;

      speak(
        `ATS analysis complete. The compatibility score is ${normalizedResult.overall_score} percent. Found ${matchedCount} matched keywords and ${missingCount} missing keywords.`
      );
    } catch (error) {
      clearInterval(stepInterval);

      console.error('[ATS] Analysis failed:', error);

      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'ATS analysis failed. Please try again.';

      setAnalysisError(message);
      addToast(message, 'error');
      speak('ATS analysis failed. Please review the error and try again.');
    } finally {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleReset = () => {
    setAtsResult(null);
    setSelectedFile(null);
    setSelectedPresetId(null);
    setFileError('');
    setAnalysisError('');
    setJdText('');
    setResumeText(resumeToText(parsedResume));
    setUseExistingResume(Boolean(parsedResume));

    speak('ATS evaluator reset. Select a resume and job description to start a new analysis.');
  };

  const handleBridgeGaps = async () => {
    try {
      let resumeForMatcher =
        useExistingResume && parsedResume ? parsedResume : null;

      const activePreset = SAMPLE_RESUMES.find(
        (item) => item.id === selectedPresetId
      );

      if (!resumeForMatcher && selectedFile) {
        const extension = selectedFile.name.split('.').pop()?.toLowerCase();

        if (extension === 'pdf' || extension === 'docx') {
          const uploadResponse = await resumeApi.uploadResume(selectedFile);

          resumeForMatcher =
            uploadResponse?.parsedData ||
            uploadResponse?.parsed_data ||
            uploadResponse?.resume?.parsed_data ||
            null;
        }

        if (!resumeForMatcher) {
          const displayName = selectedFile.name.replace(/\.[^.]+$/, '');

          resumeForMatcher = {
            name: displayName,
            candidateName: displayName,
            skills: extractSkillsFromText(resumeText || ''),
            summary: resumeText || '',
            rawText: resumeText || '',
            education: [],
            experience: [],
            projects: [],
            certifications: []
          };
        }
      }

      if (!resumeForMatcher && activePreset) {
        resumeForMatcher = {
          name: activePreset.name,
          candidateName: activePreset.name,
          headline: activePreset.title,
          skills: activePreset.skills,
          summary: activePreset.text,
          rawText: activePreset.text,
          experience: [],
          education: [],
          projects: [],
          certifications: []
        };
      }

      if (!resumeForMatcher && resumeText.trim()) {
        resumeForMatcher = {
          name: 'Candidate',
          candidateName: 'Candidate',
          skills: extractSkillsFromText(resumeText),
          summary: resumeText,
          rawText: resumeText,
          education: [],
          experience: [],
          projects: [],
          certifications: []
        };
      }

      if (!resumeForMatcher) {
        addToast('Select or upload a resume before continuing.', 'warning');
        return;
      }

      setResume(resumeForMatcher);
      setPredictions([]);
      setSelectedRole(null);
      setSkillGap(null);
      setRoadmap(null);

      speak('Opening the role matcher to predict career roles for your selected resume.');

      navigate('/results', {
        state: {
          resumeData: resumeForMatcher,
          atsResult,
          jobDescriptionText: jdText,
          source: 'ats-score',
          forceRefresh: true
        }
      });
    } catch (error) {
      console.error('[ATS] Could not prepare resume for role matching:', error);

      addToast(
        error?.response?.data?.detail ||
          error?.message ||
          'Could not prepare this resume for role prediction.',
        'error'
      );
    }
  };

  return (
    <PageWrapper className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-xs font-mono">
          <Target className="w-3.5 h-3.5" />
          <span>Real-Time Semantic ATS Compatibility Evaluator</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Check Your{' '}
          <span className="bg-gradient-to-r from-cyan-300 via-brand-blue-light to-white bg-clip-text text-transparent">
            ATS Match Score
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed">
          Compare any resume against a job description using semantic matching,
          experience alignment, and improvement suggestions.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Kirmada Voice Assistant</span>

            <div className="flex items-center gap-0.5 h-3 px-1">
              {[40, 80, 100, 60, 90].map((height, index) => (
                <motion.div
                  key={index}
                  className="w-0.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#00F0FF]"
                  animate={{
                    height: isSpeaking
                      ? [`${height * 0.3}%`, `${height}%`, `${height * 0.3}%`]
                      : '20%'
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: index * 0.05
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={replay}
              title="Replay Voice Guidance"
              className="p-1 rounded hover:bg-navy-800 text-slate-400 hover:text-cyan-300 transition-colors ml-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-1 rounded hover:bg-navy-800 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              {isMuted
                ? <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          </div>
        </div>
      </div>

      {!atsResult && (
        <div className="space-y-6">
          {analysisError && (
            <div
              role="alert"
              className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-sm"
            >
              <div className="font-semibold mb-1">ATS analysis failed</div>
              <p>{analysisError}</p>
            </div>
          )}

          <div className="p-4 sm:p-5 rounded-2xl bg-navy-900/60 border border-navy-750 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Test Different Sample Resumes (Instant Comparison):</span>
              </span>

              <button
                type="button"
                onClick={() => setShowTextEditor((value) => !value)}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>
                  {showTextEditor ? 'Hide Text Inspector' : 'View / Edit Resume Text'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {SAMPLE_RESUMES.map((resume) => {
                const selected = selectedPresetId === resume.id;

                return (
                  <button
                    key={resume.id}
                    type="button"
                    onClick={() => handleSelectPreset(resume)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      selected
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'bg-navy-950/80 border-navy-800 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-xs text-white truncate">
                        {resume.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-cyan-300">
                        {resume.years}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {resume.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {showTextEditor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-5 rounded-2xl bg-navy-950 border border-cyan-500/30 space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-cyan-300 flex items-center gap-1.5 font-bold">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Resume Text Evaluated by ATS:</span>
                </span>
                <span>{resumeText.length} characters</span>
              </div>

              <textarea
                rows={6}
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                placeholder="Paste or edit the full resume text here..."
                className="w-full p-3 rounded-xl bg-navy-900/90 border border-navy-750 focus:border-cyan-400 text-slate-200 text-xs font-mono outline-none resize-y"
              />

              <p className="text-[11px] text-slate-400 font-mono">
                Review the extracted text before running the analysis.
              </p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-navy-900/85 border border-navy-750 shadow-xl backdrop-blur-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <span>1. Active Resume Profile</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    PDF, DOCX, or Text
                  </span>
                </div>

                {parsedResume && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={handleSelectExistingResume}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start justify-between ${
                        useExistingResume
                          ? 'bg-cyan-500/10 border-cyan-400/80 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                          : 'bg-navy-950 border-navy-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-heading font-bold text-sm text-white">
                            Use Active Session Resume
                          </span>
                        </div>

                        <p className="text-xs text-slate-400">
                          {parsedResume.candidateName || parsedResume.name || 'Current Candidate'}
                          {' • '}
                          {parsedResume.yearsExperience || parsedResume.years_experience || 'Not specified'}
                          {' yrs exp • '}
                          {(parsedResume.skills || []).length} skills
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        useExistingResume
                          ? 'bg-cyan-500 border-cyan-400 text-navy-950'
                          : 'border-slate-600'
                      }`}>
                        {useExistingResume && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-6 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all ${
                    selectedFile
                      ? 'bg-emerald-500/10 border-emerald-500/60'
                      : 'bg-navy-950/80 border-navy-700 hover:border-cyan-400/60 hover:bg-navy-900/50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-navy-900 border border-navy-800 flex items-center justify-center text-cyan-400 shadow-md">
                      <Upload className="w-6 h-6" />
                    </div>

                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-semibold text-emerald-300">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Content Extracted & Ready
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Click to upload a custom resume file
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Supports PDF, DOCX, and TXT up to 5 MB
                        </p>
                      </div>
                    )}
                  </div>
                </button>

                {fileError && (
                  <p className="mt-2 text-xs font-mono text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{fileError}</span>
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-navy-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Selected Profile:</span>
                <span className="text-emerald-400 font-semibold truncate max-w-[200px]">
                  {selectedFile
                    ? selectedFile.name
                    : selectedPresetId
                      ? SAMPLE_RESUMES.find((item) => item.id === selectedPresetId)?.name
                      : useExistingResume
                        ? (parsedResume?.candidateName || parsedResume?.name || 'Active Session')
                        : 'Custom Text Loaded'}
                </span>
              </div>
            </div>

            <div className="space-y-6 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-navy-900/85 border border-navy-750 shadow-xl backdrop-blur-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    <span>2. Target Job Description (JD)</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {jdText.length} characters
                  </span>
                </div>

                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-400">Compare with JD:</span>
                  {SAMPLE_JDS.map((job, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleQuickFill(job)}
                      className="px-2.5 py-1 rounded-lg bg-navy-950 hover:bg-navy-800 border border-navy-800 text-[11px] font-mono text-cyan-300 transition-colors"
                    >
                      + {job.title}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={8}
                  value={jdText}
                  onChange={(event) => setJdText(event.target.value)}
                  placeholder="Paste the target job description requirements, responsibilities, and qualifications here..."
                  className="w-full p-4 rounded-2xl bg-navy-950 border border-navy-750 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-500 text-xs sm:text-sm font-sans leading-relaxed transition-all outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-navy-800">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={
                    isAnalyzing ||
                    (!selectedFile && !useExistingResume && !selectedPresetId && !resumeText.trim()) ||
                    !jdText.trim()
                  }
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 hover:from-brand-blue-hover hover:to-cyan-400 text-white font-heading font-bold text-sm tracking-wide shadow-glow-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Analyzing ATS Compatibility...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Run Semantic ATS Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="p-12 rounded-3xl bg-navy-900/90 border border-cyan-500/40 text-center space-y-4 shadow-glow-cyan max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center mx-auto text-cyan-400 animate-spin">
            <RotateCcw className="w-8 h-8" />
          </div>

          <h3 className="font-heading font-bold text-xl text-white">
            Evaluating Resume Against Job Requirements
          </h3>

          <div className="space-y-2 text-xs font-mono text-slate-300 max-w-sm mx-auto">
            <div className={`p-2 rounded-lg border transition-all ${
              analysisStep >= 1 ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'border-transparent text-slate-500'
            }`}>
              • Extracting JD criteria and skills via NLP...
            </div>
            <div className={`p-2 rounded-lg border transition-all ${
              analysisStep >= 2 ? 'bg-brand-blue/15 border-brand-blue/40 text-brand-blue-light' : 'border-transparent text-slate-500'
            }`}>
              • Calculating semantic embedding match and experience ratio...
            </div>
            <div className={`p-2 rounded-lg border transition-all ${
              analysisStep >= 3 ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'border-transparent text-slate-500'
            }`}>
              • Synthesizing ATS score and personalized recommendations...
            </div>
          </div>
        </div>
      )}

      {atsResult && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 border border-cyan-500/40 shadow-glow-cyan relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="flex-shrink-0">
                  <CircularProgress
                    percentage={atsResult.overall_score ?? 0}
                    size={140}
                    strokeWidth={11}
                    label="ATS Match"
                    showLabel={true}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-navy-950 text-cyan-300 border border-cyan-500/30 text-xs font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Real-Time Semantic Evaluation</span>
                  </div>

                  <h2 className="font-heading text-2xl font-bold text-white">
                    {atsResult.overall_score >= 80
                      ? 'High ATS Compatibility'
                      : atsResult.overall_score >= 60
                        ? 'Moderate Compatibility — Optimization Advised'
                        : 'Low Compatibility — Significant Gaps Detected'}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-sans leading-relaxed">
                    {atsResult.overall_score >= 80
                      ? 'Your resume profile demonstrates strong alignment with core job competencies and experience criteria.'
                      : atsResult.overall_score >= 60
                        ? 'Your profile matches fundamental requirements, but lacks several high-impact keywords and specific experience depth.'
                        : 'Your resume shows critical divergence from the target requirements. Target the missing competencies below to raise your match.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-200 border border-navy-750 text-xs font-mono flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Test Another Resume or JD</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-navy-800">
              <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Skills Alignment</span>
                  <span className="font-bold text-cyan-300">{atsResult.skills_match ?? 0}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-navy-900 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${atsResult.skills_match ?? 0}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-cyan-400 rounded-full"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Experience Relevance</span>
                  <span className="font-bold text-brand-blue-light">{atsResult.experience_match ?? 0}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-navy-900 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${atsResult.experience_match ?? 0}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="h-full bg-brand-blue rounded-full"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Education Alignment</span>
                  <span className="font-bold text-emerald-400">{atsResult.education_match ?? 0}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-navy-900 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${atsResult.education_match ?? 0}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-emerald-400 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-navy-900/80 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Matched Keywords ({atsResult.matched_keywords?.length || 0})</span>
                </h3>

                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Verified in Resume
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {atsResult.matched_keywords?.map((keyword, index) => (
                  <span
                    key={`${keyword}-${index}`}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{keyword}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-navy-900/80 border border-rose-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>Missing Keywords ({atsResult.missing_keywords?.length || 0})</span>
                </h3>

                <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  High-Impact Gaps
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {atsResult.missing_keywords?.map((keyword, index) => (
                  <span
                    key={`${keyword}-${index}`}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-1.5 shadow-sm"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{keyword}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-navy-900/80 border border-cyan-500/30 space-y-4">
            <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Tailored Improvement Recommendations</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {(atsResult.improvement_suggestions || []).map((suggestion, index) => (
                <div
                  key={`${index}-${suggestion}`}
                  className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 text-xs font-mono font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans">
                    {suggestion}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-400 font-mono">
                Next, review your predicted roles, choose a target career, and inspect its skill gaps.
              </p>

              <button
                type="button"
                onClick={handleBridgeGaps}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 hover:from-brand-blue-hover hover:to-cyan-400 text-white font-semibold text-xs font-mono flex items-center justify-center gap-2 shadow-glow-cyan transition-all"
              >
                <span>Continue to Role Matcher</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </PageWrapper>
  );
};

export default ATSScorePage;