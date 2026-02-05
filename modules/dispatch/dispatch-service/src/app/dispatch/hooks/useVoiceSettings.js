'use client';

import { useState, useEffect } from 'react';
import { getAvailableVoices, speakText } from '../../../utils/speechUtils';

/**
 * Custom hook for voice settings functionality
 * @returns {Object} Voice settings state and controls
 */
export function useVoiceSettings() {
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceParams, setVoiceParams] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voiceURI: ''
  });
  const [availableVoices, setAvailableVoices] = useState([]);
  
  // Load saved voice settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('voiceSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setVoiceParams(prev => ({
            ...prev,
            ...parsedSettings
          }));
        } catch (err) {
          console.error('Error parsing saved voice settings:', err);
        }
      }
    }
  }, []);
  
  // Load available voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Get initial voices
      const voices = getAvailableVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        
        // Set default voice if no saved voice is available
        if (!voiceParams.voiceURI) {
          const defaultVoice = voices.find(voice => 
            voice.name.includes('Google US English Female') ||
            voice.name.includes('Microsoft Zira') ||
            voice.name.includes('Natural') ||
            voice.name.includes('Female') ||
            voice.name.includes('Google')
          );
          if (defaultVoice) {
            setVoiceParams(prev => {
              const newParams = { ...prev, voiceURI: defaultVoice.voiceURI };
              // Save to localStorage
              localStorage.setItem('voiceSettings', JSON.stringify(newParams));
              return newParams;
            });
          }
        }
      }
      
      // Listen for voices changed event
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = getAvailableVoices();
        setAvailableVoices(updatedVoices);
        
        // Set default voice if not already set
        if (!voiceParams.voiceURI && updatedVoices.length > 0) {
          const defaultVoice = updatedVoices.find(voice => 
            voice.name.includes('Google US English Female') ||
            voice.name.includes('Microsoft Zira') ||
            voice.name.includes('Natural') ||
            voice.name.includes('Female') ||
            voice.name.includes('Google')
          );
          if (defaultVoice) {
            setVoiceParams(prev => {
              const newParams = { ...prev, voiceURI: defaultVoice.voiceURI };
              // Save to localStorage
              localStorage.setItem('voiceSettings', JSON.stringify(newParams));
              return newParams;
            });
          }
        }
      };
    }
  }, [voiceParams.voiceURI]);
  
  const handleVoiceParamChange = (param, value) => {
    setVoiceParams(prev => {
      const newParams = { ...prev, [param]: value };
      // Save to localStorage
      localStorage.setItem('voiceSettings', JSON.stringify(newParams));
      return newParams;
    });
  };
  
  const toggleVoiceSettings = () => {
    setShowVoiceSettings(!showVoiceSettings);
  };
  
  const testVoice = () => {
    speakText("This is a test of the emergency dispatch voice.", () => {}, () => {}, voiceParams);
  };
  
  return {
    showVoiceSettings,
    voiceParams,
    availableVoices,
    handleVoiceParamChange,
    toggleVoiceSettings,
    testVoice
  };
} 