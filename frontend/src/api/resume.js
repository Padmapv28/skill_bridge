import apiClient from './client';

/**
 * Resume Analysis & Prediction API Service
 * Fully integrated with Padma's FastAPI + Ollama LLM backend endpoints (/api/career/*)
 */

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
  });
  return response.data;
};


/**
 * Predict top matching career roles based on parsed resume data (Calls Ollama LLM / Sentence-Transformers)
 * @param {Object} resumeData - Parsed resume content
 * @returns {Promise<{ success: boolean, roles: Array }>}
 */
export const predictRole = async (resumeData) => {
  try {
    const response = await apiClient.post('/api/career/predict-roles', { resume: resumeData });
    return response.data;
  } catch (err) {
    const response = await apiClient.post('/api/predict-role', { resumeData });
    return response.data;
  }
};

/**
 * Get skill gap analysis for a selected role against user's skills
 * @param {Object} payload - { role: Object, userSkills: Array, resumeData?: Object }
 * @returns {Promise<{ success: boolean, skillGap: Object }>}
 */
export const getSkillGap = async (payload) => {
  try {
    const roleName = payload.role?.title || payload.role;
    const resumeObj = payload.resumeData || { skills: payload.userSkills || [] };
    const response = await apiClient.post('/api/career/skill-gap', {
      role: roleName,
      resume: resumeObj,
    });
    return response.data;
  } catch (err) {
    const response = await apiClient.post('/api/skill-gap', payload);
    return response.data;
  }
};

/**
 * Generate personalized interactive learning roadmap (Calls Ollama LLM in roadmap_generator.py)
 * @param {Object} payload - { role: Object, resumeData?: Object, missingSkills: Array, partialSkills: Array }
 * @returns {Promise<{ success: boolean, roadmap: Object }>}
 */
export const generateRoadmap = async (payload) => {
  try {
    const roleName = payload.role?.title || payload.role;
    const resumeObj = payload.resumeData || { skills: payload.userSkills || [] };
    const response = await apiClient.post('/api/career/roadmap', {
      role: roleName,
      resume: resumeObj,
      missingSkills: payload.missingSkills || [],
      partialSkills: payload.partialSkills || [],
    });
    return { success: true, roadmap: response.data };
  } catch (err) {
    const response = await apiClient.post('/api/generate-roadmap', payload);
    return response.data;
  }
};

import { evaluateAtsCompatibility } from '../utils/atsEvaluator';

/**
 * Calculate ATS Compatibility Score between Resume and Job Description (Calls Ollama LLM backend or semantic evaluator)
 * @param {Object} payload - { resumeData?: Object, file?: File, jdText: string, resumeText?: string }
 */
export const checkAtsScore = async ({ resumeData, file, jdText, resumeText = '' }) => {
  try {
    if (resumeData && !file) {
      const response = await apiClient.post(
        '/api/career/ats-score',
        {
          resume: resumeData,
          jdText: jdText,
          resumeText: resumeText,
        },
        { timeout: 1500 }
      );
      return response.data;
    }

    if (file) {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jd_text', jdText);
      if (resumeText) formData.append('resume_text', resumeText);
      const response = await apiClient.post('/api/ats-score', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 1500,
      });
      return response.data;
    }

    const response = await apiClient.post(
      '/api/ats-score',
      {
        resume_data: resumeData,
        jd_text: jdText,
        resume_text: resumeText,
      },
      { timeout: 1500 }
    );
    return response.data;
  } catch (err) {
    console.warn('[ATS Scorer] Fast fallback: calculating real-time semantic ATS score in browser (<5ms):', err.message);
    return evaluateAtsCompatibility({
      resumeData,
      resumeText,
      jdText,
      fileName: file?.name || '',
    });
  }
};



/**
 * Get current session state from backend (Member C endpoint)
 * @returns {Promise<{ success: boolean, session: Object }>}
 */
export const getCurrentSession = async () => {
  const response = await apiClient.get('/api/session/current');
  return response.data;
};

/**
 * Update session state incrementally
 * @param {Object} patchData - Partial session fields to update
 */
export const updateSessionState = async (patchData) => {
  const response = await apiClient.patch('/api/session/state', patchData);
  return response.data;
};

/**
 * Update roadmap skill progress (Member C endpoint)
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
 * Direct Learning Suggestions (Member C).
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

