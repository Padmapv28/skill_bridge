import apiClient from './client';

/**
 * Upload a real PDF/DOCX resume.
 */
export const uploadResume = async (file) => {
  if (!file) {
    throw new Error('No resume file selected.');
  }

  const formData = new FormData();
  formData.append('resume', file);

  const response = await apiClient.post(
    '/api/upload-resume',
    formData,
    {
      timeout: 120000,
    }
  );

  return response.data;
};


/**
 * Predict career roles from the CURRENT resume.
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
 * AI Skill Gap Analysis.
 */
export const getSkillGap = async ({
  role,
  resume,
}) => {
  if (!resume) {
    throw new Error('Current resume data is missing.');
  }

  if (!role) {
    throw new Error('Target career role is missing.');
  }

  const response = await apiClient.post(
    '/api/career/skill-gap',
    {
      resume,
      role,
    },
    {
      timeout: 180000,
    }
  );

  return response.data;
};


/**
 * AI Career Roadmap.
 */
export const generateRoadmap = async ({
  role,
  resume,
  missingSkills = [],
  partialSkills = [],
}) => {
  if (!resume) {
    throw new Error('Current resume data is missing.');
  }

  if (!role) {
    throw new Error('Target career role is missing.');
  }

  const response = await apiClient.post(
    '/api/career/roadmap',
    {
      resume,
      role,
      missingSkills,
      partialSkills,
    },
    {
      timeout: 180000,
    }
  );

  return response.data;
};


/**
 * Direct Learning Suggestions.
 *
 * Uses the missing and partial skills already identified
 * by Skill Gap. This avoids running the skill-gap AI analysis again.
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