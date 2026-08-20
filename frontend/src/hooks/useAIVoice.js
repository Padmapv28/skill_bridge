import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for Kirmada's Authoritative Male AI Executive Voice Narration (English)
 */
export const useAIVoice = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const selectedVoiceRef = useRef(null);

  // Select a commanding, natural male English voice
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceAvailable(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Prioritize natural, commanding male English voices
      const preferred = voices.find(v => 
        (v.lang.startsWith('en') && (
          v.name.includes('David') || 
          v.name.includes('Guy') || 
          v.name.includes('Daniel') || 
          v.name.includes('Male') || 
          v.name.includes('George') || 
          v.name.includes('Ryan') || 
          v.name.includes('Natural') || 
          v.name.includes('Google US English')
        ))
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

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
    if (isMuted || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Reset previous utterance

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }
      utterance.lang = 'en-US';
      utterance.rate = 0.98; // Authoritative, measured executive delivery
      utterance.pitch = 0.92; // Deep, confident male resonance

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Kirmada voice synthesis error:', e);
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
      if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  return {
    isSpeaking,
    isMuted,
    voiceAvailable,
    speak,
    stop,
    toggleMute,
  };
};

export default useAIVoice;
