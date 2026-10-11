import apiClient from './client';

/**
 * Resume Analysis & Prediction API Service
 * Integrated with the FastAPI + Ollama LLM backend (/api/career/*).
 *
 * Timeouts: Ollama runs on CPU on the dev laptop, so LLM calls can take
 * 1-3 minutes. Heavy calls use 300000 ms (5 min); quick calls are shorter.
 */

const LLM_TIMEOUT = 300000; // 5 minutes for heavy LLM calls
const SEARCH_TIMEOUT = 60000; // 1 minute for role search
const MAIL_TIMEOUT = 30000; // 30 seconds for email endpoints

/**
 * Search career roles across ANY domain (live Ollama LLM + guaranteed fallback)
 * @param {string} query - Target domain or role search query
 * @returns {Promise<{ roles: Array }>}
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
 * Upload resume file (.pdf, .docx)
 * @param {File} file - Resume file
 * @returns {Promise<{ success: boolean, resumeId: string, parsedData: Object }>}
 */
export const uploadResume = async (file, resumeText = '') => {
  const formData = new FormData();
  formData.append('resume', file);
  if (resumeText) {
    formData.append('resume_text', resumeText);
  }

  const response = await apiClient.post('/api/upload-resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: LLM_TIMEOUT,
  });
  return response.data;
};

/**
 * Predict top matching career roles based on parsed resume data
 * @param {Object} resumeData - Parsed resume content
 * @returns {Promise<{ success: boolean, roles: Array }>}
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
 * Get skill gap analysis for a selected role against the user's resume
 * @param {Object} payload - { role: Object, userSkills: Array, resumeData?: Object }
 * @returns {Promise<{ success: boolean, skillGap: Object }>}
 */
export const getSkillGap = async (payload) => {
  const roleName = payload.role?.title || payload.role;
  const resumeObj = payload.resumeData || { skills: payload.userSkills || [] };
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
 * Generate personalized interactive learning roadmap
 * @param {Object} payload - { role: Object, resumeData?: Object, missingSkills: Array, partialSkills: Array }
 * @returns {Promise<{ success: boolean, roadmap: Object }>}
 */
export const generateRoadmap = async (payload) => {
  const roleName = payload.role?.title || payload.role;
  const resumeObj = payload.resumeData || { skills: payload.userSkills || [] };
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
  return { success: true, roadmap: response.data };
};

/**
 * Calculate ATS compatibility score between a resume and a job description
 * @param {Object} payload - { resumeData?: Object, file?: File, jdText: string, resumeText?: string }
 */
export const checkAtsScore = async ({ resumeData, file, jdText, resumeText = '' }) => {
  let activeResume = resumeData;

  // If a file was uploaded directly on the ATS page, parse it through the backend parser first.
  // A parse failure is reported to the user instead of scoring an empty resume.
  if (file && (!activeResume || !activeResume.skills)) {
    const uploadRes = await uploadResume(file, resumeText);
    if (!uploadRes?.parsedData) {
      throw new Error('The server could not read this resume file.');
    }
    activeResume = uploadRes.parsedData;
  }

  // Pasted resume text with no file and no parsed resume
  if (!activeResume && resumeText) {
    activeResume = {
      name: 'Candidate',
      skills: [],
      experience: [{ description: resumeText.slice(0, 1000) }],
    };
  }

  if (!activeResume) {
    throw new Error('Please upload a resume before running the ATS check.');
  }

  const response = await apiClient.post(
    '/api/career/ats-score',
    {
      resume: activeResume,
      jdText: jdText,
    },
    { timeout: LLM_TIMEOUT }
  );
  return response.data;
};

/**
 * Email ATS score evaluation report to the candidate's email
 * @param {Object} payload - { email, name, atsResult, jdTitle }
 */
export const emailAtsReport = async ({ email, name, atsResult, jdTitle }) => {
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
 * Email course enrollment confirmation
 * @param {Object} payload - { email, name, courseTitle, courseUrl, platform }
 */
export const emailCourseRegistration = async ({ email, name, courseTitle, courseUrl, platform }) => {
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
 * Get current session state from backend
 * @returns {Promise<{ success: boolean, session: Object }>}
 */
export const getCurrentSession = async () => {
  const response = await apiClient.get('/api/session/current');
  return response.data;
};

/**
 * Clear the saved session on the backend ("start over")
 */
export const clearBackendSession = async () => {
  const response = await apiClient.delete('/api/session/current');
  return response.data;
};

/**
 * Deprecated: the backend has no /api/session/state endpoint.
 * The real routes are PATCH /api/session/predictions, /role, /skill-gap and /roadmap.
 * Kept as a harmless no-op so existing imports do not break.
 */
export const updateSessionState = async () => {
  return { success: false, skipped: true };
};

/**
 * Update roadmap skill progress
 * @param {Object} payload - { roadmapId, skillName, phaseNumber, status }
 */
export const updateSkillProgress = async ({ roadmapId, skillName, phaseNumber, status }) => {
  const response = await apiClient.patch(`/api/progress/${encodeURIComponent(roadmapId)}/skill`, {
    skill_name: skillName,
    phase_number: phaseNumber,
    status,
  });
  return response.data;
};

/**
 * Get overall progress summary for a roadmap
 * @param {string} roadmapId
 */
export const getProgressSummary = async (roadmapId) => {
  const response = await apiClient.get(`/api/progress/${encodeURIComponent(roadmapId)}/summary`);
  return response.data;
};

/**
 * Direct learning suggestions.
 * Uses missing and partial skills to fetch curated + fallback courses.
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