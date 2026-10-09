import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LiveITCompanyBackground from './components/office/LiveITCompanyBackground';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ResumeProvider } from './context/ResumeContext';
import { VoiceProvider } from './context/VoiceContext';
import KirmadaVoiceHUD from './components/voice/KirmadaVoiceHUD';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import ATSScorePage from './pages/ATSScorePage';
import UploadResumePage from './pages/UploadResumePage';
import ResultsPage from './pages/ResultsPage';
import SkillGapPage from './pages/SkillGapPage';
import RoadmapPage from './pages/RoadmapPage';
import NotFoundPage from './pages/NotFoundPage';

function AnimatedAppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public & Core Workflow Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />

        {/* ATS Score Checker (Pre-application diagnostic) */}
        <Route path="/ats-score" element={<ATSScorePage />} />
        <Route path="/ats-checker" element={<ATSScorePage />} />

        {/* Workflow Pages */}
        <Route path="/upload" element={<UploadResumePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/skill-gap" element={<SkillGapPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <VoiceProvider>
      <ResumeProvider>
        <div className="flex flex-col min-h-screen bg-[#040711] text-slate-100 selection:bg-cyan-500 selection:text-navy-950 relative">
          {/* Live Animated IT Company Background */}
          <LiveITCompanyBackground />

          <Navbar />
          <div className="flex-1 relative z-10">
            <AnimatedAppRoutes />
          </div>
          <KirmadaVoiceHUD />
          <Footer />
        </div>
      </ResumeProvider>
    </VoiceProvider>
  );
}

export default App;
