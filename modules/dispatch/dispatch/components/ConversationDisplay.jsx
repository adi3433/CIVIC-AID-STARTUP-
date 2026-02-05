'use client';

import { useRef, useEffect } from 'react';

/**
 * Conversation display component
 */
export default function ConversationDisplay({ 
  conversationHistory, 
  callStatus, 
  showWaveform,
  transcript,
  liveTranscript,
  audioVisualization,
  isSpeaking,
  error,
  streamingResponse
}) {
  const conversationContainerRef = useRef(null);
  
  // Scroll to bottom of conversation when it updates
  useEffect(() => {
    if (conversationContainerRef.current) {
      conversationContainerRef.current.scrollTop = conversationContainerRef.current.scrollHeight;
    }
  }, [conversationHistory, showWaveform, isSpeaking, error, streamingResponse]);
  
  return (
    <div 
      ref={conversationContainerRef}
      className="flex-1 p-4 overflow-y-auto bg-gray-800 space-y-3"
    >
      {conversationHistory.length > 0 ? (
        conversationHistory.map((message, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg max-w-[85%] ${
              message.role === 'user' 
                ? 'bg-gray-700 ml-auto text-gray-100 border border-gray-600' 
                : message.role === 'system'
                  ? 'bg-gray-900 mx-auto text-cyan-300 text-center border border-gray-700'
                  : 'bg-gray-900 text-cyan-100 border border-gray-700'
            }`}
          >
            {message.isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium">{typeof message.content === 'function' ? 'Processing...' : message.content}</p>
              </div>
            ) : message.isAudio ? (
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-cyan-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
                <p className="text-sm font-medium">{typeof message.content === 'function' ? 'Message content unavailable' : message.content}</p>
              </div>
            ) : message.isStreaming && index === conversationHistory.length - 1 ? (
              <div className="text-sm">
                <p>{streamingResponse}<span className="animate-pulse text-cyan-400">▋</span></p>
                {isSpeaking && (
                  <div className="flex items-center mt-1 text-xs text-cyan-300">
                    <span className="mr-1">Speaking</span>
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm">{typeof message.content === 'function' ? 'Message content unavailable' : message.content}</p>
            )}
          </div>
        ))
      ) : (
        <>
          {callStatus === 'idle' && (
            <div className="text-center p-4">
              <p className="text-gray-400">Press the call button to connect to AI dispatch</p>
            </div>
          )}
          
          {callStatus === 'calling' && (
            <div className="text-center p-4">
              <p className="text-gray-400">Connecting to AI dispatch...</p>
            </div>
          )}
        </>
      )}
      
      {/* Enhanced recording visualization */}
      {showWaveform && (
        <div className="bg-gray-700 p-3 rounded-lg max-w-[85%] ml-auto border border-gray-600 text-cyan-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <p className="text-xs font-medium text-cyan-300">Recording...</p>
          </div>
          
          {/* Audio waveform visualization */}
          <div className="flex items-center justify-center h-12 mb-2">
            {audioVisualization.length > 0 ? (
              <div className="flex items-center justify-center gap-1 h-full w-full">
                {audioVisualization.map((value, i) => (
                  <div 
                    key={i}
                    className="bg-cyan-400 rounded-full w-1"
                    style={{ 
                      height: `${Math.max(15, value / 2)}%`,
                      animation: 'pulse 1s infinite',
                      animationDelay: `${i * 0.1}s`
                    }}
                  ></div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 h-full w-full">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i}
                    className="bg-cyan-400 rounded-full w-1"
                    style={{ 
                      height: `${20 + Math.random() * 60}%`,
                      animation: 'pulse 1s infinite',
                      animationDelay: `${i * 0.1}s`
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>
          
          {/* Live transcript */}
          <div className="text-sm font-medium">
            {transcript && <p className="mb-1">{transcript}</p>}
            {liveTranscript && (
              <p className="text-cyan-300 italic">{liveTranscript}</p>
            )}
            {!transcript && !liveTranscript && (
              <p className="text-cyan-300 italic">Speak now...</p>
            )}
          </div>
        </div>
      )}
      
      {/* Only show this if we're speaking but not streaming text */}
      {isSpeaking && !streamingResponse && conversationHistory.length > 0 && !conversationHistory[conversationHistory.length - 1].isStreaming && (
        <div className="p-3 rounded-lg bg-gray-900 mr-auto max-w-[80%] text-cyan-100 border border-gray-700">
          <div className="flex items-center">
            <div className="mr-2">Dispatch speaking</div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-gray-900 p-3 rounded-lg text-red-400 text-sm border border-red-900">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p>{typeof error === 'function' ? 'Error occurred' : error}</p>
          </div>
        </div>
      )}
      
      {callStatus === 'ended' && conversationHistory.length === 0 && (
        <div className="text-center p-4">
          <p className="text-gray-400">Call has ended</p>
        </div>
      )}
    </div>
  );
} 