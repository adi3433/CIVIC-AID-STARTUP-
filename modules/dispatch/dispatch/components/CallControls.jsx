'use client';

/**
 * Call controls component for initiating, ending calls and recording
 */
export default function CallControls({ 
  callStatus, 
  initiateCall, 
  endCall, 
  resetCall,
  isRecording,
  startRecording,
  stopRecording,
  inputMode
}) {
  return (
    <div className="bg-gray-900 p-4 flex justify-center items-center gap-6 border-t border-gray-700">
      {callStatus === 'idle' && (
        <button
          onClick={initiateCall}
          className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center text-white hover:bg-cyan-700 shadow-lg transition-colors"
          aria-label="Start call"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
          </svg>
        </button>
      )}
      
      {(callStatus === 'connected' || callStatus === 'calling') && (
        <>
          <button
            onClick={endCall}
            className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 shadow-lg transition-colors"
            aria-label="End call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          
          {inputMode === 'unified' && !isRecording && callStatus === 'connected' && (
            <button
              onClick={startRecording}
              className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center text-white hover:bg-cyan-700 shadow-lg transition-colors relative overflow-hidden group"
              aria-label="Start recording"
            >
              {/* Pulsing circle animation */}
              <div className="absolute inset-0 bg-cyan-500 opacity-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-700"></div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 relative z-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </button>
          )}
          
          {inputMode === 'unified' && isRecording && (
            <button
              onClick={stopRecording}
              className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-white hover:bg-amber-600 shadow-lg transition-colors relative overflow-hidden"
              aria-label="Stop recording"
            >
              {/* Recording animation */}
              <div className="absolute inset-0 bg-amber-400 opacity-30 rounded-full animate-ping"></div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 relative z-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
              </svg>
            </button>
          )}
        </>
      )}
      
      {callStatus === 'ended' && (
        <button
          onClick={resetCall}
          className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 shadow-lg transition-colors"
        >
          New Call
        </button>
      )}
    </div>
  );
} 