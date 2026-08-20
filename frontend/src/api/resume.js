import apiClient from './client';

/**
 * Resume Analysis & Prediction API Service
 */

/**
 * Upload resume file (.pdf, .docx)
 * @param {File} file - Resume file
 * @returns {Promise<{ success: boolean, resumeId: string, parsedData: Object }>}
 */
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await apiClient.post('/api/upload-resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Predict top matching career roles based on parsed resume data
 * @param {Object} resumeData - Parsed resume content
 * @returns {Promise<{ success: boolean, roles: Array }>}
 */
export const predictRole = async (resumeData) => {
  const response = await apiClient.post('/api/predict-role', { resumeData });
  return response.data;
};

/**
 * Get skill gap analysis for a selected role against user's skills
 * @param {Object} payload - { role: Object, userSkills: Array, roleId?: string }
 * @returns {Promise<{ success: boolean, skillGap: Object }>}
 */
export const getSkillGap = async (payload) => {
  const response = await apiClient.post('/api/skill-gap', payload);
  return response.data;
};

/**
 * Generate personalized interactive learning roadmap
 * @param {Object} payload - { role: Object, missingSkills: Array, partialSkills: Array }
 * @returns {Promise<{ success: boolean, roadmap: Object }>}
 */
export const generateRoadmap = async (payload) => {
  const response = await apiClient.post('/api/generate-roadmap', payload);
  return response.data;
};
