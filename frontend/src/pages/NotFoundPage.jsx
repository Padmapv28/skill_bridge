import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';

export const NotFoundPage = () => {
  return (
    <PageWrapper className="flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-blue/15 border border-brand-blue/40 flex items-center justify-center mx-auto shadow-glow-blue">
          <Sparkles className="w-8 h-8 text-brand-blue-light" />
        </div>

        <div className="space-y-2">
          <h1 className="font-mono text-5xl font-extrabold text-white tracking-tight">404</h1>
          <h2 className="font-heading text-2xl font-bold text-slate-100">Page Not Found</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            The page you're looking for doesn't exist or has been relocated within the Resume AI platform.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-medium text-sm shadow-glow-blue transition-all"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-200 border border-navy-700 text-sm font-medium transition-colors"
          >
            Analyze Resume
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
};

export default NotFoundPage;
