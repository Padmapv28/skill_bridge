import apiClient from './client';

/**
 * Upload a real PDF/DOCX resume.
 *
 * Backend expects:
 *     resume: UploadFile
 */
export const uploadResume = async (file) => {
  if (!file) {
    throw new Error('No resume file selected.');
  }

  const formData = new FormData();

  // FastAPI upload parameter
  formData.append('resume', file);

  const response = await apiClient.post(
    '/api/upload-resume',
    formData,
    {
      // Let Axios/browser set multipart boundary automatically.
      timeout: 120000,
    }
  );

  return response.data;
};

/**
 * Predict matching career roles from the CURRENT uploaded resume.
 *
 * Backend endpoint:
 *     POST /api/career/predict-roles
 *
 * Backend expects:
 *     {
 *       "resume": {...}
 *     }
 *
 * Backend returns:
 *     {
 *       "predictions": [...]
 *     }
 */
export const predictRole = async (resumeData) => {
  if (!resumeData) {
    throw new Error('Resume data is missing.');
  }

  const response = await apiClient.post(
    '/api/career/predict-roles',
    {
      resume: resumeData,
    },
    {
      timeout: 180000,
    }
  );

  return response.data;
};

/**
 * Get skill-gap analysis.
 */
export const getSkillGap = async (payload) => {
  const response = await apiClient.post(
    '/api/skill-gap',
    payload
  );

  return response.data;
};

/**
 * Generate personalized career roadmap.
 */
export const generateRoadmap = async (payload) => {
  const response = await apiClient.post(
    '/api/generate-roadmap',
    payload
  );

  return response.data;
};