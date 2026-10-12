import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from 'react';

import * as resumeApi from '../api/resume';
import { useAuth } from './AuthContext';

const LEGACY_STORAGE_KEY = 'skillbridge_resume_session';
const STORAGE_PREFIX = 'skillbridge_resume_session:user:';

const initialState = {
  parsedResume: null,
  predictions: [],
  selectedRole: null,
  skillGapResult: null,
  roadmapResult: null,
  roadmapId: null,
  atsResult: null,
  skillProgress: {},
  isLoadingSession: false,
};

/**
 * Convert supported skill formats into a list of skill names.
 * This normalizes extracted skills without inventing new ones.
 */
function normalizeSkillList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }

        if (item && typeof item === 'object') {
          return String(
            item.name ??
              item.skill ??
              item.skill_name ??
              item.skillName ??
              ''
          ).trim();
        }

        return '';
      })
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,;\n|]/)
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Normalize resume data from different response formats.
 *
 * Example backend upload structure:
 * {
 *   filename: "resume.pdf",
 *   parsed_data: {
 *     skills: ["Python", "SQL"],
 *     ...
 *   },
 *   uploaded_at: "..."
 * }
 */
function normalizeResumeData(value, depth = 0) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    depth > 5
  ) {
    return null;
  }

  const wrapperKeys = [
    'parsed_data',
    'parsedData',
    'parsed_resume',
    'parsedResume',
    'resume_data',
    'resumeData',
    'extracted_data',
    'extractedData',
    'resume',
    'data',
  ];

  // Unwrap database records and API response wrappers.
  for (const key of wrapperKeys) {
    const nested = value[key];

    if (
      nested &&
      typeof nested === 'object' &&
      !Array.isArray(nested)
    ) {
      const normalizedNested = normalizeResumeData(
        nested,
        depth + 1
      );

      if (normalizedNested) {
        return normalizedNested;
      }
    }
  }

  const normalized = { ...value };

  const primarySkills = normalizeSkillList(value.skills);

  const alternateSkillKeys = [
    'technical_skills',
    'technicalSkills',
    'extracted_skills',
    'extractedSkills',
    'key_skills',
    'keySkills',
    'skill_list',
    'skillList',
    'all_skills',
    'allSkills',
  ];

  let skills = primarySkills;

  // Support other skill-field names when "skills" is empty.
  if (skills.length === 0) {
    for (const key of alternateSkillKeys) {
      const alternateSkills = normalizeSkillList(value[key]);

      if (alternateSkills.length > 0) {
        skills = alternateSkills;
        break;
      }
    }
  }

  // Give the rest of the application a consistent skills array.
  normalized.skills = skills;

  // Do not mistake a metadata-only database wrapper for a resume.
  const metadataKeys = [
    'filename',
    'uploaded_at',
    'uploadedAt',
    'created_at',
  ];

  const hasOnlyMetadata = Object.keys(value).every((key) =>
    metadataKeys.includes(key)
  );

  if (hasOnlyMetadata) {
    return null;
  }

  return normalized;
}

function resumeReducer(state, action) {
  switch (action.type) {
    case 'SET_RESUME':
      return {
        ...state,
        parsedResume: normalizeResumeData(action.payload),
      };

    case 'SET_PREDICTIONS':
      return {
        ...state,
        predictions: Array.isArray(action.payload)
          ? action.payload
          : [],
      };

    case 'SET_SELECTED_ROLE':
      return {
        ...state,
        selectedRole: action.payload ?? null,
      };

    case 'SET_SKILL_GAP':
      return {
        ...state,
        skillGapResult: action.payload ?? null,
      };

    case 'SET_ROADMAP':
      return {
        ...state,
        roadmapResult: action.payload ?? null,
      };

    case 'SET_ATS_RESULT':
      return {
        ...state,
        atsResult: action.payload ?? null,
      };

    case 'UPDATE_SKILL_PROGRESS': {
      const { skillName, status } = action.payload;

      if (!skillName) {
        return state;
      }

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
        skillProgress:
          action.payload &&
          typeof action.payload === 'object'
            ? action.payload
            : {},
      };

    case 'HYDRATE_SESSION':
      return {
        ...initialState,
        ...action.payload,

        parsedResume: normalizeResumeData(
          action.payload?.parsedResume
        ),

        predictions: Array.isArray(
          action.payload?.predictions
        )
          ? action.payload.predictions
          : [],

        skillProgress:
          action.payload?.skillProgress &&
          typeof action.payload.skillProgress === 'object'
            ? action.payload.skillProgress
            : {},

        isLoadingSession: false,
      };

    case 'SET_LOADING_SESSION':
      return {
        ...state,
        isLoadingSession: Boolean(action.payload),
      };

    case 'CLEAR_SESSION':
      return { ...initialState };

    default:
      return state;
  }
}

const ResumeContext = createContext(null);

export const ResumeProvider = ({ children }) => {
  const {
    user,
    token,
    isLoading: authLoading,
  } = useAuth();

  // Use a separate storage key for each signed-in account.
  const identity =
    user?.email?.trim()?.toLowerCase() ||
    user?.id ||
    user?._id ||
    null;

  const userKey = identity ? String(identity) : null;

  const storageKey = userKey
    ? `${STORAGE_PREFIX}${encodeURIComponent(userKey)}`
    : null;

  const loadedUserKeyRef = useRef(null);

  const [state, dispatch] = useReducer(
    resumeReducer,
    initialState
  );

  // ---------------------------------------------------------
  // RESTORE THE CURRENT USER'S SESSION
  // ---------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    loadedUserKeyRef.current = null;

    if (authLoading) {
      return () => {
        cancelled = true;
      };
    }

    // Never restore the previous shared, non-user-specific cache.
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (error) {
      console.warn(
        'Unable to remove legacy session storage.',
        error
      );
    }

    if (!userKey || !token) {
      dispatch({ type: 'CLEAR_SESSION' });

      return () => {
        cancelled = true;
      };
    }

    dispatch({
      type: 'SET_LOADING_SESSION',
      payload: true,
    });

    const restoreSession = async () => {
      let restored = { ...initialState };

      // First load this user's local browser cache.
      try {
        const saved = localStorage.getItem(storageKey);

        if (saved) {
          const parsed = JSON.parse(saved);

          restored = {
            ...initialState,

            parsedResume: normalizeResumeData(
              parsed?.parsedResume
            ),

            predictions: Array.isArray(parsed?.predictions)
              ? parsed.predictions
              : [],

            selectedRole: parsed?.selectedRole ?? null,
            skillGapResult: parsed?.skillGapResult ?? null,
            roadmapResult: parsed?.roadmapResult ?? null,
            roadmapId: parsed?.roadmapId ?? null,
            atsResult: parsed?.atsResult ?? null,

            skillProgress:
              parsed?.skillProgress &&
              typeof parsed.skillProgress === 'object'
                ? parsed.skillProgress
                : {},
          };
        }
      } catch (error) {
        console.warn(
          'Unable to restore this user’s local resume state.',
          error
        );
      }

      // Next retrieve this authenticated user's backend session.
      try {
        const response =
          await resumeApi.getCurrentSession();

        const session = response?.session ?? response;

        if (
          session &&
          typeof session === 'object'
        ) {
          const serverResume = normalizeResumeData(
            session.resume ??
              session.parsedResume ??
              session.parsed_resume ??
              session.resume_data ??
              session.resumeData
          );

          restored = {
            ...restored,

            // Preserve a valid local resume if the server has
            // no usable parsed resume data.
            parsedResume:
              serverResume ?? restored.parsedResume,

            predictions: Array.isArray(
              session.predictions
            )
              ? session.predictions
              : restored.predictions,

            selectedRole:
              session.selected_role ??
              session.selectedRole ??
              restored.selectedRole,

            skillGapResult:
              session.skill_gap ??
              session.skillGapResult ??
              restored.skillGapResult,

            roadmapResult:
              session.roadmap ??
              session.roadmapResult ??
              restored.roadmapResult,

            roadmapId:
              session.roadmap_id ??
              session.roadmapId ??
              restored.roadmapId,
          };
        }
      } catch (error) {
        // Retain this user's local cache if the server is
        // temporarily unavailable.
        console.warn(
          'Unable to restore the server session; using this user’s cache.',
          error?.message ?? error
        );
      }

      if (cancelled) {
        return;
      }

      loadedUserKeyRef.current = userKey;

      dispatch({
        type: 'HYDRATE_SESSION',
        payload: restored,
      });
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [authLoading, token, userKey, storageKey]);

  // ---------------------------------------------------------
  // SAVE ONLY TO THE CURRENT USER'S STORAGE
  // ---------------------------------------------------------

  useEffect(() => {
    if (
      !userKey ||
      !token ||
      !storageKey ||
      state.isLoadingSession ||
      loadedUserKeyRef.current !== userKey
    ) {
      return;
    }

    const toSave = {
      parsedResume: state.parsedResume,
      predictions: state.predictions,
      selectedRole: state.selectedRole,
      skillGapResult: state.skillGapResult,
      roadmapResult: state.roadmapResult,
      roadmapId: state.roadmapId,
      atsResult: state.atsResult,
      skillProgress: state.skillProgress,
    };

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(toSave)
      );
    } catch (error) {
      console.warn(
        'Unable to save the current user’s session.',
        error
      );
    }
  }, [
    userKey,
    token,
    storageKey,
    state.isLoadingSession,
    state.parsedResume,
    state.predictions,
    state.selectedRole,
    state.skillGapResult,
    state.roadmapResult,
    state.roadmapId,
    state.atsResult,
    state.skillProgress,
  ]);

  // ---------------------------------------------------------
  // STATE HELPERS
  // ---------------------------------------------------------

  const setResume = (resumeData) => {
    dispatch({
      type: 'SET_RESUME',
      payload: resumeData,
    });
  };

  const setPredictions = (predictions) => {
    dispatch({
      type: 'SET_PREDICTIONS',
      payload: predictions,
    });
  };

  const setSelectedRole = (role) => {
    dispatch({
      type: 'SET_SELECTED_ROLE',
      payload: role,
    });
  };

  const setSkillGap = (skillGap) => {
    dispatch({
      type: 'SET_SKILL_GAP',
      payload: skillGap,
    });
  };

  const setRoadmap = (roadmap) => {
    dispatch({
      type: 'SET_ROADMAP',
      payload: roadmap,
    });
  };

  const setAtsResult = (atsData) => {
    dispatch({
      type: 'SET_ATS_RESULT',
      payload: atsData,
    });
  };

  const updateSkillStatus = async ({
    roadmapId,
    skillName,
    phaseNumber,
    status,
  }) => {
    dispatch({
      type: 'UPDATE_SKILL_PROGRESS',
      payload: {
        skillName,
        status,
      },
    });

    try {
      await resumeApi.updateSkillProgress({
        roadmapId:
          roadmapId ||
          state.roadmapId ||
          state.roadmapResult?.roleId ||
          'default_roadmap',

        skillName,
        phaseNumber,
        status,
      });
    } catch (error) {
      // Keep the progress locally if the API is unavailable.
      console.warn(
        'Unable to sync roadmap progress to the backend.',
        error?.message ?? error
      );
    }
  };

  const clearSession = () => {
    try {
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.warn(
        'Unable to clear the current user’s cache.',
        error
      );
    }

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
    throw new Error(
      'useResume must be used within a ResumeProvider'
    );
  }

  return context;
};

export default ResumeContext;