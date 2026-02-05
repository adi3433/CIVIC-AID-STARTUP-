'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook for audio recording functionality
 * @returns {Object} Audio recording state and controls
 */
export function useAudioRecording() {
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [error, setError] = useState('');
  const [showWaveform, setShowWaveform] = useState(false);
  const [audioVisualization, setAudioVisualization] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Cleanup function for audio recording
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error('Error closing audio context:', err));
      }
    };
  }, []);
  
  const startAudioRecording = (onStopCallback) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Audio recording is not supported in this browser.');
      return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setIsRecordingAudio(true);
        setShowWaveform(true);
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        // Set up audio visualization
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const audioContext = audioContextRef.current;
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateVisualization = () => {
          if (!analyserRef.current) return;
          
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Create a simplified array for visualization (just 10 values)
          const simplifiedArray = Array.from({length: 10}, (_, i) => {
            const start = Math.floor(i * bufferLength / 10);
            const end = Math.floor((i + 1) * bufferLength / 10);
            let sum = 0;
            for (let j = start; j < end; j++) {
              sum += dataArray[j];
            }
            return Math.floor(sum / (end - start));
          });
          
          setAudioVisualization(simplifiedArray);
          animationFrameRef.current = requestAnimationFrame(updateVisualization);
        };
        
        updateVisualization();
        
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/mp3' });
          setAudioBlob(blob);
          setAudioChunks(chunks);
          setIsRecordingAudio(false);
          setShowWaveform(false);
          
          // Create a file from the blob
          const file = new File([blob], "recording.mp3", { type: 'audio/mp3' });
          setAudioFile(file);
          
          // Release the microphone
          stream.getTracks().forEach(track => track.stop());
          
          // Stop visualization
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          
          // Call the callback with the file
          if (onStopCallback && typeof onStopCallback === 'function') {
            onStopCallback(file);
          }
        };
        
        mediaRecorder.start();
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        setError('Error accessing microphone. Please check your permissions.');
      });
  };
  
  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      return file;
    } else {
      setError('Please select a valid audio file.');
      return null;
    }
  };
  
  return {
    isRecordingAudio,
    audioChunks,
    audioBlob,
    audioFile,
    error,
    showWaveform,
    audioVisualization,
    startAudioRecording,
    stopAudioRecording,
    handleFileChange,
    setError,
    setAudioFile
  };
} 