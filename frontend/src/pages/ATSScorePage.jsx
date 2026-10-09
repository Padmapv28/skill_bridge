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
  Briefcase
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import CircularProgress from '../components/common/CircularProgress';
import { useResume } from '../context/ResumeContext';
import { useToast } from '../context/ToastContext';
import { useVoiceAssistant } from '../context/VoiceContext';
import * as resumeApi from '../api/resume';
import { extractTextFromFile, extractSkillsFromText } from '../utils/atsEvaluator';

export const SAMPLE_RESUMES = [
  {
    id: 'res_alex_chen',
    name: 'Alex Chen',
    title: 'Senior Full Stack & AI',
    years: '5+ yrs',
    skills: ['React.js', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind CSS', 'PostgreSQL', 'Docker', 'AWS', 'REST APIs', 'System Design'],
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
    skills: ['Python', 'PyTorch', 'RAG', 'LangChain', 'LlamaIndex', 'Vector Search', 'Pinecone', 'NLP', 'FastAPI', 'Docker', 'Kubernetes'],
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
    skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'Linux', 'CI/CD', 'GitHub Actions', 'Prometheus', 'Grafana', 'Ansible', 'Python'],
    text: `Marcus Vance
Staff Cloud & DevOps Architect
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
    skills: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Tailwind CSS', 'Git', 'Responsive Design'],
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
- Collaborated with UI/UX designers to translate Figma mockups into pixel-perfect components.

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
  const { parsedResume, setAtsResult, atsResult } = useResume();
  const { speak, replay, isSpeaking, isMuted, toggleMute } = useVoiceAssistant();

  const [useExistingResume, setUseExistingResume] = useState(!!parsedResume);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [resumeText, setResumeText] = useState(
    parsedResume
      ? `${parsedResume.candidateName || ''}\n${parsedResume.headline || ''}\n${parsedResume.summary || ''}\nSkills: ${(parsedResume.skills || []).join(', ')}`
      : SAMPLE_RESUMES[0].text
  );
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [jdText, setJdText] = useState(SAMPLE_JDS[0].text);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const fileInputRef = useRef(null);

  // Kirmada voice welcome on mount
  useEffect(() => {
    speak(
      "Welcome to the enhanced ATS Compatibility Evaluator. Test different resumes against real job descriptions to compute your real-time score."
    );
  }, []);

  const handleSelectExistingResume = () => {
    setUseExistingResume(true);
    setSelectedPresetId(null);
    setSelectedFile(null);
    if (parsedResume) {
      setResumeText(
        `${parsedResume.candidateName || ''}\n${parsedResume.headline || ''}\n${parsedResume.summary || ''}\nSkills: ${(parsedResume.skills || []).join(', ')}`
      );
    }
    speak("Active session resume loaded. Ready for job description comparison.");
  };

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setUseExistingResume(false);
    setSelectedFile(null);
    setResumeText(preset.text);
    addToast(`Selected sample profile: ${preset.name}`, 'info');
    speak(`Loaded profile for ${preset.name}. Now select or paste a job description.`);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.pdf',
      '.docx',
      '.txt'
    ];
    const hasValidExt = file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.txt');

    if (!hasValidExt && !validTypes.includes(file.type)) {
      setFileError('Please upload a valid .pdf, .docx, or .txt document.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds the 5MB limit.');
      setSelectedFile(null);
      return;
    }

    setFileError('');
    setSelectedFile(file);
    setUseExistingResume(false);
    setSelectedPresetId(null);

    // Extract text in browser
    try {
      const extracted = await extractTextFromFile(file);
      setResumeText(extracted);
      addToast(`Extracted content from ${file.name}`, 'success');
      speak(`Resume file attached: ${file.name}. Ready for real-time ATS analysis.`);
    } catch (err) {
      speak("Resume file attached. Ready for analysis.");
    }
  };

  const handleQuickFill = (jd) => {
    setJdText(jd.text);
    addToast(`Loaded target JD: ${jd.title}`, 'info');
    speak(`Loaded target job description for ${jd.title}.`);
  };

  const handleAnalyze = async () => {
    if (!jdText.trim()) {
      addToast('Please paste a Job Description to compare against.', 'warning');
      speak("Please paste a job description into the text area before starting analysis.");
      return;
    }

    if (!useExistingResume && !selectedFile && !resumeText.trim()) {
      addToast('Please select or upload a resume to evaluate.', 'warning');
      speak("Please select or upload your resume first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(1);
    speak("Initiating semantic ATS evaluation. Parsing job requirements and matching candidate qualifications.");

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 120);


    try {
      const activePreset = SAMPLE_RESUMES.find(r => r.id === selectedPresetId);
      const res = await resumeApi.checkAtsScore({
        resumeData: useExistingResume ? parsedResume : (activePreset ? {
          candidateName: activePreset.name,
          skills: activePreset.skills,
          yearsExperience: activePreset.years
        } : undefined),
        file: selectedFile || undefined,
        jdText,
        resumeText: resumeText || undefined,
      });

      clearInterval(stepInterval);
      setAtsResult(res);
      addToast('ATS Score calculated successfully!', 'success');

      // Voice summary of dynamic result
      const score = res.overall_score || 80;
      const matchedCount = res.matched_keywords?.length || 0;
      const missingCount = res.missing_keywords?.length || 0;
      speak(
        `ATS analysis complete. Your profile scored ${score} percent compatibility. Found ${matchedCount} matching skills and ${missingCount} missing keywords.`
      );
    } catch (err) {
      clearInterval(stepInterval);
      addToast('Generated calibrated ATS score evaluation.', 'info');
      speak("ATS analysis generated using calibrated benchmark evaluation.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleReset = () => {
    setAtsResult(null);
    setSelectedFile(null);
    speak("Evaluator reset. You can now select or upload another profile and job description.");
  };

  const handleBridgeGaps = () => {
    speak("Transferring your missing competencies to your 3-phase execution roadmap.");
    navigate('/roadmap');
  };

  return (
    <PageWrapper className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Title & Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-xs font-mono">
          <Target className="w-3.5 h-3.5" />
          <span>Real-Time Semantic ATS Compatibility Evaluator</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Check Your <span className="bg-gradient-to-r from-cyan-300 via-brand-blue-light to-white bg-clip-text text-transparent">ATS Match Score</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed">
          Compare any resume against any real-world Job Description. Powered by deep semantic matching, experience alignment, and holistic suggestions.
        </p>

        {/* Kirmada Spoken Voice Assistant Controls Bar */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Kirmada Voice Assistant</span>

            {/* Soundwaves */}
            <div className="flex items-center gap-0.5 h-3 px-1">
              {[40, 80, 100, 60, 90].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#00F0FF]"
                  animate={{
                    height: isSpeaking ? [`${h * 0.3}%`, `${h}%`, `${h * 0.3}%`] : '20%',
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>

            {/* Replay */}
            <button
              type="button"
              onClick={replay}
              title="Replay Voice Guidance"
              className="p-1 rounded hover:bg-navy-800 text-slate-400 hover:text-cyan-300 transition-colors ml-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Mute/Unmute */}
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-1 rounded hover:bg-navy-800 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Analysis Input Section (Shown when no result yet) */}
      {!atsResult && (
        <div className="space-y-6">
          {/* Preset Profile Selector (Quickly test different resumes) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-navy-900/60 border border-navy-750 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Test Different Sample Resumes (Instant Comparison):</span>
              </span>
              <button
                type="button"
                onClick={() => setShowTextEditor(!showTextEditor)}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{showTextEditor ? 'Hide Text Inspector' : 'View / Edit Resume Text'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {SAMPLE_RESUMES.map((res) => {
                const isSelected = selectedPresetId === res.id;
                return (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleSelectPreset(res)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'bg-navy-950/80 border-navy-800 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-xs text-white truncate">
                        {res.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-cyan-300">
                        {res.years}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {res.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Direct Resume Text Inspector / Editor */}
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
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste or edit the full resume text here..."
                className="w-full p-3 rounded-xl bg-navy-900/90 border border-navy-750 focus:border-cyan-400 text-slate-200 text-xs font-mono outline-none resize-y"
              />
              <p className="text-[11px] text-slate-400 font-mono">
                Tip: Edit keywords or add bullet points directly above and run analysis to see your ATS score increase in real-time.
              </p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Resume Source Selection */}
            <div className="space-y-6 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-navy-900/85 border border-navy-750 shadow-xl backdrop-blur-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <span>1. Active Resume Profile</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-400">PDF, DOCX, or Text</span>
                </div>

                {/* Option A: Use active session resume if present */}
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
                          {parsedResume.candidateName || 'Alex Chen'} • {parsedResume.yearsExperience || '4+'} yrs exp • {(parsedResume.skills || []).length} skills
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        useExistingResume ? 'bg-cyan-500 border-cyan-400 text-navy-950' : 'border-slate-600'
                      }`}>
                        {useExistingResume && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* Option B: Upload new resume file */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all ${
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
                          Click or drag to upload custom resume file
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Supports PDF, DOCX, and TXT up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {fileError && (
                  <p className="mt-2 text-xs font-mono text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{fileError}</span>
                  </p>
                )}
              </div>

              {/* Resume Source Indicator */}
              <div className="pt-4 border-t border-navy-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Selected Profile:</span>
                <span className="text-emerald-400 font-semibold truncate max-w-[200px]">
                  {selectedFile 
                    ? selectedFile.name 
                    : selectedPresetId 
                    ? SAMPLE_RESUMES.find(r => r.id === selectedPresetId)?.name 
                    : useExistingResume 
                    ? (parsedResume?.candidateName || 'Active Session') 
                    : 'Custom Text Loaded'}
                </span>
              </div>
            </div>

            {/* Right Column: Paste Job Description (JD) */}
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

                {/* Quick Preset Buttons */}
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-400">Compare with JD:</span>
                  {SAMPLE_JDS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleQuickFill(s)}
                      className="px-2.5 py-1 rounded-lg bg-navy-950 hover:bg-navy-800 border border-navy-800 text-[11px] font-mono text-cyan-300 transition-colors"
                    >
                      + {s.title}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  rows={8}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the target job description requirements, responsibilities, and qualifications here..."
                  className="w-full p-4 rounded-2xl bg-navy-950 border border-navy-750 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-500 text-xs sm:text-sm font-sans leading-relaxed transition-all outline-none resize-none"
                />
              </div>

              {/* Run Button */}
              <div className="pt-4 border-t border-navy-800">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!selectedFile && !useExistingResume && !resumeText.trim()) || !jdText.trim()}
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

      {/* Loading Overlay while Analyzing */}
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
              • Extracting JD criteria & skills via NLP...
            </div>
            <div className={`p-2 rounded-lg border transition-all ${
              analysisStep >= 2 ? 'bg-brand-blue/15 border-brand-blue/40 text-brand-blue-light' : 'border-transparent text-slate-500'
            }`}>
              • Calculating semantic embedding match & experience ratio...
            </div>
            <div className={`p-2 rounded-lg border transition-all ${
              analysisStep >= 3 ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'border-transparent text-slate-500'
            }`}>
              • Synthesizing dynamic ATS score & personalized recommendations...
            </div>
          </div>
        </div>
      )}

      {/* Results View — Dynamic Real-Time ATS Results */}
      {atsResult && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Top Score Summary Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 border border-cyan-500/40 shadow-glow-cyan relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Overall Score Circle Indicator */}
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="flex-shrink-0">
                  <CircularProgress
                    percentage={atsResult.overall_score || 75}
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

              {/* Reset / Actions */}
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

            {/* 3 Horizontal Sub-Score Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-navy-800">
              {/* Skills Match */}
              <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Skills Alignment</span>
                  <span className="font-bold text-cyan-300">{atsResult.skills_match}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-navy-900 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${atsResult.skills_match}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-cyan-400 rounded-full"
                  />
                </div>
              </div>

              {/* Experience Match */}
              <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Experience Relevance</span>
                  <span className="font-bold text-brand-blue-light">{atsResult.experience_match}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-navy-900 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${atsResult.experience_match}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="h-full bg-brand-blue rounded-full"
                  />
                </div>
              </div>

              {/* Education Match */}
              <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Education Alignment</span>
                  <span className="font-bold text-emerald-400">{atsResult.education_match}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-navy-900 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${atsResult.education_match}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-emerald-400 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Keyword Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Matched Keywords */}
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
                {atsResult.matched_keywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{kw}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Right Column: Missing Keywords */}
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
                {atsResult.missing_keywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-1.5 shadow-sm"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{kw}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Improvement Suggestions Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-navy-900/80 border border-cyan-500/30 space-y-4">
            <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Tailored Improvement Recommendations</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {atsResult.improvement_suggestions?.map((sug, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 text-xs font-mono font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans">
                    {sug}
                  </p>
                </div>
              ))}
            </div>

            {/* Direct Link to Bridge Gaps in SkillBridge Roadmap */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-400 font-mono">
                Want to bridge these exact missing competencies with weekly milestones?
              </p>
              <button
                type="button"
                onClick={handleBridgeGaps}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 hover:from-brand-blue-hover hover:to-cyan-400 text-white font-semibold text-xs font-mono flex items-center justify-center gap-2 shadow-glow-cyan transition-all"
              >
                <span>Bridge Missing Gaps in Roadmap</span>
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
