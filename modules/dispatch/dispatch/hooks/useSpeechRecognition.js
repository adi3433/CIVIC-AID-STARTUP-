'use client';

import { useState, useRef, useEffect } from 'react';
import { initSpeechRecognition } from '../../../utils/speechUtils';

/**
 * Custom hook for speech recognition functionality
 * @returns {Object} Speech recognition state and controls
 */
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);
  
  // Initialize speech recognition
  useEffect(() => {
    recognitionRef.current = initSpeechRecognition();
    
    if (recognitionRef.current) {
      // Set continuous to true for continuous recording
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update live transcript for display
        setLiveTranscript(interimTranscript);
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript.trim() + ' ');
          setLiveTranscript(''); // Clear interim transcript when final is available
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError(`Speech recognition error: ${event.error}`);
        stopListening();
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.error('Error restarting recognition:', err);
          }
        }
      };
    } else {
      setError('Speech recognition is not supported in this browser.');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);
  
  const startListening = () => {
    setIsListening(true);
    setTranscript('');
    setError('');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };
  
  const stopListening = () => {
    setIsListening(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  };
  
  const resetTranscript = () => {
    setTranscript('');
    setLiveTranscript('');
  };
  
  return {
    isListening,
    transcript,
    liveTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setError
  };
} 