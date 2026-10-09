import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as resumeApi from '../api/resume';

const STORAGE_KEY = 'skillbridge_resume_session';

const initialState = {
  parsedResume: null,
  predictions: [],
  selectedRole: null,
  skillGapResult: null,
  roadmapResult: null,
  atsResult: null,
  skillProgress: {}, // { [skillName]: 'not_started' | 'in_progress' | 'completed' }
  isLoadingSession: false,
};

function resumeReducer(state, action) {
  switch (action.type) {
    case 'SET_RESUME':
      return {
        ...state,
        parsedResume: action.payload,
      };

    case 'SET_PREDICTIONS':
      return {
        ...state,
        predictions: action.payload,
      };

    case 'SET_SELECTED_ROLE':
      return {
        ...state,
        selectedRole: action.payload,
      };

    case 'SET_SKILL_GAP':
      return {
        ...state,
        skillGapResult: action.payload,
      };

    case 'SET_ROADMAP':
      return {
        ...state,
        roadmapResult: action.payload,
      };

    case 'SET_ATS_RESULT':
      return {
        ...state,
        atsResult: action.payload,
      };

    case 'UPDATE_SKILL_PROGRESS': {
      const { skillName, status } = action.payload;
      return {
        ...state,
        skillProgress: {
          ...state.skillProgress,
          [skillName]: status,
        },
      };
    }

    case 'SET_ALL_SKILL_PROGRESS':
      return {
        ...state,
        skillProgress: action.payload,
      };

    case 'HYDRATE_SESSION':
      return {
        ...state,
        ...action.payload,
        isLoadingSession: false,
      };

    case 'SET_LOADING_SESSION':
      return {
        ...state,
        isLoadingSession: action.payload,
      };

    case 'CLEAR_SESSION':
      return {
        ...initialState,
        isLoadingSession: false,
      };

    default:
      return state;
  }
}

const ResumeContext = createContext(null);

export const ResumeProvider = ({ children }) => {
  // Initialize state from localStorage if available
  const [state, dispatch] = useReducer(resumeReducer, initialState, (defaultInit) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultInit, ...parsed, isLoadingSession: false };
      }
    } catch (e) {
      console.warn('Failed to load session from localStorage:', e);
    }
    return defaultInit;
  });

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    try {
      const toSave = {
        parsedResume: state.parsedResume,
        predictions: state.predictions,
        selectedRole: state.selectedRole,
        skillGapResult: state.skillGapResult,
        roadmapResult: state.roadmapResult,
        atsResult: state.atsResult,
        skillProgress: state.skillProgress,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save session to localStorage:', e);
    }
  }, [
    state.parsedResume,
    state.predictions,
    state.selectedRole,
    state.skillGapResult,
    state.roadmapResult,
    state.atsResult,
    state.skillProgress,
  ]);

  // Optionally hydrate from backend session on initial mount
  useEffect(() => {
    const hydrateFromBackend = async () => {
      const token = localStorage.getItem('resume_ai_token') || localStorage.getItem('token');
      if (!token) return;

      try {
        dispatch({ type: 'SET_LOADING_SESSION', payload: true });
        const res = await resumeApi.getCurrentSession();
        if (res && res.session) {
          dispatch({
            type: 'HYDRATE_SESSION',
            payload: {
              parsedResume: res.session.parsedResume || state.parsedResume,
              predictions: res.session.predictions || state.predictions,
              selectedRole: res.session.selectedRole || state.selectedRole,
              skillGapResult: res.session.skillGapResult || state.skillGapResult,
              roadmapResult: res.session.roadmapResult || state.roadmapResult,
              skillProgress: res.session.skillProgress || state.skillProgress,
            },
          });
        }
      } catch (err) {
        // Backend offline or no remote session - silent fallback to localStorage
      } finally {
        dispatch({ type: 'SET_LOADING_SESSION', payload: false });
      }
    };

    hydrateFromBackend();
  }, []);

  // Helper dispatchers
  const setResume = (resumeData) => {
    dispatch({ type: 'SET_RESUME', payload: resumeData });
  };

  const setPredictions = (predictions) => {
    dispatch({ type: 'SET_PREDICTIONS', payload: predictions });
  };

  const setSelectedRole = (role) => {
    dispatch({ type: 'SET_SELECTED_ROLE', payload: role });
  };

  const setSkillGap = (skillGap) => {
    dispatch({ type: 'SET_SKILL_GAP', payload: skillGap });
  };

  const setRoadmap = (roadmap) => {
    dispatch({ type: 'SET_ROADMAP', payload: roadmap });
  };

  const setAtsResult = (atsData) => {
    dispatch({ type: 'SET_ATS_RESULT', payload: atsData });
  };

  const updateSkillStatus = async ({ roadmapId, skillName, phaseNumber, status }) => {
    // 1. Optimistically update local state & localStorage
    dispatch({
      type: 'UPDATE_SKILL_PROGRESS',
      payload: { skillName, status },
    });

    // 2. Persist to backend API (Member C endpoint)
    try {
      await resumeApi.updateSkillProgress({
        roadmapId: roadmapId || state.roadmapResult?.roleId || 'default_roadmap',
        skillName,
        phaseNumber,
        status,
      });
    } catch (e) {
      // Backend offline, state already saved locally
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    dispatch({ type: 'CLEAR_SESSION' });
  };

  return (
    <ResumeContext.Provider
      value={{
        ...state,
        setResume,
        setPredictions,
        setSelectedRole,
        setSkillGap,
        setRoadmap,
        setAtsResult,
        updateSkillStatus,
        clearSession,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

export default ResumeContext;
