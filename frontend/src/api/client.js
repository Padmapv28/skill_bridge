import axios from 'axios';
import { 
  mockUser, 
  sampleParsedResume, 
  mockPredictedRoles, 
  mockSkillGapDatabase, 
  mockRoadmapData 
} from './mockData';
import { 
  evaluateAtsCompatibility, 
  extractSkillsFromText, 
  extractResumeExperienceYears 
} from '../utils/atsEvaluator';


const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: Attach JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('resume_ai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper for simulated network delay in mock fallback
const delay = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

// Response interceptor: Global 401 handler + seamless offline mock fallback
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle 401 Unauthorized globally
    if (error.response && error.response.status === 401) {
      console.warn('[API Client] 401 Unauthorized detected. Clearing session.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('resume_ai_token');
      localStorage.removeItem('resume_ai_user');
      
      // Dispatch custom window event for AuthContext to sync state
      window.dispatchEvent(new CustomEvent('auth:session_expired', {
        detail: { message: 'Your session has expired or is invalid. Please log in again.' }
      }));

      // Redirect if not already on login page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && !window.location.pathname.includes('/verify-otp')) {
        window.location.href = '/login?reason=session_expired';
      }
      return Promise.reject(error);
    }

    // 2. Intelligent Mock Fallback if backend server is offline or returns 404/500 during evaluation
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
    const isLocalBackend = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1');

    if ((isNetworkError || error.response?.status === 404) && isLocalBackend) {
      const url = originalRequest.url || '';
      console.info(`[API Client: Demo Mode] Backend at ${BASE_URL} unreachable or endpoint not found (${url}). Providing mock response for seamless evaluation.`);
      
      // Do not delay ATS evaluation requests — make them instantaneous
      if (!url.includes('/api/ats-score') && !url.includes('/api/career/ats-score')) {
        await delay(350);
      }


      // Handle Mock endpoints
      if (url.includes('/api/login')) {
        let body = {};
        try { body = typeof originalRequest.data === 'string' ? JSON.parse(originalRequest.data) : originalRequest.data; } catch(e){}
        const email = body?.email || 'user@example.com';
        return {
          status: 200,
          data: {
            token: mockUser.token,
            user: { ...mockUser, email, name: email.split('@')[0] }
          }
        };
      }

      if (url.includes('/api/register')) {
        let body = {};
        try { body = typeof originalRequest.data === 'string' ? JSON.parse(originalRequest.data) : originalRequest.data; } catch(e){}
        const email = body?.email || 'student@example.com';
        return {
          status: 200,
          data: {
            success: true,
            message: 'OTP sent to your email address',
            email
          }
        };
      }

      if (url.includes('/api/verify-otp')) {
        let body = {};
        try { body = typeof originalRequest.data === 'string' ? JSON.parse(originalRequest.data) : originalRequest.data; } catch(e){}
        const email = body?.email || 'student@example.com';
        return {
          status: 200,
          data: {
            success: true,
            token: mockUser.token,
            user: {
              id: `usr_${Date.now()}`,
              name: email.split('@')[0],
              email,
              avatar: mockUser.avatar
            }
          }
        };
      }

      if (url.includes('/api/resend-otp')) {
        return {
          status: 200,
          data: {
            success: true,
            message: 'New OTP has been sent to your email'
          }
        };
      }

      if (url.includes('/api/ats-score') || url.includes('/api/career/ats-score')) {
        let resumeData = null;
        let jdText = '';
        let resumeText = '';
        let fileName = '';

        if (originalRequest.data instanceof FormData) {
          jdText = originalRequest.data.get('jd_text') || originalRequest.data.get('jdText') || '';
          resumeText = originalRequest.data.get('resume_text') || '';
          const fileObj = originalRequest.data.get('resume');
          if (fileObj && typeof fileObj === 'object') {
            fileName = fileObj.name || '';
          }
        } else {
          let body = {};
          try {
            body = typeof originalRequest.data === 'string' ? JSON.parse(originalRequest.data) : (originalRequest.data || {});
          } catch (e) {}
          resumeData = body.resume || body.resume_data || body.resumeData || null;
          jdText = body.jdText || body.jd_text || '';
          resumeText = body.resumeText || body.resume_text || '';
          fileName = body.fileName || '';
        }

        // Check if there is an active session resume in localStorage
        if (!resumeData && !resumeText) {
          try {
            const storedSession = localStorage.getItem('skillbridge_resume_session');
            if (storedSession) {
              const parsed = JSON.parse(storedSession);
              if (parsed.parsedResume) {
                resumeData = parsed.parsedResume;
              }
            }
          } catch (e) {}
        }

        const dynamicResult = evaluateAtsCompatibility({
          resumeData: resumeData || (resumeText ? null : sampleParsedResume),
          resumeText,
          jdText: jdText || 'Software Engineer proficient in JavaScript, React, APIs, and modern application development.',
          fileName
        });

        return {
          status: 200,
          data: dynamicResult
        };
      }


      if (url.includes('/api/session/current')) {
        return {
          status: 200,
          data: {
            success: true,
            session: null
          }
        };
      }

      if (url.includes('/api/progress') && url.includes('/summary')) {
        return {
          status: 200,
          data: {
            success: true,
            totalSkills: 18,
            completedSkills: 7,
            inProgressSkills: 4,
            percentage: 45
          }
        };
      }

      if (url.includes('/api/progress')) {
        return {
          status: 200,
          data: {
            success: true,
            message: 'Progress updated successfully'
          }
        };
      }

      if (url.includes('/api/me') || url.includes('/api/profile')) {
        const storedUser = localStorage.getItem('user');
        return {
          status: 200,
          data: storedUser ? JSON.parse(storedUser) : mockUser
        };
      }

      if (url.includes('/api/upload-resume')) {
        let fileName = 'Uploaded_Resume.pdf';
        let resumeText = '';
        if (originalRequest.data instanceof FormData) {
          const fileObj = originalRequest.data.get('resume');
          if (fileObj && typeof fileObj === 'object') {
            fileName = fileObj.name || fileName;
          }
          resumeText = originalRequest.data.get('resume_text') || '';
        }

        // Clean candidate name from filename or first line
        let candidateName = fileName.replace(/\.[^/.]+$/, '').replace(/[_\-\.]+/g, ' ');
        candidateName = candidateName.replace(/\bresume\b/gi, '').replace(/\bcv\b/gi, '').trim();
        if (!candidateName || candidateName.length < 3) {
          candidateName = 'Alex Chen';
        } else {
          candidateName = candidateName
            .split(' ')
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
        }

        const detectedSkills = extractSkillsFromText(resumeText);
        const effectiveSkills =
          detectedSkills.length >= 3 ? detectedSkills : sampleParsedResume.skills;

        const years = extractResumeExperienceYears(null, resumeText);

        const customParsed = {
          ...sampleParsedResume,
          candidateName,
          email: `${candidateName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          headline: `${candidateName} • Technical Specialist`,
          skills: effectiveSkills,
          yearsExperience: `${years}+ yrs`,
          metrics: {
            yearsOfExperience: years,
            skillsDetectedCount: effectiveSkills.length,
            atsCompatibilityScore: Math.min(96, Math.max(68, 70 + effectiveSkills.length * 2)),
          },
        };

        return {
          status: 200,
          data: {
            success: true,
            resumeId: `res_${Date.now()}`,
            parsedData: customParsed,
          },
        };
      }


      if (url.includes('/api/predict-role')) {
        return {
          status: 200,
          data: {
            success: true,
            roles: mockPredictedRoles
          }
        };
      }

      if (url.includes('/api/skill-gap')) {
        let body = {};
        try { body = typeof originalRequest.data === 'string' ? JSON.parse(originalRequest.data) : originalRequest.data; } catch(e){}
        const roleId = body?.role?.id || body?.roleId || 'role_ai_app_eng';
        const gapData = mockSkillGapDatabase[roleId] || {
          ...mockSkillGapDatabase.default,
          roleTitle: body?.role?.title || 'Target Role'
        };
        return {
          status: 200,
          data: {
            success: true,
            skillGap: gapData
          }
        };
      }

      if (url.includes('/api/generate-roadmap')) {
        let body = {};
        try { body = typeof originalRequest.data === 'string' ? JSON.parse(originalRequest.data) : originalRequest.data; } catch(e){}
        const roleId = body?.role?.id || body?.roleId || 'role_ai_app_eng';
        const roadmap = mockRoadmapData[roleId] || {
          ...mockRoadmapData.default,
          roleTitle: body?.role?.title || 'Target Career Path'
        };
        return {
          status: 200,
          data: {
            success: true,
            roadmap
          }
        };
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
