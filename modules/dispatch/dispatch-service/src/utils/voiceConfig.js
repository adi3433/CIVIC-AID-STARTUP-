const VOICE_CONFIG_KEY = 'dispatch_voice_settings';

export function saveVoiceSettings(settings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VOICE_CONFIG_KEY, JSON.stringify(settings));
  }
}

export function loadVoiceSettings() {
  if (typeof window !== 'undefined') {
    const savedSettings = localStorage.getItem(VOICE_CONFIG_KEY);
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (err) {
        console.error('Error parsing voice settings:', err);
      }
    }
  }
  
  // Default settings
  return {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voiceURI: '',
    isDarkMode: true
  };
} 