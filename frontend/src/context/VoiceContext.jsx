import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('kirmada_voice_muted') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [currentSpeech, setCurrentSpeech] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const selectedVoiceRef = useRef(null);

  // Load voices and select preferred executive male English voice
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceAvailable(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const preferred = voices.find((v) => 
        v.lang.startsWith('en') && (
          v.name.includes('David') || 
          v.name.includes('Guy') || 
          v.name.includes('Daniel') || 
          v.name.includes('Male') || 
          v.name.includes('George') || 
          v.name.includes('Ryan') || 
          v.name.includes('Natural') || 
          v.name.includes('Google US English')
        )
      ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

      selectedVoiceRef.current = preferred;
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    setCurrentSpeech(text);

    if (isMuted) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }
      utterance.lang = 'en-US';
      utterance.rate = 1.0; // Clear executive cadence
      utterance.pitch = 0.92; // Deep authoritative male pitch for Kirmada

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Voice synthesis error:', e);
      setIsSpeaking(false);
    }
  }, [isMuted]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kirmada_voice_muted', String(next));
      } catch (e) {}

      if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  const replay = useCallback(() => {
    if (currentSpeech) {
      speak(currentSpeech);
    }
  }, [currentSpeech, speak]);

  return (
    <VoiceContext.Provider
      value={{
        isSpeaking,
        isMuted,
        voiceAvailable,
        currentSpeech,
        speak,
        stop,
        toggleMute,
        replay,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoiceAssistant = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoiceAssistant must be used within a VoiceProvider');
  }
  return context;
};

export default VoiceContext;
