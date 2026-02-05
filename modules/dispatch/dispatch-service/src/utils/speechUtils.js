/**
 * Initializes speech recognition
 * @returns {SpeechRecognition|null} Speech recognition object or null if not supported
 */
export function initSpeechRecognition() {
  if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    return recognition;
  }
  return null;
}

// Global variable to track the current utterance
let currentUtterance = null;

/**
 * Gets all available speech synthesis voices
 * @returns {Array} Array of available voices
 */
export function getAvailableVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  
  return window.speechSynthesis.getVoices();
}

/**
 * Sets the preferred voice for speech synthesis
 * @param {SpeechSynthesisUtterance} utterance - The utterance to set the voice for
 * @param {Array} voices - Available voices
 * @param {string} voiceURI - Optional voice URI to use
 */
function setPreferredVoice(utterance, voices, voiceURI = null) {
  // If a specific voice URI is provided, try to use it
  if (voiceURI) {
    const requestedVoice = voices.find(voice => voice.voiceURI === voiceURI);
    if (requestedVoice) {
      utterance.voice = requestedVoice;
      return;
    }
  }
  
  // Try to find a good voice in this order of preference
  const preferredVoice = voices.find(voice => 
    voice.name.includes('Google US English Female') ||
    voice.name.includes('Microsoft Zira') ||
    voice.name.includes('Natural') ||
    voice.name.includes('Female') ||
    voice.name.includes('Google')
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
}

/**
 * Stops any ongoing speech synthesis
 */
export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

/**
 * Checks if speech synthesis is currently speaking
 * @returns {boolean} True if speaking, false otherwise
 */
export function isSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

/**
 * Speaks text using the Web Speech API
 * @param {string} text - Text to speak
 * @param {Function} onEnd - Callback function to execute when speech ends
 * @param {Function} onStart - Callback function to execute when speech starts
 * @param {Object} voiceParams - Parameters for the speech synthesis
 * @param {number} voiceParams.rate - Speech rate (0.1 to 10)
 * @param {number} voiceParams.pitch - Speech pitch (0 to 2)
 * @param {number} voiceParams.volume - Speech volume (0 to 1)
 * @param {string} voiceParams.voiceURI - Voice URI to use
 * @returns {SpeechSynthesisUtterance|null} The utterance object or null if not supported
 */
export function speakText(text, onEnd = () => {}, onStart = () => {}, voiceParams = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported in this browser');
    if (onEnd && typeof onEnd === 'function') {
      onEnd();
    }
    return null;
  }
  
  // Stop any ongoing speech
  stopSpeaking();
  
  // Handle case where text might be a function
  const textToSpeak = typeof text === 'function' ? 'Sorry, there was an error processing the response.' : text;
  
  // Create a new utterance
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  
  // Set voice if provided
  if (voiceParams.voiceURI) {
    const voices = window.speechSynthesis.getVoices();
    setPreferredVoice(utterance, voices, voiceParams.voiceURI);
  }
  
  // Set other parameters with bounds
  utterance.rate = Math.min(Math.max(voiceParams.rate || 1.0, 0.1), 10);
  utterance.pitch = Math.min(Math.max(voiceParams.pitch || 1.0, 0), 2);
  utterance.volume = Math.min(Math.max(voiceParams.volume || 1.0, 0), 1);
  
  // Set event handlers
  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd && typeof onEnd === 'function') {
      onEnd();
    }
  };
  
  utterance.onstart = () => {
    if (onStart && typeof onStart === 'function') {
      onStart();
    }
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    currentUtterance = null;
    if (onEnd && typeof onEnd === 'function') {
      onEnd();
    }
  };
  
  // Store the current utterance
  currentUtterance = utterance;
  
  // Chrome bug workaround: sometimes speech synthesis gets stuck
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  } else {
    window.speechSynthesis.speak(utterance);
  }
  
  // Chrome bug workaround: speech can stop after ~15 seconds
  // We'll periodically pause and resume to keep it going
  const resumeSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
      setTimeout(resumeSpeaking, 5000);
    }
  };
  
  setTimeout(resumeSpeaking, 5000);
  
  return utterance;
} 