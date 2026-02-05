'use client';

import { useState } from 'react';
import { speakText, stopSpeaking } from '../../../utils/speechUtils';

/**
 * Custom hook for call state management
 * @returns {Object} Call state and controls
 */
export function useCallState() {
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, ended
  const [inputMode, setInputMode] = useState('unified'); // unified or text
  
  const initiateCall = (onConnected, voiceParams) => {
    setCallStatus('calling');
    
    // Simulate connecting to dispatch
    setTimeout(() => {
      setCallStatus('connected');
      
      // Add initial greeting to conversation
      const initialGreeting = "911 Emergency Dispatch. What's your emergency?";
      
      // Speak the greeting with voice parameters
      speakText(initialGreeting, () => {
        if (onConnected && typeof onConnected === 'function') {
          onConnected(initialGreeting);
        }
      }, () => {}, voiceParams);
    }, 2000);
  };
  
  const endCall = () => {
    setCallStatus('ended');
    stopSpeaking();
  };
  
  const toggleInputMode = () => {
    setInputMode(inputMode === 'unified' ? 'text' : 'unified');
  };
  
  const resetCall = () => {
    setCallStatus('idle');
  };
  
  return {
    callStatus,
    inputMode,
    initiateCall,
    endCall,
    toggleInputMode,
    resetCall,
    setCallStatus,
    setInputMode
  };
} 