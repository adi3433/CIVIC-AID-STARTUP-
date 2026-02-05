'use client';

/**
 * Voice settings panel component
 */
export default function VoiceSettings({ 
  showVoiceSettings, 
  voiceParams, 
  availableVoices, 
  handleVoiceParamChange, 
  toggleVoiceSettings,
  testVoice
}) {
  if (!showVoiceSettings) return null;
  
  return (
    <div className="bg-gray-800 p-4 border-b border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-cyan-400">Voice Settings</h3>
        <button 
          onClick={toggleVoiceSettings}
          className="text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Close voice settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Voice Selection */}
        <div>
          <label htmlFor="voice-select" className="block text-xs font-medium text-gray-300 mb-1">Voice</label>
          <select
            id="voice-select"
            value={voiceParams.voiceURI}
            onChange={(e) => handleVoiceParamChange('voiceURI', e.target.value)}
            className="w-full text-sm rounded-md border-gray-700 bg-gray-700 text-gray-100 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
          >
            {availableVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
        
        {/* Rate Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="rate-slider" className="block text-xs font-medium text-gray-300">Speed: {voiceParams.rate.toFixed(1)}x</label>
            <button 
              onClick={() => handleVoiceParamChange('rate', 1.0)}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Reset
            </button>
          </div>
          <input
            id="rate-slider"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceParams.rate}
            onChange={(e) => handleVoiceParamChange('rate', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>
        
        {/* Pitch Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="pitch-slider" className="block text-xs font-medium text-gray-300">Pitch: {voiceParams.pitch.toFixed(1)}</label>
            <button 
              onClick={() => handleVoiceParamChange('pitch', 1.0)}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Reset
            </button>
          </div>
          <input
            id="pitch-slider"
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={voiceParams.pitch}
            onChange={(e) => handleVoiceParamChange('pitch', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
        
        {/* Volume Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="volume-slider" className="block text-xs font-medium text-gray-300">Volume: {Math.round(voiceParams.volume * 100)}%</label>
            <button 
              onClick={() => handleVoiceParamChange('volume', 1.0)}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Reset
            </button>
          </div>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={voiceParams.volume}
            onChange={(e) => handleVoiceParamChange('volume', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Quiet</span>
            <span>Loud</span>
          </div>
        </div>
        
        {/* Test Voice Button */}
        <button
          onClick={testVoice}
          className="w-full py-2 bg-cyan-600 text-white text-sm rounded-md hover:bg-cyan-700 transition-colors"
        >
          Test Voice
        </button>
      </div>
    </div>
  );
} 