import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Sparkles, FileText } from 'lucide-react';
import { sampleParsedResume, mockPredictedRoles } from '../../api/mockData';

/**
 * Graceful fallback card for pages reached directly without required route state
 */
export const StateFallback = ({
  pageTitle = 'Information Missing',
  message = 'This page requires data from a previous step (such as an uploaded resume or a selected target role).',
  primaryActionPath = '/upload',
  primaryActionLabel = 'Upload Your Resume',
  secondaryActionPath = null,
  secondaryActionLabel = null,
  allowSampleData = true,
  onLoadSample = null,
  sampleType = 'resume' // 'resume' | 'role'
}) => {
  const navigate = useNavigate();

  const handleUseDemoSample = () => {
    if (onLoadSample) {
      onLoadSample();
      return;
    }

    if (sampleType === 'resume') {
      navigate('/results', {
        state: {
          resumeData: sampleParsedResume,
          isSample: true
        }
      });
    } else if (sampleType === 'role') {
      navigate('/skill-gap', {
        state: {
          role: mockPredictedRoles[0],
          userSkills: sampleParsedResume.skills,
          resumeData: sampleParsedResume
        }
      });
    } else if (sampleType === 'roadmap') {
      navigate('/roadmap', {
        state: {
          role: mockPredictedRoles[0],
          userSkills: sampleParsedResume.skills,
          missingSkills: [
            { name: 'LangChain & LlamaIndex' },
            { name: 'Vector Databases (Pinecone/pgvector)' },
            { name: 'RAG Architectures' }
          ],
          partialSkills: [
            { name: 'Python for AI Scripting' },
            { name: 'Docker Containerization' }
          ]
        }
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-navy-900/90 border border-brand-gold/30 shadow-card-dark text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-gold/15 border border-brand-gold/40 flex items-center justify-center mx-auto mb-5 shadow-glow-gold/20">
        <AlertTriangle className="w-8 h-8 text-brand-gold" />
      </div>

      <h2 className="font-heading text-2xl font-bold text-slate-100 mb-2">
        {pageTitle}
      </h2>

      <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-6">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
        <Link
          to={primaryActionPath}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-medium text-sm transition-all shadow-glow-blue focus-visible:ring-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {primaryActionLabel}
        </Link>

        {allowSampleData && (
          <button
            type="button"
            onClick={handleUseDemoSample}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 border border-navy-700 hover:border-brand-blue/50 font-medium text-sm transition-all focus-visible:ring-2"
          >
            <Sparkles className="w-4 h-4 text-brand-gold" />
            Quick Demo with Sample Profile
          </button>
        )}

        {secondaryActionPath && (
          <Link
            to={secondaryActionPath}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-transparent hover:bg-navy-800 text-slate-400 hover:text-slate-200 text-sm transition-colors focus-visible:ring-2"
          >
            {secondaryActionLabel}
          </Link>
        )}
      </div>
    </div>
  );
};

export default StateFallback;
