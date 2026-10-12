
import apiClient from './client';

/**
 * Resume Analysis & Prediction API Service
 * Integrated with the FastAPI + Ollama LLM backend (/api/career/*).
 *
 * Timeouts: Ollama runs on CPU on the dev laptop, so LLM calls can take
 * 1-3 minutes. Heavy calls use 300000 ms (5 min); quick calls are shorter.
 */

const LLM_TIMEOUT = 300000;
const SEARCH_TIMEOUT = 60000;
const MAIL_TIMEOUT = 30000;

/**
 * Accept a role name as either a string or an object.
 */
const getCareerRoleName = (role) => {
  if (typeof role === 'string') {
    return role.trim();
  }

  if (role && typeof role === 'object') {
    return String(
      role.title || role.name || role.role || ''
    ).trim();
  }

  return '';
};

/**
 * Unwrap resume objects returned by different API endpoints
 * and stored session formats.
 */
const unwrapCareerResume = (candidate) => {
  let current = candidate;

  for (let i = 0; i < 6; i += 1) {
    if (
      !current ||
      typeof current !== 'object' ||
      Array.isArray(current)
    ) {
      return null;
    }

    const wrapperKeys = [
      'parsedData',
      'parsed_data',
      'parsedResume',
      'parsed_resume',
      'resumeData',
      'resume_data',
      'extractedData',
      'extracted_data',
    ];

    let nested = null;

    for (const key of wrapperKeys) {
      const value = current[key];

      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        nested = value;
        break;
      }
    }

    if (
      !nested &&
      current.resume &&
      typeof current.resume === 'object' &&
      !Array.isArray(current.resume)
    ) {
      nested = current.resume;
    }

    if (!nested) {
      break;
    }

    current = nested;
  }

  return current;
};

/**
 * Resolve the actual parsed resume from supported payload formats.
 *
 * IMPORTANT:
 * SkillGapPage may send payload.resume, while older code only
 * checked payload.resumeData. That mismatch caused skills: [].
 *
 * Do not silently send an empty resume to the backend.
 */
const resolveCareerResume = (payload = {}) => {
  const candidates = [
    payload.resume,
    payload.resumeData,
    payload.resume_data,
    payload.parsedData,
    payload.parsed_data,
  ];

  for (const candidate of candidates) {
    const resume = unwrapCareerResume(candidate);

    if (!resume) {
      continue;
    }

    const skills =
      resume.skills ??
      resume.technicalSkills ??
      resume.technical_skills ??
      resume.detectedSkills ??
      resume.detected_skills;

    if (Array.isArray(skills) && skills.length > 0) {
      return {
        ...resume,
        skills,
      };
    }
  }

  if (
    Array.isArray(payload.userSkills) &&
    payload.userSkills.length > 0
  ) {
    return {
      skills: payload.userSkills,
    };
  }

  throw new Error(
    'No extracted skills were found in the active resume. ' +
    'Return to Upload and verify the parsed resume before continuing.'
  );
};

/**
 * Search career roles across domains.
 */
export const searchRoles = async (query = '') => {
  const response = await apiClient.post(
    '/api/career/search-roles',
    { query },
    { timeout: SEARCH_TIMEOUT }
  );

  return response.data;
};

/**
 * Upload a PDF or DOCX resume.
 */
export const uploadResume = async (file, resumeText = '') => {
  const formData = new FormData();

  formData.append('resume', file);

  if (resumeText) {
    formData.append('resume_text', resumeText);
  }

  const response = await apiClient.post(
    '/api/upload-resume',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: LLM_TIMEOUT,
    }
  );

  return response.data;
};

/**
 * Predict career roles using the parsed resume.
 */
export const predictRole = async (resumeData) => {
  const response = await apiClient.post(
    '/api/career/predict-roles',
    { resume: resumeData },
    { timeout: LLM_TIMEOUT }
  );

  return response.data;
};

/**
 * Get skill gap analysis for a selected role.
 *
 * Supports payload.resume, payload.resumeData and
 * payload.userSkills for compatibility with existing pages.
 */
export const getSkillGap = async (payload = {}) => {
  const roleName = getCareerRoleName(payload.role);

  if (!roleName) {
    throw new Error('Please select a target career role.');
  }

  const resumeObj = resolveCareerResume(payload);

  const response = await apiClient.post(
    '/api/career/skill-gap',
    {
      role: roleName,
      resume: resumeObj,
    },
    { timeout: LLM_TIMEOUT }
  );

  return response.data;
};

/**
 * Generate the personalized learning roadmap.
 */
export const generateRoadmap = async (payload = {}) => {
  const roleName = getCareerRoleName(payload.role);

  if (!roleName) {
    throw new Error('Please select a target career role.');
  }

  const resumeObj = resolveCareerResume(payload);

  const response = await apiClient.post(
    '/api/career/roadmap',
    {
      role: roleName,
      resume: resumeObj,
      missingSkills: payload.missingSkills || [],
      partialSkills: payload.partialSkills || [],
    },
    { timeout: LLM_TIMEOUT }
  );

  return {
    success: true,
    roadmap: response.data,
  };
};

/**
 * Calculate ATS compatibility between a resume and job description.
 */
export const checkAtsScore = async ({
  resumeData,
  file,
  jdText,
  resumeText = '',
}) => {
  let activeResume = resumeData;

  // If the ATS page receives a file directly, parse it first.
  if (file && (!activeResume || !activeResume.skills)) {
    const uploadRes = await uploadResume(file, resumeText);

    if (!uploadRes?.parsedData) {
      throw new Error(
        'The server could not read this resume file.'
      );
    }

    activeResume = uploadRes.parsedData;
  }

  // Support pasted resume text when no parsed resume is available.
  if (!activeResume && resumeText) {
    activeResume = {
      name: 'Candidate',
      skills: [],
      experience: [
        {
          description: resumeText.slice(0, 1000),
        },
      ],
    };
  }

  if (!activeResume) {
    throw new Error(
      'Please upload a resume before running the ATS check.'
    );
  }

  const response = await apiClient.post(
    '/api/career/ats-score',
    {
      resume: activeResume,
      jdText,
    },
    { timeout: LLM_TIMEOUT }
  );

  return response.data;
};

/**
 * Email an ATS score evaluation report.
 */
export const emailAtsReport = async ({
  email,
  name,
  atsResult,
  jdTitle,
}) => {
  const response = await apiClient.post(
    '/api/career/email-ats-report',
    {
      email,
      name,
      atsResult,
      jdTitle,
    },
    { timeout: MAIL_TIMEOUT }
  );

  return response.data;
};

/**
 * Email course enrollment confirmation.
 */
export const emailCourseRegistration = async ({
  email,
  name,
  courseTitle,
  courseUrl,
  platform,
}) => {
  const response = await apiClient.post(
    '/api/career/email-course-registration',
    {
      email,
      name,
      courseTitle,
      courseUrl,
      platform,
    },
    { timeout: MAIL_TIMEOUT }
  );

  return response.data;
};

/**
 * Get the current user's backend session.
 */
export const getCurrentSession = async () => {
  const response = await apiClient.get(
    '/api/session/current'
  );

  return response.data;
};

/**
 * Clear the saved backend session.
 */
export const clearBackendSession = async () => {
  const response = await apiClient.delete(
    '/api/session/current'
  );

  return response.data;
};

/**
 * Deprecated no-op retained for compatibility with existing imports.
 */
export const updateSessionState = async () => {
  return {
    success: false,
    skipped: true,
  };
};

/**
 * Update progress for a roadmap skill.
 */
export const updateSkillProgress = async ({
  roadmapId,
  skillName,
  phaseNumber,
  status,
}) => {
  const response = await apiClient.patch(
    `/api/progress/${encodeURIComponent(roadmapId)}/skill`,
    {
      skill_name: skillName,
      phase_number: phaseNumber,
      status,
    }
  );

  return response.data;
};

/**
 * Get overall roadmap progress.
 */
export const getProgressSummary = async (roadmapId) => {
  const response = await apiClient.get(
    `/api/progress/${encodeURIComponent(roadmapId)}/summary`
  );

  return response.data;
};

/**
 * Get direct learning suggestions for missing and partial skills.
 */
export const getCourseSuggestions = async ({
  role,
  missingSkills = [],
  partialSkills = [],
}) => {
  if (!role) {
    throw new Error('Target career role is missing.');
  }

  const response = await apiClient.post(
    '/api/career/course-suggestions',
    {
      role,
      missingSkills,
      partialSkills,
    },
    {
      timeout: 120000,
    }
  );

  return response.data;
};
