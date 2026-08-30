import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Trash2,
  Briefcase,
  GraduationCap,
  Layers,
  FileCheck,
} from 'lucide-react';

import PageWrapper from '../components/layout/PageWrapper';
import LiveResumeScannerOverlay from '../components/scenarios/LiveResumeScannerOverlay';
import * as resumeApi from '../api/resume';
import { useToast } from '../context/ToastContext';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export const UploadResumePage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [parsedData, setParsedData] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const { toastSuccess, toastError } = useToast();

  // ---------------------------------------------------------
  // FILE VALIDATION
  // ---------------------------------------------------------

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return 'No file selected.';
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `File size is ${(selectedFile.size / (1024 * 1024)).toFixed(
        2
      )}MB. Maximum allowed size is 5MB.`;
    }

    const fileName = selectedFile.name.toLowerCase();

    const hasValidExtension = ALLOWED_EXTENSIONS.some((extension) =>
      fileName.endsWith(extension)
    );

    const hasValidMimeType = ALLOWED_MIME_TYPES.includes(
      selectedFile.type
    );

    if (!hasValidExtension && !hasValidMimeType) {
      return 'Invalid file format. Please upload a .pdf or .docx resume.';
    }

    return null;
  };

  // ---------------------------------------------------------
  // UPLOAD + PARSE
  // ---------------------------------------------------------

  const processUpload = async (selectedFile) => {
    setUploadError('');

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setUploadError(validationError);
      toastError(validationError);
      return;
    }

    setFile(selectedFile);
    setParsedData(null);
    setIsUploading(true);

    try {
      console.log(
        '[Resume Upload] Uploading REAL resume:',
        selectedFile.name
      );

      const response = await resumeApi.uploadResume(selectedFile);

      console.log(
        '[Resume Upload] Backend response:',
        response
      );

      if (!response || response.success !== true) {
        throw new Error(
          response?.message ||
            response?.detail ||
            'Resume upload failed.'
        );
      }

      if (!response.parsedData) {
        throw new Error(
          'Backend did not return parsed resume data.'
        );
      }

      // IMPORTANT:
      // Only use the data returned by the backend.
      // NEVER use Alex Chen / sampleParsedResume here.
      setParsedData(response.parsedData);

      toastSuccess('Your resume was parsed successfully.');
    } catch (error) {
      console.error(
        '[Resume Upload] REAL upload error:',
        error
      );

      const backendMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Unable to process this resume.';

      setParsedData(null);
      setUploadError(backendMessage);

      toastError(backendMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // ---------------------------------------------------------
  // FILE INPUT
  // ---------------------------------------------------------

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      processUpload(selectedFile);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ---------------------------------------------------------
  // DRAG & DROP
  // ---------------------------------------------------------

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      processUpload(droppedFile);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ---------------------------------------------------------
  // RESET
  // ---------------------------------------------------------

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setUploadError('');
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ---------------------------------------------------------
  // PROCEED TO ROLE PREDICTION
  // ---------------------------------------------------------

  const handleProceedToPrediction = () => {
    if (!parsedData) {
      return;
    }

    navigate('/results', {
      state: {
        resumeData: parsedData,
        sourceFileName: file?.name || 'Resume',
      },
    });
  };

  // ---------------------------------------------------------
  // SAFE ARRAY HELPERS
  // ---------------------------------------------------------

  const skills = Array.isArray(parsedData?.skills)
    ? parsedData.skills
    : [];

  const experience = Array.isArray(parsedData?.experience)
    ? parsedData.experience
    : [];

  const education = Array.isArray(parsedData?.education)
    ? parsedData.education
    : [];

  const categorizedSkills =
    parsedData?.categorizedSkills &&
    typeof parsedData.categorizedSkills === 'object'
      ? parsedData.categorizedSkills
      : null;

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <PageWrapper className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/30 text-brand-blue-light text-xs font-mono">
          <FileCheck className="w-3.5 h-3.5" />

          <span>Step 1 of 4 • Resume Parsing</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Upload Your Resume
        </h1>

        <p className="text-slate-400 text-sm sm:text-base">
          Our AI parser extracts verified skills, experience
          timelines, and architectural proficiencies.
        </p>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="space-y-8">

        {/* ===================================================
            UPLOAD AREA
        ==================================================== */}

        {!parsedData && !isUploading && (
          <div className="space-y-4">

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-brand-blue bg-brand-blue/10 shadow-glow-blue scale-[1.01]'
                  : 'border-navy-700 hover:border-brand-blue/50 bg-navy-900/60 hover:bg-navy-900/90'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' ||
                  event.key === ' '
                ) {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Upload Resume File Zone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
                id="resume-file-input"
              />

              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-navy-800 border border-navy-700 flex items-center justify-center text-brand-blue-light shadow-md">
                  <Upload
                    className="w-8 h-8 animate-bounce"
                    style={{ animationDuration: '2.5s' }}
                  />
                </div>

                <div className="space-y-1">
                  <p className="font-heading font-bold text-lg text-slate-100">
                    Drag and drop your resume here, or{' '}
                    <span className="text-brand-blue-light underline underline-offset-4">
                      browse
                    </span>
                  </p>

                  <p className="text-xs text-slate-400 font-sans">
                    Supports{' '}
                    <span className="font-mono text-slate-300">
                      .PDF
                    </span>{' '}
                    and{' '}
                    <span className="font-mono text-slate-300">
                      .DOCX
                    </span>{' '}
                    up to 5MB
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-2">
                  <span>● Client-Validated</span>
                  <span>● Confidential</span>
                  <span>● Zero Reselling</span>
                </div>
              </div>
            </div>

            {/* ERROR */}

            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />

                <span>{uploadError}</span>
              </motion.div>
            )}
          </div>
        )}

        {/* ===================================================
            SCANNER
        ==================================================== */}

        {isUploading && (
          <div className="space-y-4">
            <LiveResumeScannerOverlay onComplete={() => {}} />

            {file && (
              <div className="text-center text-xs text-slate-400">
                Processing:{' '}
                <span className="text-brand-blue-light font-medium">
                  {file.name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            PARSED RESUME
        ==================================================== */}

        {parsedData && !isUploading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-6 sm:p-8 border border-navy-700/80 shadow-card-dark space-y-6"
          >
            {/* TOP BAR */}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-navy-800">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-glow-blue flex-shrink-0">
                  {parsedData?.candidateName
                    ? String(
                        parsedData.candidateName
                      ).charAt(0).toUpperCase()
                    : 'R'}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-xl font-bold text-white">
                      {parsedData?.candidateName ||
                        'Candidate Profile'}
                    </h2>

                    <span className="px-2 py-0.5 rounded-full bg-status-success/20 border border-status-success/40 text-status-success text-[10px] font-mono">
                      Parsed & Verified
                    </span>
                  </div>

                  <p className="text-xs text-brand-blue-light font-medium mt-0.5">
                    {parsedData?.headline ||
                      'Software Engineer'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-400 hover:text-rose-400 border border-navy-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Upload a different resume"
              >
                <Trash2 className="w-3.5 h-3.5" />

                Upload Different File
              </button>
            </div>

            {/* SUMMARY */}

            {parsedData?.summary && (
              <div className="p-4 rounded-2xl bg-navy-950/70 border border-navy-800/80">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-brand-blue-light" />

                  Executive Summary
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {String(parsedData.summary)}
                </p>
              </div>
            )}

            {/* SKILLS */}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-brand-blue-light" />

                  Detected Skills ({skills.length})
                </h3>

                <span className="text-[11px] text-slate-400 font-mono">
                  ATS Score:{' '}
                  <strong className="text-status-success">
                    {parsedData?.metrics?.atsCompatibilityScore ??
                      0}
                    %
                  </strong>
                </span>
              </div>

              {categorizedSkills ? (
                <div className="space-y-3">
                  {Object.entries(categorizedSkills).map(
                    ([category, skillsList]) => {
                      const safeSkills = Array.isArray(
                        skillsList
                      )
                        ? skillsList
                        : [];

                      return (
                        <div
                          key={category}
                          className="space-y-1.5"
                        >
                          <span className="text-[11px] font-medium text-slate-400 capitalize">
                            {category.replace('_', ' / ')}:
                          </span>

                          <div className="flex flex-wrap gap-1.5">
                            {safeSkills.map(
                              (skill, index) => (
                                <span
                                  key={`${category}-${index}`}
                                  className="px-2.5 py-1 rounded-lg bg-navy-850 border border-navy-750 text-slate-200 text-xs font-mono hover:border-brand-blue/40 transition-colors"
                                >
                                  {typeof skill === 'string'
                                    ? skill
                                    : JSON.stringify(skill)}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded-lg bg-navy-850 border border-navy-750 text-slate-200 text-xs font-mono"
                    >
                      {typeof skill === 'string'
                        ? skill
                        : JSON.stringify(skill)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* EXPERIENCE + EDUCATION */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

              {/* EXPERIENCE */}

              <div className="p-4 rounded-2xl bg-navy-950/70 border border-navy-800/80 space-y-2.5">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />

                  Experience Highlights
                </h3>

                {experience.length > 0 ? (
                  experience.map((exp, index) => (
                    <div
                      key={index}
                      className="text-xs space-y-1 pb-2 border-b border-navy-900 last:border-0"
                    >
                      <p className="font-semibold text-slate-200">
                        {exp?.role || 'Role'}
                      </p>

                      <p className="text-slate-400">
                        {exp?.company || 'Company'}

                        {exp?.period && (
                          <>
                            {' • '}
                            <span className="font-mono text-slate-500">
                              {exp.period}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    No experience details detected.
                  </p>
                )}
              </div>

              {/* EDUCATION */}

              <div className="p-4 rounded-2xl bg-navy-950/70 border border-navy-800/80 space-y-2.5">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-brand-gold" />

                  Education & Credentials
                </h3>

                {education.length > 0 ? (
                  education.map((edu, index) => (
                    <div
                      key={index}
                      className="text-xs space-y-1"
                    >
                      <p className="font-semibold text-slate-200">
                        {edu?.degree || 'Degree'}
                      </p>

                      <p className="text-slate-400">
                        {edu?.institution ||
                          'Institution'}

                        {edu?.year && (
                          <>
                            {' • '}
                            <span className="font-mono text-slate-500">
                              {edu.year}
                            </span>
                          </>
                        )}
                      </p>

                      {edu?.details && (
                        <p className="text-[11px] text-slate-500">
                          {edu.details}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    No education details detected.
                  </p>
                )}
              </div>
            </div>

            {/* PROCEED */}

            <div className="pt-4 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />

                <span>
                  Ready to predict high-fit career roles
                </span>
              </div>

              <button
                type="button"
                onClick={handleProceedToPrediction}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-sm shadow-glow-blue flex items-center justify-center gap-2.5 transition-all group focus-visible:ring-2"
              >
                <span>Predict Matching Roles</span>

                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
};

export default UploadResumePage;