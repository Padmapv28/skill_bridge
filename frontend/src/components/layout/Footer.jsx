import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Terminal, Shield, Award, Github, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-navy-800 bg-navy-950/90 py-12 px-4 sm:px-6 lg:px-8 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand Column */}
        <div className="md:col-span-1 space-y-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center shadow-glow-blue">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-slate-100 text-base">
              Resume <span className="text-brand-blue-light">AI</span>
            </span>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            AI-powered career acceleration engine. Predict high-leverage roles, pinpoint skill gaps, and execute personalized learning roadmaps.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Core Models & API v2.4 Online
          </div>
        </div>

        {/* Product Links */}
        <div>
          <h4 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
            Product Platform
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/upload" className="hover:text-brand-blue-light transition-colors">
                Resume Intelligence Engine
              </Link>
            </li>
            <li>
              <Link to="/results" className="hover:text-brand-blue-light transition-colors">
                Predictive Role Matching
              </Link>
            </li>
            <li>
              <Link to="/skill-gap" className="hover:text-brand-blue-light transition-colors">
                Skill Gap Benchmark
              </Link>
            </li>
            <li>
              <Link to="/roadmap" className="hover:text-brand-blue-light transition-colors">
                3-Phase Learning Roadmap
              </Link>
            </li>
          </ul>
        </div>

        {/* Architecture & Tech */}
        <div>
          <h4 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
            Technology Stack
          </h4>
          <ul className="space-y-2 text-xs font-mono">
            <li className="flex items-center gap-2 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
              React 18 + Vite
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Three.js + React Three Fiber
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Tailwind CSS Dark Tokens
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              JWT Auth + Axios Interceptors
            </li>
          </ul>
        </div>

        {/* Security & System */}
        <div>
          <h4 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
            Security & Privacy
          </h4>
          <div className="p-3.5 rounded-xl bg-navy-900/60 border border-navy-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <Shield className="w-4 h-4 text-brand-blue-light" />
              <span>Zero Data Resale Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Resume files are parsed securely in-memory and sanitized before prediction scoring.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Resume AI. Built with precision for top-tier software engineers.</p>
        <div className="flex items-center gap-6">
          <span className="hover:text-slate-400 transition-colors">Privacy Policy</span>
          <span className="hover:text-slate-400 transition-colors">Terms of Service</span>
          <span className="hover:text-slate-400 transition-colors">API Status</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
