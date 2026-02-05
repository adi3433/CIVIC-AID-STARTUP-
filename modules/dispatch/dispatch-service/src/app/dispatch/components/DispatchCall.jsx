'use client';

import { useState, useRef, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useAIProcessing } from '../hooks/useAIProcessing';
import { useVoiceSettings } from '../hooks/useVoiceSettings';
import { useCallState } from '../hooks/useCallState';
import { stopSpeaking } from '../../../utils/speechUtils';

// Import components
import VoiceSettings from './VoiceSettings';
import ConversationDisplay from './ConversationDisplay';
import TextInput from './TextInput';
import CallControls from './CallControls';
import StatusBar from './StatusBar';

/**
 * Main DispatchCall component that integrates all other components
 */
export default function DispatchCall() {
  const [textInput, setTextInput] = useState('');
  const [textInputFocused, setTextInputFocused] = useState(false);
  const audioInputRef = useRef(null);
  const textInputRef = useRef(null);
  
  // Initialize hooks
  const {
    isListening,
    transcript,
    liveTranscript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    setError: setSpeechError
  } = useSpeechRecognition();
  
  const {
    isRecordingAudio,
    audioVisualization,
    showWaveform,
    audioFile,
    error: audioError,
    startAudioRecording,
    stopAudioRecording,
    handleFileChange,
    setError: setAudioError,
    setAudioFile
  } = useAudioRecording();
  
  const {
    aiResponse,
    isProcessing,
    isUploading,
    error: aiError,
    conversationHistory,
    isSpeaking,
    isProcessingText,
    streamingResponse,
    uploadAudio,
    processTranscript,
    processTextInput,
    setError: setAiError,
    setConversationHistory
  } = useAIProcessing();
  
  const {
    showVoiceSettings,
    voiceParams,
    availableVoices,
    handleVoiceParamChange,
    toggleVoiceSettings,
    testVoice
  } = useVoiceSettings();
  
  const {
    callStatus,
    inputMode,
    initiateCall,
    endCall,
    resetCall,
    setInputMode
  } = useCallState();
  
  // Combine errors from different sources
  const error = speechError || audioError || aiError;
  
  // Handle text input focus/blur to switch modes
  const handleTextInputFocus = () => {
    setTextInputFocused(true);
    if (inputMode === 'unified' && callStatus === 'connected') {
      setInputMode('text');
      
      // Stop any ongoing recording when switching to text mode
      if (isListening || isRecordingAudio) {
        stopRecording();
      }
    }
  };
  
  const handleTextInputBlur = () => {
    setTextInputFocused(false);
    // Only switch back to unified mode if the text input is empty
    if (inputMode === 'text' && !textInput.trim() && callStatus === 'connected') {
      setInputMode('unified');
    }
  };
  
  // Handle recording start/stop
  const startRecording = () => {
    resetTranscript();
    startListening();
    startAudioRecording((recordedFile) => {
      // This callback is called when audio recording stops
      uploadAudio(recordedFile, transcript, voiceParams);
    });
  };
  
  const stopRecording = () => {
    stopListening();
    stopAudioRecording();
  };
  
  // Handle call initiation
  const handleInitiateCall = () => {
    initiateCall((initialGreeting) => {
      // Add initial greeting to conversation history
      setConversationHistory([{ role: 'assistant', content: initialGreeting }]);
      
      // Start recording if in unified mode
      if (inputMode === 'unified') {
        startRecording();
      }
    }, voiceParams);
  };
  
  // Handle call end
  const handleEndCall = () => {
    if (inputMode === 'unified') {
      stopRecording();
    }
    endCall();
    stopSpeaking();
  };
  
  // Handle text input submission
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    await processTextInput(textInput, voiceParams);
    setTextInput('');
    
    // Focus back on the text input after submission
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };
  
  // Auto-focus text input when switching to text mode
  useEffect(() => {
    if (inputMode === 'text' && textInputRef.current && callStatus === 'connected') {
      textInputRef.current.focus();
    }
  }, [inputMode, callStatus]);
  
  return (
    <div className="max-w-md mx-auto p-4 min-h-screen flex flex-col bg-gray-900 text-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-center text-cyan-400">Emergency Dispatch AI</h1>
      
      <div className="flex-1 flex flex-col">
        {/* Phone UI */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col flex-1 border border-gray-700">
          {/* Status Bar */}
          <StatusBar 
            callStatus={callStatus}
            toggleVoiceSettings={toggleVoiceSettings}
            inputMode={inputMode}
            isRecording={isListening}
            isProcessing={isProcessing}
            isUploading={isUploading}
            isRecordingAudio={isRecordingAudio}
          />
          
          {/* Voice Settings */}
          <VoiceSettings 
            showVoiceSettings={showVoiceSettings}
            voiceParams={voiceParams}
            availableVoices={availableVoices}
            handleVoiceParamChange={handleVoiceParamChange}
            toggleVoiceSettings={toggleVoiceSettings}
            testVoice={testVoice}
          />
          
          {/* Conversation Display */}
          <ConversationDisplay 
            conversationHistory={conversationHistory}
            callStatus={callStatus}
            showWaveform={showWaveform}
            transcript={transcript}
            liveTranscript={liveTranscript}
            audioVisualization={audioVisualization}
            isSpeaking={isSpeaking}
            error={error}
            streamingResponse={streamingResponse}
          />
          
          {/* Text Input - Always visible when connected */}
          {callStatus === 'connected' && (
            <TextInput 
              textInput={textInput}
              setTextInput={setTextInput}
              handleTextSubmit={handleTextSubmit}
              isProcessingText={isProcessingText}
              onFocus={handleTextInputFocus}
              onBlur={handleTextInputBlur}
              ref={textInputRef}
            />
          )}
          
          {/* Call Controls */}
          <CallControls 
            callStatus={callStatus}
            initiateCall={handleInitiateCall}
            endCall={handleEndCall}
            resetCall={resetCall}
            isRecording={isListening}
            startRecording={startRecording}
            stopRecording={stopRecording}
            inputMode={inputMode}
          />
        </div>
      </div>
      
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scaleY(0.7); }
          50% { transform: scaleY(1); }
          100% { transform: scaleY(0.7); }
        }
        
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #22d3ee;
          cursor: pointer;
        }
        
        input[type=range]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #22d3ee;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
} 